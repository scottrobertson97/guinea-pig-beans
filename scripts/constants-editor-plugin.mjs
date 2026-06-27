import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const ROUTE_PAGE = "/constants";
const ROUTE_API = "/__gpb_constants";
const BALANCE_FILE = "src/simulation/balance.ts";

const EDITABLE_OBJECTS = new Map([
  ["PIG_ACTIVITY_WEIGHTS", "Pig Activity Weights"],
  ["PIG_LIFECYCLE_THRESHOLDS", "Pig Lifecycle Thresholds"],
  ["FURNITURE_SPACE_COSTS", "Furniture Space Costs"],
  ["ABILITY_SQUEAK_COSTS", "Ability Squeak Costs"],
  ["baseCosts", "Furniture Base Costs"],
]);

const EXCLUDED_TOP_LEVEL = new Set([
  "FURNITURE_SYNERGIES",
  "WISDOM_PERKS",
  "WISDOM_SPECIALIZATIONS",
]);

export function constantsEditorPlugin() {
  let serverRef;

  return {
    name: "gpb-constants-editor",
    apply: "serve",
    configureServer(server) {
      serverRef = server;
      const root = server.config.root;
      const balancePath = path.resolve(root, BALANCE_FILE);

      server.middlewares.use(async (req, res, next) => {
        const requestUrl = new URL(req.url ?? "/", "http://localhost");
        const pathname = requestUrl.pathname;

        if (pathname !== ROUTE_PAGE && pathname !== `${ROUTE_PAGE}/` && !pathname.startsWith(ROUTE_API)) {
          next();
          return;
        }

        if (!isLocalDevRequest(req)) {
          sendJson(res, 403, { error: "Constants editing is restricted to local dev requests." });
          return;
        }

        try {
          if (req.method === "GET" && (pathname === ROUTE_PAGE || pathname === `${ROUTE_PAGE}/`)) {
            sendHtml(res, constantsDashboardHtml());
            return;
          }

          if (req.method === "GET" && pathname === ROUTE_API) {
            const text = await fs.readFile(balancePath, "utf8");
            sendJson(res, 200, buildCatalog(text));
            return;
          }

          if (req.method === "PUT" && pathname.startsWith(`${ROUTE_API}/`)) {
            const id = decodeURIComponent(pathname.slice(`${ROUTE_API}/`.length));
            const body = await readJsonBody(req);
            const result = await updateConstant(balancePath, id, body);
            serverRef.ws.send({ type: "full-reload", path: "*" });
            sendJson(res, 200, result);
            return;
          }

          sendJson(res, 405, { error: "Unsupported constants dashboard method." });
        } catch (error) {
          const status = Number.isInteger(error.status) ? error.status : 500;
          sendJson(res, status, { error: error.message || "Constants dashboard request failed." });
        }
      });
    },
  };
}

