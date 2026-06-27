import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const ROUTE_PAGE = "/tech-tree-layout";
const ROUTE_API = "/__gpb_tech_tree_layout";
const LAYOUT_FILE = "src/ui/techTreeConstellation.ts";
const TECH_TREE_FILE = "src/simulation/techTree.ts";

export function techTreeLayoutPlugin() {
  let serverRef;

  return {
    name: "gpb-tech-tree-layout-editor",
    apply: "serve",
    configureServer(server) {
      serverRef = server;
      const root = server.config.root;
      const layoutPath = path.resolve(root, LAYOUT_FILE);
      const techTreePath = path.resolve(root, TECH_TREE_FILE);

      server.middlewares.use(async (req, res, next) => {
        const requestUrl = new URL(req.url ?? "/", "http://localhost");
        const pathname = requestUrl.pathname;

        if (pathname !== ROUTE_PAGE && pathname !== `${ROUTE_PAGE}/` && pathname !== ROUTE_API) {
          next();
          return;
        }

        if (!isLocalDevRequest(req)) {
          sendJson(res, 403, { error: "Tech Tree layout editing is restricted to local dev requests." });
          return;
        }

        try {
          if (req.method === "GET" && (pathname === ROUTE_PAGE || pathname === `${ROUTE_PAGE}/`)) {
            sendHtml(res, layoutEditorHtml());
            return;
          }

          if (req.method === "GET" && pathname === ROUTE_API) {
            sendJson(res, 200, await buildCatalogFromFiles(layoutPath, techTreePath));
            return;
          }

          if (req.method === "PUT" && pathname === ROUTE_API) {
            const body = await readJsonBody(req);
            const result = await updateLayout(layoutPath, techTreePath, body);
            serverRef.ws.send({ type: "full-reload", path: "*" });
            sendJson(res, 200, result);
            return;
          }

          sendJson(res, 405, { error: "Unsupported Tech Tree layout editor method." });
        } catch (error) {
          const status = Number.isInteger(error.status) ? error.status : 500;
          sendJson(res, status, { error: error.message || "Tech Tree layout editor request failed." });
        }
      });
    },
  };
}

async function buildCatalogFromFiles(layoutPath, techTreePath) {
  const [layoutText, techTreeText] = await Promise.all([
    fs.readFile(layoutPath, "utf8"),
    fs.readFile(techTreePath, "utf8"),
  ]);
  return withoutRanges(buildCatalog(layoutText, techTreeText));
}