async function updateConstant(balancePath, id, body) {
  if (!body || typeof body !== "object") {
    throw httpError(400, "Expected a JSON request body.");
  }

  if (typeof body.hash !== "string" || body.hash.length === 0) {
    throw httpError(400, "Expected a source hash.");
  }

  const text = await fs.readFile(balancePath, "utf8");
  const currentHash = hashText(text);
  if (body.hash !== currentHash) {
    throw httpError(409, "The constants file changed. Refresh before saving this field.");
  }

  const catalog = buildCatalog(text);
  const item = catalog.items.find((candidate) => candidate.id === id);
  if (!item) {
    throw httpError(404, `Unknown editable constant: ${id}`);
  }

  const replacement = toReplacementLiteral(item, body.value);
  const updatedText = `${text.slice(0, item.range.start)}${replacement}${text.slice(item.range.end)}`;
  const parseCheck = parseSource(updatedText);

  if (parseCheck.parseDiagnostics.length > 0) {
    const first = parseCheck.parseDiagnostics[0];
    throw httpError(400, `Generated source did not parse: ${diagnosticText(first)}`);
  }

  const tempPath = `${balancePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tempPath, updatedText, "utf8");
    await fs.rename(tempPath, balancePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }

  const freshText = await fs.readFile(balancePath, "utf8");
  const freshCatalog = buildCatalog(freshText);
  const updatedItem = freshCatalog.items.find((candidate) => candidate.id === id);

  return {
    ok: true,
    hash: freshCatalog.hash,
    item: withoutRange(updatedItem),
  };
}

function buildCatalog(text) {
  const sourceFile = parseSource(text);
  const items = [];

  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      collectVariableItems(sourceFile, node, items);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  items.sort((left, right) => {
    const groupCompare = left.group.localeCompare(right.group);
    return groupCompare === 0 ? left.id.localeCompare(right.id) : groupCompare;
  });

  const groups = [];
  for (const item of items) {
    let group = groups.find((candidate) => candidate.id === item.group);
    if (!group) {
      group = { id: item.group, label: item.groupLabel, items: [] };
      groups.push(group);
    }
    group.items.push(withoutRange(item));
  }

  return {
    file: BALANCE_FILE,
    hash: hashText(text),
    groups,
    items,
  };
}

function collectVariableItems(sourceFile, node, items) {
  const name = node.name.text;
  if (EXCLUDED_TOP_LEVEL.has(name)) {
    return;
  }

  const initializer = unwrapExpression(node.initializer);
  if (EDITABLE_OBJECTS.has(name) && ts.isObjectLiteralExpression(initializer)) {
    collectObjectLiteralItems(sourceFile, name, name, EDITABLE_OBJECTS.get(name), [], initializer, items);
    return;
  }

  if (!isExportedTopLevelVariable(node)) {
    return;
  }

  const scalar = readScalarLiteral(sourceFile, initializer);
  if (!scalar) {
    return;
  }

  items.push({
    id: name,
    constant: name,
    path: [],
    name,
    group: "Scalars",
    groupLabel: "Scalars",
    type: scalar.type,
    value: scalar.value,
    literal: scalar.literal,
    line: scalar.line,
    range: scalar.range,
  });
}

function collectObjectLiteralItems(sourceFile, idPrefix, constantName, groupLabel, keyPath, objectLiteral, items) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }

    const key = propertyName(property.name);
    if (!key) {
      continue;
    }

    const nextPath = [...keyPath, key];
    const value = unwrapExpression(property.initializer);
    const scalar = readScalarLiteral(sourceFile, value);

    if (scalar) {
      items.push({
        id: `${idPrefix}.${nextPath.join(".")}`,
        constant: constantName,
        path: nextPath,
        name: nextPath[nextPath.length - 1],
        group: constantName,
        groupLabel,
        type: scalar.type,
        value: scalar.value,
        literal: scalar.literal,
        line: scalar.line,
        range: scalar.range,
      });
      continue;
    }

    if (ts.isObjectLiteralExpression(value)) {
      collectObjectLiteralItems(sourceFile, idPrefix, constantName, groupLabel, nextPath, value, items);
    }
  }
}

function isExportedTopLevelVariable(node) {
  const declarationList = node.parent;
  const statement = declarationList?.parent;

  return (
    statement &&
    ts.isVariableStatement(statement) &&
    statement.parent &&
    ts.isSourceFile(statement.parent) &&
    statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function isSatisfiesExpression(node) {
  return typeof ts.isSatisfiesExpression === "function" && ts.isSatisfiesExpression(node);
}

function readScalarLiteral(sourceFile, expression) {
  const node = unwrapExpression(expression);

  if (ts.isNumericLiteral(node)) {
    return scalarResult(sourceFile, node, "number", Number(node.text), node.getText(sourceFile));
  }

  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const multiplier = node.operator === ts.SyntaxKind.MinusToken ? -1 : 1;
    return scalarResult(sourceFile, node, "number", multiplier * Number(node.operand.text), node.getText(sourceFile));
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) {
    return scalarResult(sourceFile, node, "boolean", node.kind === ts.SyntaxKind.TrueKeyword, node.getText(sourceFile));
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return scalarResult(sourceFile, node, "string", node.text, node.getText(sourceFile));
  }

  return null;
}

function scalarResult(sourceFile, node, type, value, literal) {
  const start = node.getStart(sourceFile);
  const end = node.getEnd();
  const line = sourceFile.getLineAndCharacterOfPosition(start).line + 1;

  return {
    type,
    value,
    literal,
    line,
    range: { start, end },
  };
}

function propertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return null;
}

function toReplacementLiteral(item, value) {
  if (item.type === "number") {
    const numericValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
    if (!Number.isFinite(numericValue)) {
      throw httpError(400, `${item.id} expects a finite number.`);
    }
    return String(Object.is(numericValue, -0) ? 0 : numericValue);
  }

  if (item.type === "boolean") {
    if (typeof value !== "boolean") {
      throw httpError(400, `${item.id} expects true or false.`);
    }
    return value ? "true" : "false";
  }

  if (item.type === "string") {
    if (typeof value !== "string") {
      throw httpError(400, `${item.id} expects a string.`);
    }
    if (value.includes("\n") || value.includes("\r")) {
      throw httpError(400, `${item.id} cannot contain line breaks.`);
    }
    return JSON.stringify(value);
  }

  throw httpError(400, `${item.id} is not an editable primitive value.`);
}

function parseSource(text) {
  return ts.createSourceFile(BALANCE_FILE, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function withoutRange(item) {
  if (!item) {
    return null;
  }

  const { range, ...rest } = item;
  return rest;
}

function diagnosticText(diagnostic) {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isLocalDevRequest(req) {
  const rawHost = String(req.headers.host ?? "");
  const host = hostName(rawHost);

  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "";
}

function hostName(rawHost) {
  const host = rawHost.trim();
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end === -1 ? host : host.slice(1, end);
  }

  return host.split(":")[0];
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) {
        reject(httpError(413, "Constants dashboard request body is too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body.length === 0 ? {} : JSON.parse(body));
      } catch {
        reject(httpError(400, "Expected valid JSON."));
      }
    });

    req.on("error", reject);
  });
}

function sendHtml(res, html) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function constantsDashboardHtml() {
  return String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Guinea Pig Beans Constants</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f6f1;
        --panel: #ffffff;
        --ink: #242823;
        --muted: #657064;
        --line: #d6ded0;
        --accent: #276f5b;
        --accent-strong: #164f41;
        --warn: #b86d12;
        --danger: #b23b36;
        --changed: #fff5c9;
        --shadow: 0 12px 30px rgba(24, 36, 28, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--ink);
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
        letter-spacing: 0;
      }

      button,
      input {
        font: inherit;
      }

      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-rows: auto 1fr;
      }

      header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
        padding: 18px 22px;
        border-bottom: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.86);
        backdrop-filter: blur(10px);
        position: sticky;
        top: 0;
        z-index: 3;
      }

      h1 {
        margin: 0;
        font-size: 1.15rem;
        line-height: 1.2;
      }

      .meta {
        margin-top: 4px;
        color: var(--muted);
        font-size: 0.86rem;
      }

      .top-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: end;
      }

      .dev-page-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 4px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #f7faf4;
      }

      main {
        display: grid;
        grid-template-columns: minmax(230px, 300px) minmax(0, 1fr);
        gap: 18px;
        width: min(1440px, 100%);
        margin: 0 auto;
        padding: 18px 22px 28px;
      }

      aside {
        align-self: start;
        position: sticky;
        top: 88px;
        display: grid;
        gap: 12px;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: var(--shadow);
      }

      .filters {
        display: grid;
        gap: 10px;
        padding: 14px;
      }

      .filters label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      .filters input,
      .value-input {
        width: 100%;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fbfcfa;
        color: var(--ink);
        padding: 9px 10px;
      }

      .filters input:focus,
      .value-input:focus {
        border-color: var(--accent);
        outline: 3px solid rgba(39, 111, 91, 0.16);
      }

      .summary {
        padding: 14px;
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.45;
      }

      .summary strong {
        color: var(--ink);
      }

      .groups {
        display: grid;
        gap: 16px;
      }

      .group {
        overflow: hidden;
      }

      .group-heading {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: baseline;
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
        background: #eef4ea;
      }

      .group-heading h2 {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.25;
      }

      .count {
        color: var(--muted);
        font-size: 0.82rem;
      }

      .row {
        display: grid;
        grid-template-columns: minmax(180px, 1.25fr) minmax(140px, 0.7fr) minmax(170px, 0.8fr) auto auto minmax(110px, 0.55fr);
        gap: 12px;
        align-items: center;
        min-height: 68px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--line);
        background: var(--panel);
      }

      .row:last-child {
        border-bottom: 0;
      }

      .row.changed {
        background: var(--changed);
      }

      .constant-id {
        min-width: 0;
      }

      .constant-id strong {
        display: block;
        overflow-wrap: anywhere;
        font-size: 0.94rem;
      }

      .constant-id span,
      .line,
      .literal,
      .status {
        color: var(--muted);
        font-size: 0.82rem;
      }

      .literal {
        overflow-wrap: anywhere;
      }

      .actions {
        display: contents;
      }

      .button,
      a.button {
        display: inline-grid;
        place-items: center;
        border: 1px solid var(--accent);
        border-radius: 6px;
        color: var(--accent-strong);
        background: #ffffff;
        min-height: 38px;
        padding: 8px 12px;
        text-decoration: none;
        cursor: pointer;
      }

      .dev-page-nav .button {
        min-height: 34px;
        border-color: var(--line);
        padding: 7px 10px;
      }

      .dev-page-nav .button[aria-current="page"] {
        border-color: var(--accent);
        background: #e8f3ec;
        color: var(--accent-strong);
      }

      .button.primary {
        background: var(--accent);
        color: white;
      }

      .button.primary:disabled {
        background: #d8ded5;
        border-color: #c9d0c5;
        color: #879287;
      }

      .button:disabled {
        border-color: #c9d0c5;
        color: #8a9487;
        cursor: default;
      }

      .status {
        min-height: 20px;
      }

      .status.error {
        color: var(--danger);
      }

      .status.saved {
        color: var(--accent-strong);
      }

      .status.pending {
        color: var(--warn);
      }

      .empty,
      .loading {
        padding: 28px;
        text-align: center;
        color: var(--muted);
      }

      @media (max-width: 1000px) {
        main {
          grid-template-columns: 1fr;
        }

        aside {
          position: static;
        }

        .row {
          grid-template-columns: minmax(0, 1fr) minmax(120px, 0.45fr);
        }

        .literal,
        .line,
        .value-cell,
        .status {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 640px) {
        header {
          grid-template-columns: 1fr;
        }

        .top-actions {
          justify-content: start;
        }

        main {
          padding: 14px;
        }

        .row {
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .constant-id {
          grid-column: 1 / -1;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div>
          <h1>Constants</h1>
          <div class="meta" id="meta">Loading src/simulation/balance.ts</div>
        </div>
        <div class="top-actions">
          <nav class="dev-page-nav" aria-label="Developer pages">
            <a class="button" href="/">Game</a>
            <a class="button" href="/constants" aria-current="page">Constants</a>
            <a class="button" href="/tech-tree-layout">Tech Tree</a>
          </nav>
          <button class="button" id="refresh" type="button">Refresh</button>
        </div>
      </header>

      <main>
        <aside>
          <section class="panel filters">
            <label>
              Filter
              <input id="filter" type="search" autocomplete="off" placeholder="constant name" />
            </label>
          </section>
          <section class="panel summary" id="summary">Reading source...</section>
        </aside>

        <section class="groups" id="groups">
          <div class="panel loading">Loading constants...</div>
        </section>
      </main>
    </div>

    <script type="module">
      const state = {
        hash: "",
        file: "",
        groups: [],
        values: new Map(),
        lastStatusId: "",
        lastStatusText: "",
        lastStatusClass: ""
      };

      const groupsEl = document.querySelector("#groups");
      const metaEl = document.querySelector("#meta");
      const summaryEl = document.querySelector("#summary");
      const filterEl = document.querySelector("#filter");
      const refreshEl = document.querySelector("#refresh");

      refreshEl.addEventListener("click", loadConstants);
      filterEl.addEventListener("input", render);

      await loadConstants();

      async function loadConstants() {
        groupsEl.innerHTML = '<div class="panel loading">Loading constants...</div>';
        clearStatus();

        try {
          const response = await fetch("/__gpb_constants", { headers: { Accept: "application/json" } });
          if (!response.ok) {
            throw new Error(await response.text());
          }

          const payload = await response.json();
          state.hash = payload.hash;
          state.file = payload.file;
          state.groups = payload.groups || [];
          state.values = new Map();

          for (const group of state.groups) {
            for (const item of group.items) {
              state.values.set(item.id, item.value);
            }
          }

          render();
        } catch (error) {
          groupsEl.innerHTML = "";
          const errorEl = document.createElement("div");
          errorEl.className = "panel empty";
          errorEl.textContent = error.message || "Unable to load constants.";
          groupsEl.append(errorEl);
          metaEl.textContent = "Constants unavailable";
          summaryEl.textContent = "Source read failed.";
        }
      }

      function render() {
        const filter = filterEl.value.trim().toLowerCase();
        const total = state.groups.reduce((sum, group) => sum + group.items.length, 0);
        const shortHash = state.hash ? state.hash.slice(0, 10) : "unknown";
        metaEl.textContent = state.file + " | " + total + " editable values | " + shortHash;
        summaryEl.innerHTML = "<strong>" + total + "</strong> source literals exposed from <strong>" + state.file + "</strong>.";

        groupsEl.innerHTML = "";
        let visibleCount = 0;

        for (const group of state.groups) {
          const visibleItems = group.items.filter((item) => {
            return (
              item.id.toLowerCase().includes(filter) ||
              item.name.toLowerCase().includes(filter) ||
              group.label.toLowerCase().includes(filter)
            );
          });

          if (visibleItems.length === 0) {
            continue;
          }

          visibleCount += visibleItems.length;
          groupsEl.append(renderGroup(group, visibleItems));
        }

        if (visibleCount === 0) {
          const empty = document.createElement("div");
          empty.className = "panel empty";
          empty.textContent = "No constants match.";
          groupsEl.append(empty);
        }
      }

      function renderGroup(group, items) {
        const section = document.createElement("section");
        section.className = "panel group";

        const heading = document.createElement("div");
        heading.className = "group-heading";

        const title = document.createElement("h2");
        title.textContent = group.label;

        const count = document.createElement("span");
        count.className = "count";
        count.textContent = items.length + " values";

        heading.append(title, count);
        section.append(heading);

        for (const item of items) {
          section.append(renderRow(item));
        }

        return section;
      }

      function renderRow(item) {
        const row = document.createElement("article");
        row.className = "row";
        row.dataset.id = item.id;

        const idCell = document.createElement("div");
        idCell.className = "constant-id";

        const idText = document.createElement("strong");
        idText.textContent = item.id;

        const typeText = document.createElement("span");
        typeText.textContent = item.type;

        idCell.append(idText, typeText);

        const line = document.createElement("div");
        line.className = "line";
        line.textContent = "line " + item.line;

        const literal = document.createElement("div");
        literal.className = "literal";
        literal.textContent = "source " + item.literal;

        const valueCell = document.createElement("div");
        valueCell.className = "value-cell";
        const input = createInput(item);
        valueCell.append(input);

        const save = document.createElement("button");
        save.className = "button primary";
        save.type = "button";
        save.textContent = "Save";
        save.disabled = true;

        const reset = document.createElement("button");
        reset.className = "button";
        reset.type = "button";
        reset.textContent = "Reset";
        reset.disabled = true;

        const status = document.createElement("div");
        status.className = "status";
        if (state.lastStatusId === item.id) {
          status.textContent = state.lastStatusText;
          if (state.lastStatusClass) {
            status.classList.add(state.lastStatusClass);
          }
        }

        const updateDirtyState = () => {
          const changed = !sameValue(readInputValue(input, item.type), state.values.get(item.id), item.type);
          row.classList.toggle("changed", changed);
          save.disabled = !changed;
          reset.disabled = !changed;
          if (changed) {
            status.textContent = "Changed";
            status.className = "status pending";
          } else if (state.lastStatusId !== item.id) {
            status.textContent = "";
            status.className = "status";
          }
        };

        input.addEventListener("input", updateDirtyState);
        input.addEventListener("change", updateDirtyState);

        reset.addEventListener("click", () => {
          setInputValue(input, item.type, state.values.get(item.id));
          clearStatus();
          updateDirtyState();
        });

        save.addEventListener("click", async () => {
          save.disabled = true;
          status.textContent = "Saving";
          status.className = "status pending";
          try {
            const nextValue = readInputValue(input, item.type);
            const response = await fetch("/__gpb_constants/" + encodeURIComponent(item.id), {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
              },
              body: JSON.stringify({ hash: state.hash, value: nextValue })
            });

            const payload = await response.json();
            if (!response.ok) {
              throw new Error(payload.error || "Save failed.");
            }

            setStatus(item.id, "Saved", "saved");
            await refreshAfterSave(item.id, payload.hash);
          } catch (error) {
            setStatus(item.id, error.message || "Save failed.", "error");
            render();
          }
        });

        row.append(idCell, line, literal, valueCell, save, reset, status);
        return row;
      }

      function createInput(item) {
        const input = document.createElement("input");
        input.className = "value-input";

        if (item.type === "number") {
          input.type = "number";
          input.step = stepFor(item.value);
          input.value = String(item.value);
        } else if (item.type === "boolean") {
          input.type = "checkbox";
          input.checked = Boolean(item.value);
        } else {
          input.type = "text";
          input.value = String(item.value);
        }

        input.setAttribute("aria-label", item.id);
        return input;
      }

      function readInputValue(input, type) {
        if (type === "number") {
          return Number(input.value);
        }

        if (type === "boolean") {
          return input.checked;
        }

        return input.value;
      }

      function setInputValue(input, type, value) {
        if (type === "boolean") {
          input.checked = Boolean(value);
        } else {
          input.value = String(value);
        }
      }

      function sameValue(left, right, type) {
        if (type === "number") {
          return Number(left) === Number(right);
        }
        return left === right;
      }

      function stepFor(value) {
        const text = String(value);
        const dot = text.indexOf(".");
        if (dot === -1) {
          return "1";
        }
        return String(Math.pow(10, -(text.length - dot - 1)));
      }

      async function refreshAfterSave(id, expectedHash) {
        const response = await fetch("/__gpb_constants", { headers: { Accept: "application/json" } });
        const payload = await response.json();
        state.hash = payload.hash || expectedHash;
        state.file = payload.file;
        state.groups = payload.groups || [];
        state.values = new Map();
        for (const group of state.groups) {
          for (const item of group.items) {
            state.values.set(item.id, item.value);
          }
        }
        state.lastStatusId = id;
        render();
      }

      function setStatus(id, text, className) {
        state.lastStatusId = id;
        state.lastStatusText = text;
        state.lastStatusClass = className;
      }

      function clearStatus() {
        state.lastStatusId = "";
        state.lastStatusText = "";
        state.lastStatusClass = "";
      }
    </script>
  </body>
</html>`;
}