async function updateLayout(layoutPath, techTreePath, body) {
  if (!body || typeof body !== "object") {
    throw httpError(400, "Expected a JSON request body.");
  }

  if (typeof body.hash !== "string" || body.hash.length === 0) {
    throw httpError(400, "Expected a source hash.");
  }

  const [layoutText, techTreeText] = await Promise.all([
    fs.readFile(layoutPath, "utf8"),
    fs.readFile(techTreePath, "utf8"),
  ]);
  const currentHash = hashText(layoutText);
  if (body.hash !== currentHash) {
    throw httpError(409, "The Tech Tree layout file changed. Refresh before saving.");
  }

  const catalog = buildCatalog(layoutText, techTreeText);
  const nextLayout = validateNodeLayout(body.techNodeLayout, catalog.nodeLayoutEntries.map((entry) => entry.id));
  const replacements = [];

  for (const entry of catalog.nodeLayoutEntries) {
    const next = nextLayout.get(entry.id);
    addNumberReplacement(replacements, entry.xRange, next.x);
    addNumberReplacement(replacements, entry.yRange, next.y);
  }

  let updatedText = layoutText;
  replacements.sort((left, right) => right.start - left.start);
  for (const replacement of replacements) {
    updatedText = `${updatedText.slice(0, replacement.start)}${replacement.text}${updatedText.slice(replacement.end)}`;
  }

  const parseCheck = parseSource(LAYOUT_FILE, updatedText);
  if (parseCheck.parseDiagnostics.length > 0) {
    const first = parseCheck.parseDiagnostics[0];
    throw httpError(400, `Generated source did not parse: ${diagnosticText(first)}`);
  }

  const tempPath = `${layoutPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tempPath, updatedText, "utf8");
    await fs.rename(tempPath, layoutPath);
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }

  const [freshLayoutText, freshTechTreeText] = await Promise.all([
    fs.readFile(layoutPath, "utf8"),
    fs.readFile(techTreePath, "utf8"),
  ]);
  return {
    ok: true,
    ...withoutRanges(buildCatalog(freshLayoutText, freshTechTreeText)),
  };
}

function addNumberReplacement(replacements, range, value) {
  replacements.push({ start: range.start, end: range.end, text: String(value) });
}

function buildCatalog(layoutText, techTreeText) {
  const layoutSource = parseSource(LAYOUT_FILE, layoutText);
  const techTreeSource = parseSource(TECH_TREE_FILE, techTreeText);
  const constants = readMapConstants(layoutSource);
  const branchVisuals = readBranchVisuals(layoutSource);
  const iconEntries = readNodeIcons(layoutSource);
  const techNodes = readTechNodes(techTreeSource);
  const nodeLayoutEntries = readNodeLayout(layoutSource);
  const nodeDefinitionIds = new Set(techNodes.map((node) => node.id));
  const nodeLayoutIds = new Set(nodeLayoutEntries.map((entry) => entry.id));

  for (const node of techNodes) {
    if (!nodeLayoutIds.has(node.id)) {
      throw httpError(500, `Tech Tree layout is missing node ${node.id}.`);
    }
  }
  for (const entry of nodeLayoutEntries) {
    if (!nodeDefinitionIds.has(entry.id)) {
      throw httpError(500, `Tech Tree layout has unknown node ${entry.id}.`);
    }
  }

  const nodeLayoutById = new Map(nodeLayoutEntries.map((entry) => [entry.id, entry]));
  const iconById = new Map(iconEntries.map((entry) => [entry.id, entry]));
  const nodes = techNodes.map((node) => {
    const layout = nodeLayoutById.get(node.id);
    const icon = iconById.get(node.id) ?? { path: "", code: node.id.slice(0, 2).toUpperCase() };
    return {
      ...node,
      icon,
      x: layout.x,
      y: layout.y,
    };
  });

  return {
    file: LAYOUT_FILE,
    hash: hashText(layoutText),
    constants,
    branchVisuals,
    nodes,
    techNodeLayout: Object.fromEntries(nodeLayoutEntries.map((entry) => [entry.id, { x: entry.x, y: entry.y }])),
    nodeLayoutEntries,
  };
}

function readMapConstants(sourceFile) {
  return {
    TECH_MAP_WIDTH: readNumericVariable(sourceFile, "TECH_MAP_WIDTH"),
    TECH_MAP_HEIGHT: readNumericVariable(sourceFile, "TECH_MAP_HEIGHT"),
    TECH_NODE_WIDTH: readNumericVariable(sourceFile, "TECH_NODE_WIDTH"),
    TECH_NODE_HEIGHT: readNumericVariable(sourceFile, "TECH_NODE_HEIGHT"),
  };
}

function readNumericVariable(sourceFile, name) {
  const declaration = findVariableDeclaration(sourceFile, name);
  const numeric = readNumberLiteral(sourceFile, unwrapExpression(declaration.initializer));
  if (!numeric) throw httpError(500, `${name} must be a numeric literal.`);
  return numeric.value;
}

function readTechNodes(sourceFile) {
  const declaration = findVariableDeclaration(sourceFile, "TECH_NODES");
  const initializer = unwrapExpression(declaration.initializer);
  if (!ts.isArrayLiteralExpression(initializer)) {
    throw httpError(500, "TECH_NODES must be an array literal.");
  }

  return initializer.elements.map((element) => {
    if (!ts.isCallExpression(element) || !ts.isIdentifier(element.expression) || element.expression.text !== "node") {
      throw httpError(500, "TECH_NODES entries must use node(...).");
    }

    const [idArg, branchArg, labelArg, descriptionArg, maxLevelArg, prerequisitesArg, kindArg] = element.arguments;
    const id = readStringArgument(sourceFile, idArg, "node id");
    const branch = readStringArgument(sourceFile, branchArg, `branch for ${id}`);
    const label = readStringArgument(sourceFile, labelArg, `label for ${id}`);
    const description = readStringArgument(sourceFile, descriptionArg, `description for ${id}`);
    const maxLevel = readNumberArgument(sourceFile, maxLevelArg, `max level for ${id}`);
    const prerequisites = prerequisitesArg ? readStringArray(sourceFile, prerequisitesArg, `prerequisites for ${id}`) : [];
    const kind = kindArg ? readStringArgument(sourceFile, kindArg, `kind for ${id}`) : "unlock";

    return { id, branch, label, description, maxLevel, prerequisites, kind };
  });
}

function readBranchVisuals(sourceFile) {
  const objectLiteral = readObjectVariable(sourceFile, "TECH_BRANCH_VISUALS");
  const visuals = {};

  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const id = propertyName(property.name);
    const value = unwrapExpression(property.initializer);
    if (!id || !ts.isObjectLiteralExpression(value)) continue;

    visuals[id] = {
      label: readStringProperty(sourceFile, value, "label"),
      shortLabel: readStringProperty(sourceFile, value, "shortLabel"),
      icon: readStringProperty(sourceFile, value, "icon"),
      color: readStringProperty(sourceFile, value, "color"),
      border: readStringProperty(sourceFile, value, "border"),
      soft: readStringProperty(sourceFile, value, "soft"),
    };
  }

  return visuals;
}

function readNodeIcons(sourceFile) {
  const objectLiteral = readObjectVariable(sourceFile, "TECH_NODE_ICONS");
  const entries = [];

  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const id = propertyName(property.name);
    const value = unwrapExpression(property.initializer);
    if (!id || !ts.isObjectLiteralExpression(value)) continue;
    entries.push({
      id,
      path: readStringProperty(sourceFile, value, "path"),
      code: readStringProperty(sourceFile, value, "code"),
    });
  }

  return entries;
}

function readNodeLayout(sourceFile) {
  const objectLiteral = readObjectVariable(sourceFile, "TECH_NODE_LAYOUT");
  const entries = [];

  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const id = propertyName(property.name);
    const value = unwrapExpression(property.initializer);
    if (!id || !ts.isObjectLiteralExpression(value)) {
      throw httpError(500, "TECH_NODE_LAYOUT entries must be object literals.");
    }

    const x = readNumberProperty(sourceFile, value, "x");
    const y = readNumberProperty(sourceFile, value, "y");
    entries.push({
      id,
      x: x.value,
      y: y.value,
      xRange: x.range,
      yRange: y.range,
    });
  }

  return entries;
}

function validateNodeLayout(value, expectedIds) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw httpError(400, "techNodeLayout must be an object keyed by node id.");
  }

  const expected = new Set(expectedIds);
  const actual = Object.keys(value);
  const unknown = actual.filter((id) => !expected.has(id));
  const missing = expectedIds.filter((id) => !(id in value));
  if (unknown.length > 0) throw httpError(400, `Unknown node layout ids: ${unknown.join(", ")}`);
  if (missing.length > 0) throw httpError(400, `Missing node layout ids: ${missing.join(", ")}`);

  const next = new Map();
  for (const id of expectedIds) {
    const entry = value[id];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw httpError(400, `${id} layout must be an object.`);
    }
    next.set(id, {
      x: readSubmittedInteger(entry.x, `${id}.x`),
      y: readSubmittedInteger(entry.y, `${id}.y`),
    });
  }
  return next;
}

function readSubmittedInteger(value, label) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(number) || !Number.isInteger(number)) {
    throw httpError(400, `${label} must be a finite integer.`);
  }
  return Object.is(number, -0) ? 0 : number;
}

function findVariableDeclaration(sourceFile, name) {
  let match = null;
  const visit = (node) => {
    if (match) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer) {
      match = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  if (!match) throw httpError(500, `Could not find ${name}.`);
  return match;
}

function readObjectVariable(sourceFile, name) {
  const initializer = unwrapExpression(findVariableDeclaration(sourceFile, name).initializer);
  if (!ts.isObjectLiteralExpression(initializer)) {
    throw httpError(500, `${name} must be an object literal.`);
  }
  return initializer;
}

function readStringProperty(sourceFile, objectLiteral, name) {
  const property = findObjectProperty(objectLiteral, name);
  if (!property) throw httpError(500, `Missing string property ${name}.`);
  return readStringArgument(sourceFile, property.initializer, name);
}

function readNumberProperty(sourceFile, objectLiteral, name) {
  const property = findObjectProperty(objectLiteral, name);
  if (!property) throw httpError(500, `Missing numeric property ${name}.`);
  const numeric = readNumberLiteral(sourceFile, unwrapExpression(property.initializer));
  if (!numeric) throw httpError(500, `${name} must be a numeric literal.`);
  return numeric;
}

function findObjectProperty(objectLiteral, name) {
  return objectLiteral.properties.find((property) => ts.isPropertyAssignment(property) && propertyName(property.name) === name);
}

function readStringArgument(sourceFile, expression, label) {
  const node = unwrapExpression(expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  throw httpError(500, `${label} must be a string literal.`);
}

function readNumberArgument(sourceFile, expression, label) {
  const numeric = readNumberLiteral(sourceFile, unwrapExpression(expression));
  if (!numeric) throw httpError(500, `${label} must be a numeric literal.`);
  return numeric.value;
}

function readStringArray(sourceFile, expression, label) {
  const node = unwrapExpression(expression);
  if (!ts.isArrayLiteralExpression(node)) {
    throw httpError(500, `${label} must be an array literal.`);
  }
  return node.elements.map((element) => readStringArgument(sourceFile, element, label));
}

function readNumberLiteral(sourceFile, expression) {
  const node = unwrapExpression(expression);
  if (ts.isNumericLiteral(node)) {
    return scalarNumberResult(sourceFile, node, Number(node.text));
  }
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const multiplier = node.operator === ts.SyntaxKind.MinusToken ? -1 : 1;
    return scalarNumberResult(sourceFile, node, multiplier * Number(node.operand.text));
  }
  return null;
}

function scalarNumberResult(sourceFile, node, value) {
  return {
    value,
    range: {
      start: node.getStart(sourceFile),
      end: node.getEnd(),
    },
  };
}

function propertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
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

function parseSource(fileName, text) {
  return ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function withoutRanges(catalog) {
  const { nodeLayoutEntries, ...rest } = catalog;
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
      if (body.length > 512 * 1024) {
        reject(httpError(413, "Tech Tree layout request body is too large."));
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

function layoutEditorHtml() {
  return String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Guinea Pig Beans Tech Tree Layout</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f2f5ef;
        --panel: #ffffff;
        --ink: #252b25;
        --muted: #667061;
        --line: #d6ded0;
        --accent: #276f5b;
        --accent-strong: #174e41;
        --danger: #b23b36;
        --warn: #b86d12;
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
      input,
      select {
        font: inherit;
      }

      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-rows: auto 1fr;
      }

      header {
        position: sticky;
        top: 0;
        z-index: 10;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
      }

      h1 {
        margin: 0;
        font-size: 1.12rem;
        line-height: 1.2;
      }

      .meta {
        margin-top: 4px;
        color: var(--muted);
        font-size: 0.86rem;
      }

      .top-actions,
      .inline-actions {
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

      .button,
      a.button {
        display: inline-grid;
        place-items: center;
        min-height: 36px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fbfcfa;
        color: var(--ink);
        padding: 7px 11px;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
      }

      .dev-page-nav .button {
        min-height: 34px;
        padding: 7px 10px;
      }

      .dev-page-nav .button[aria-current="page"] {
        border-color: var(--accent);
        background: #e8f3ec;
        color: var(--accent-strong);
      }

      .button.primary {
        border-color: var(--accent);
        background: var(--accent);
        color: #fff;
      }

      .button:disabled {
        cursor: default;
        opacity: 0.48;
      }

      main {
        display: grid;
        grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
        gap: 16px;
        min-height: 0;
        padding: 16px;
      }

      aside {
        align-self: start;
        position: sticky;
        top: 84px;
        display: grid;
        gap: 12px;
        max-height: calc(100vh - 104px);
        overflow: auto;
      }

      .panel {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        box-shadow: var(--shadow);
      }

      .panel-section {
        display: grid;
        gap: 10px;
        padding: 14px;
        border-bottom: 1px solid var(--line);
      }

      .panel-section:last-child {
        border-bottom: 0;
      }

      .panel-section h2 {
        margin: 0;
        font-size: 0.92rem;
        line-height: 1.2;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      label {
        display: grid;
        gap: 5px;
        color: var(--muted);
        font-size: 0.74rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      input,
      select {
        width: 100%;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fbfcfa;
        color: var(--ink);
        padding: 8px 9px;
      }

      input:focus,
      select:focus,
      .layout-node:focus-visible {
        border-color: var(--accent);
        outline: 3px solid rgba(39, 111, 91, 0.16);
      }

      .status {
        min-height: 22px;
        color: var(--muted);
        font-size: 0.84rem;
        font-weight: 800;
        line-height: 1.35;
      }

      .status.saved {
        color: var(--accent-strong);
      }

      .status.error {
        color: var(--danger);
      }

      .selected-title {
        display: grid;
        gap: 3px;
      }

      .selected-title strong {
        font-size: 0.95rem;
        line-height: 1.15;
      }

      .selected-title span {
        color: var(--muted);
        font-size: 0.8rem;
      }

      .canvas-panel {
        min-width: 0;
        min-height: 0;
        overflow: hidden;
      }

      .canvas-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
        background: #fbfcfa;
      }

      .canvas-toolbar label {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 7px;
        text-transform: none;
      }

      .canvas-toolbar input[type="checkbox"] {
        width: auto;
      }

      .canvas-shell {
        height: calc(100vh - 132px);
        min-height: 560px;
        overflow: auto;
        padding: 18px;
        background:
          linear-gradient(rgba(64, 75, 59, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(64, 75, 59, 0.06) 1px, transparent 1px),
          linear-gradient(180deg, #fffaf0 0%, #f7f0e4 52%, #f2f6ee 100%);
        background-size: 40px 40px, 40px 40px, auto;
      }

      .layout-map {
        position: relative;
        isolation: isolate;
        border: 1px solid rgba(49, 64, 51, 0.12);
        border-radius: 8px;
        background:
          linear-gradient(rgba(64, 75, 59, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(64, 75, 59, 0.08) 1px, transparent 1px),
          rgba(255, 252, 244, 0.42);
        background-size: 80px 80px, 80px 80px, auto;
      }

      .layout-links,
      .layout-nodes {
        position: absolute;
        inset: 0;
      }

      .layout-links {
        pointer-events: none;
        z-index: 1;
      }

      .layout-link {
        fill: none;
        stroke: rgba(73, 82, 69, 0.34);
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 3;
      }

      .layout-link.cross {
        stroke: rgba(157, 93, 146, 0.55);
        stroke-width: 4;
      }

      .layout-link.derived {
        stroke-dasharray: 4 7;
      }

      .layout-nodes {
        z-index: 2;
      }

      .layout-node {
        position: absolute;
        display: grid;
        place-items: center;
        width: var(--node-width);
        height: var(--node-height);
        border: 2px solid var(--branch-border);
        border-radius: 50%;
        background:
          radial-gradient(circle at 42% 36%, rgba(255, 255, 255, 0.98) 0 36%, rgba(255, 255, 255, 0.58) 37% 54%, transparent 55%),
          linear-gradient(180deg, #fffdf6 0%, #f4f0e8 100%);
        box-shadow: 0 6px 12px rgba(31, 40, 32, 0.16);
        transform: translate(-50%, -50%);
        cursor: grab;
      }

      .layout-node:active {
        cursor: grabbing;
      }

      .layout-node.selected {
        border-color: var(--branch-color);
        box-shadow:
          0 8px 16px rgba(31, 48, 35, 0.18),
          0 0 0 4px var(--branch-soft),
          0 0 0 7px rgba(255, 255, 255, 0.78);
      }

      .layout-node img {
        display: block;
        max-width: calc(var(--node-width) - 22px);
        max-height: calc(var(--node-height) - 22px);
        object-fit: contain;
        pointer-events: none;
      }

      .node-code {
        display: none;
        color: var(--branch-color);
        font-size: 0.82rem;
        font-weight: 950;
        pointer-events: none;
      }

      .layout-node.missing-icon img {
        display: none;
      }

      .layout-node.missing-icon .node-code {
        display: block;
      }

      .node-label {
        position: absolute;
        top: calc(100% + 4px);
        left: 50%;
        width: 132px;
        color: #394138;
        font-size: 0.68rem;
        font-weight: 850;
        line-height: 1.05;
        overflow-wrap: anywhere;
        pointer-events: none;
        text-align: center;
        transform: translateX(-50%);
      }

      .warnings {
        display: grid;
        gap: 6px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .warnings li {
        border: 1px solid rgba(184, 109, 18, 0.3);
        border-radius: 6px;
        background: #fff7df;
        color: #6f4107;
        padding: 7px 8px;
        font-size: 0.8rem;
        font-weight: 750;
        line-height: 1.3;
      }

      .empty {
        color: var(--muted);
        font-size: 0.86rem;
        line-height: 1.35;
      }

      @media (max-width: 900px) {
        header,
        main {
          grid-template-columns: 1fr;
        }

        aside {
          position: static;
          max-height: none;
        }

        .canvas-shell {
          height: 68vh;
          min-height: 460px;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div>
          <h1>Tech Tree Layout</h1>
          <div class="meta" id="meta">Loading layout...</div>
        </div>
        <div class="top-actions">
          <nav class="dev-page-nav" aria-label="Developer pages">
            <a class="button" href="/">Game</a>
            <a class="button" href="/constants">Constants</a>
            <a class="button" href="/tech-tree-layout" aria-current="page">Tech Tree</a>
          </nav>
          <button class="button" id="reload" type="button">Reload From Source</button>
          <button class="button" id="reset" type="button" disabled>Reset Draft</button>
          <button class="button primary" id="save" type="button" disabled>Save</button>
        </div>
      </header>
      <main>
        <aside>
          <section class="panel">
            <div class="panel-section">
              <h2>Selection</h2>
              <select id="selector" aria-label="Select node"></select>
              <div class="selected-title" id="selected-title"></div>
              <div class="field-grid" id="fields"></div>
            </div>
            <div class="panel-section">
              <h2>Warnings</h2>
              <ul class="warnings" id="warnings"></ul>
            </div>
            <div class="panel-section">
              <h2>Status</h2>
              <div class="status" id="status"></div>
            </div>
          </section>
        </aside>
        <section class="panel canvas-panel">
          <div class="canvas-toolbar">
            <div class="inline-actions">
              <label><input id="snap" type="checkbox" checked /> Snap 10px</label>
              <span class="status" id="dirty-state">Clean</span>
            </div>
            <div class="status">Drag nodes by center. Use arrow keys to nudge the selected node; Shift nudges by 10px.</div>
          </div>
          <div class="canvas-shell">
            <div class="layout-map" id="map" aria-label="Editable Tech Tree node layout"></div>
          </div>
        </section>
      </main>
    </div>
    <script>
      const API = "${ROUTE_API}";
      const SNAP_SIZE = 10;
      const state = {
        catalog: null,
        originalNodeLayout: null,
        nodeLayout: null,
        selected: null,
        dragging: null,
        statusText: "",
        statusClass: "",
      };

      const els = {
        meta: document.getElementById("meta"),
        reload: document.getElementById("reload"),
        reset: document.getElementById("reset"),
        save: document.getElementById("save"),
        selector: document.getElementById("selector"),
        selectedTitle: document.getElementById("selected-title"),
        fields: document.getElementById("fields"),
        warnings: document.getElementById("warnings"),
        status: document.getElementById("status"),
        dirtyState: document.getElementById("dirty-state"),
        snap: document.getElementById("snap"),
        map: document.getElementById("map"),
      };

      els.reload.addEventListener("click", () => loadCatalog());
      els.reset.addEventListener("click", () => {
        state.nodeLayout = clone(state.originalNodeLayout);
        setStatus("Draft reset.", "");
        render();
      });
      els.save.addEventListener("click", () => saveDraft());
      els.selector.addEventListener("change", () => {
        state.selected = { id: els.selector.value };
        render();
      });

      document.addEventListener("keydown", (event) => {
        if (!state.selected || isEditingText(event.target)) return;
        const deltas = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
        const delta = deltas[event.key];
        if (!delta) return;
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        nudgeSelected(delta[0] * step, delta[1] * step);
      });

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);

      loadCatalog();

      async function loadCatalog() {
        setStatus("Loading layout...", "");
        try {
          const response = await fetch(API, { headers: { Accept: "application/json" } });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "Unable to load layout.");
          state.catalog = payload;
          state.originalNodeLayout = clone(payload.techNodeLayout);
          state.nodeLayout = clone(payload.techNodeLayout);
          state.selected = { id: payload.nodes[0]?.id ?? "" };
          setStatus("Loaded.", "saved");
          render();
        } catch (error) {
          setStatus(error.message || "Unable to load layout.", "error");
        }
      }

      async function saveDraft() {
        if (!state.catalog) return;
        els.save.disabled = true;
        setStatus("Saving layout...", "");
        try {
          const response = await fetch(API, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              hash: state.catalog.hash,
              techNodeLayout: state.nodeLayout,
            }),
          });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "Save failed.");
          state.catalog = payload;
          state.originalNodeLayout = clone(payload.techNodeLayout);
          state.nodeLayout = clone(payload.techNodeLayout);
          setStatus("Saved.", "saved");
          render();
        } catch (error) {
          setStatus(error.message || "Save failed.", "error");
          renderControls();
        }
      }

      function render() {
        if (!state.catalog) return;
        renderSelector();
        renderMap();
        renderSelection();
        renderWarnings();
        renderControls();
      }

      function renderSelector() {
        const currentValue = state.selected?.id ?? "";
        els.selector.replaceChildren();
        for (const node of state.catalog.nodes) {
          const option = document.createElement("option");
          option.value = node.id;
          option.textContent = node.label + " (" + node.id + ")";
          els.selector.append(option);
        }
        if (currentValue) els.selector.value = currentValue;
      }

      function renderMap() {
        const constants = state.catalog.constants;
        els.meta.textContent = constants.TECH_MAP_WIDTH + "x" + constants.TECH_MAP_HEIGHT + " map, " + state.catalog.nodes.length + " nodes";
        els.map.style.width = constants.TECH_MAP_WIDTH + "px";
        els.map.style.height = constants.TECH_MAP_HEIGHT + "px";
        els.map.style.setProperty("--node-width", constants.TECH_NODE_WIDTH + "px");
        els.map.style.setProperty("--node-height", constants.TECH_NODE_HEIGHT + "px");

        const links = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        links.classList.add("layout-links");
        links.setAttribute("viewBox", "0 0 " + constants.TECH_MAP_WIDTH + " " + constants.TECH_MAP_HEIGHT);
        links.setAttribute("aria-hidden", "true");
        for (const node of state.catalog.nodes) {
          const to = state.nodeLayout[node.id];
          for (const prerequisite of node.prerequisites) {
            const from = state.nodeLayout[prerequisite];
            const prerequisiteNode = state.catalog.nodes.find((candidate) => candidate.id === prerequisite);
            if (!from || !to || !prerequisiteNode) continue;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.classList.add("layout-link");
            path.classList.toggle("cross", prerequisiteNode.branch !== node.branch);
            path.classList.toggle("derived", node.kind === "derived");
            path.setAttribute("d", getLinkPath(from, to));
            links.append(path);
          }
        }

        const nodes = document.createElement("div");
        nodes.className = "layout-nodes";
        for (const node of state.catalog.nodes) {
          const layout = state.nodeLayout[node.id];
          const visual = state.catalog.branchVisuals[node.branch] ?? {};
          const button = document.createElement("button");
          button.type = "button";
          button.className = "layout-node";
          button.classList.toggle("selected", state.selected?.id === node.id);
          button.dataset.itemId = node.id;
          button.style.left = layout.x + "px";
          button.style.top = layout.y + "px";
          button.style.setProperty("--branch-color", visual.color ?? "#68715f");
          button.style.setProperty("--branch-border", visual.border ?? "rgba(104, 113, 95, 0.4)");
          button.style.setProperty("--branch-soft", visual.soft ?? "rgba(104, 113, 95, 0.14)");
          button.title = node.label + " (" + node.id + ")";
          button.setAttribute("aria-label", node.label + " node");
          button.addEventListener("pointerdown", (event) => startDrag(event, node.id));
          button.addEventListener("click", () => selectNode(node.id));

          const img = document.createElement("img");
          img.src = "/" + node.icon.path;
          img.alt = "";
          img.draggable = false;
          img.addEventListener("error", () => button.classList.add("missing-icon"));

          const code = document.createElement("span");
          code.className = "node-code";
          code.textContent = node.icon.code;

          const label = document.createElement("span");
          label.className = "node-label";
          label.textContent = node.label;

          button.append(img, code, label);
          nodes.append(button);
        }

        els.map.replaceChildren(links, nodes);
      }

      function renderSelection() {
        els.fields.replaceChildren();
        if (!state.selected) {
          els.selectedTitle.innerHTML = '<span class="empty">Select a node.</span>';
          return;
        }

        const node = state.catalog.nodes.find((candidate) => candidate.id === state.selected.id);
        const layout = state.nodeLayout[state.selected.id];
        els.selectedTitle.replaceChildren(titleStrong(node.label), titleSpan(node.id + " / " + node.branch));
        els.fields.append(createNumberField("x", layout.x), createNumberField("y", layout.y));
      }

      function createNumberField(name, value) {
        const label = document.createElement("label");
        label.textContent = name;
        const input = document.createElement("input");
        input.type = "number";
        input.step = "1";
        input.value = String(value);
        input.addEventListener("change", () => updateSelectedNumber(name, Number(input.value)));
        input.addEventListener("input", () => updateSelectedNumber(name, Number(input.value), false));
        label.append(input);
        return label;
      }

      function updateSelectedNumber(field, value, rerenderMap = true) {
        if (!state.selected || !Number.isFinite(value)) return;
        state.nodeLayout[state.selected.id][field] = Math.trunc(value);
        if (rerenderMap) {
          render();
        } else {
          renderMap();
          renderWarnings();
          renderControls();
        }
      }

      function renderWarnings() {
        const warnings = collectWarnings();
        els.warnings.replaceChildren();
        if (warnings.length === 0) {
          const item = document.createElement("li");
          item.textContent = "No placement warnings.";
          els.warnings.append(item);
          return;
        }
        for (const warning of warnings) {
          const item = document.createElement("li");
          item.textContent = warning;
          els.warnings.append(item);
        }
      }

      function collectWarnings() {
        const warnings = [];
        const constants = state.catalog.constants;
        const halfWidth = constants.TECH_NODE_WIDTH / 2;
        const halfHeight = constants.TECH_NODE_HEIGHT / 2;
        for (const node of state.catalog.nodes) {
          const layout = state.nodeLayout[node.id];
          if (layout.x - halfWidth < 0 || layout.y - halfHeight < 0 || layout.x + halfWidth > constants.TECH_MAP_WIDTH || layout.y + halfHeight > constants.TECH_MAP_HEIGHT) {
            warnings.push(node.label + " is partly outside the map.");
          }
        }
        for (let index = 0; index < state.catalog.nodes.length; index += 1) {
          const leftNode = state.catalog.nodes[index];
          const left = nodeRect(state.nodeLayout[leftNode.id], constants);
          for (let nextIndex = index + 1; nextIndex < state.catalog.nodes.length; nextIndex += 1) {
            const rightNode = state.catalog.nodes[nextIndex];
            const right = nodeRect(state.nodeLayout[rightNode.id], constants);
            const overlapX = Math.min(left.right, right.right) - Math.max(left.left, right.left);
            const overlapY = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
            if (overlapX > 2 && overlapY > 2) {
              warnings.push(leftNode.label + " overlaps " + rightNode.label + ".");
            }
          }
        }
        return warnings.slice(0, 12);
      }

      function renderControls() {
        const dirty = isDirty();
        els.save.disabled = !dirty;
        els.reset.disabled = !dirty;
        els.dirtyState.textContent = dirty ? "Unsaved changes" : "Clean";
        els.dirtyState.style.color = dirty ? "var(--warn)" : "var(--muted)";
        els.status.textContent = state.statusText;
        els.status.className = "status" + (state.statusClass ? " " + state.statusClass : "");
      }

      function startDrag(event, id) {
        if (event.button !== 0) return;
        selectNode(id);
        const point = mapPoint(event);
        state.dragging = {
          id,
          pointerId: event.pointerId,
          startX: point.x,
          startY: point.y,
          startNode: clone(state.nodeLayout[id]),
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      }

      function onPointerMove(event) {
        if (!state.dragging) return;
        const point = mapPoint(event);
        state.nodeLayout[state.dragging.id] = {
          x: applySnap(state.dragging.startNode.x + point.x - state.dragging.startX),
          y: applySnap(state.dragging.startNode.y + point.y - state.dragging.startY),
        };
        renderMap();
        renderSelection();
        renderWarnings();
        renderControls();
      }

      function endDrag() {
        state.dragging = null;
      }

      function selectNode(id) {
        state.selected = { id };
        render();
      }

      function nudgeSelected(dx, dy) {
        const layout = state.nodeLayout[state.selected.id];
        layout.x += dx;
        layout.y += dy;
        render();
      }

      function mapPoint(event) {
        const rect = els.map.getBoundingClientRect();
        return {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
      }

      function applySnap(value) {
        return els.snap.checked ? Math.round(value / SNAP_SIZE) * SNAP_SIZE : Math.round(value);
      }

      function getLinkPath(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        if (Math.abs(dx) >= Math.abs(dy)) {
          const curve = Math.max(72, Math.min(220, Math.abs(dx) * 0.45));
          const direction = Math.sign(dx) || 1;
          return "M " + from.x + " " + from.y + " C " + (from.x + curve * direction) + " " + from.y + ", " + (to.x - curve * direction) + " " + to.y + ", " + to.x + " " + to.y;
        }
        const curve = Math.max(58, Math.min(180, Math.abs(dy) * 0.45));
        const direction = Math.sign(dy) || 1;
        return "M " + from.x + " " + from.y + " C " + from.x + " " + (from.y + curve * direction) + ", " + to.x + " " + (to.y - curve * direction) + ", " + to.x + " " + to.y;
      }

      function nodeRect(layout, constants) {
        const halfWidth = constants.TECH_NODE_WIDTH / 2;
        const halfHeight = constants.TECH_NODE_HEIGHT / 2;
        return {
          left: layout.x - halfWidth,
          right: layout.x + halfWidth,
          top: layout.y - halfHeight,
          bottom: layout.y + halfHeight,
        };
      }

      function isDirty() {
        return JSON.stringify(state.nodeLayout) !== JSON.stringify(state.originalNodeLayout);
      }

      function setStatus(text, className) {
        state.statusText = text;
        state.statusClass = className;
        renderControls();
      }

      function titleStrong(text) {
        const strong = document.createElement("strong");
        strong.textContent = text;
        return strong;
      }

      function titleSpan(text) {
        const span = document.createElement("span");
        span.textContent = text;
        return span;
      }

      function clone(value) {
        return JSON.parse(JSON.stringify(value));
      }

      function isEditingText(target) {
        return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || Boolean(target?.closest?.("[contenteditable='true']"));
      }
    </script>
  </body>
</html>`;
}
