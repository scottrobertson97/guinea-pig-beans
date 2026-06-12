export function getButton(id: string): HTMLButtonElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Missing button #${id}`);
  }
  return element;
}

export function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element;
}

export function getDialog(id: string): HTMLDialogElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLDialogElement)) {
    throw new Error(`Missing dialog #${id}`);
  }
  return element;
}

export function getImage(id: string): HTMLImageElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLImageElement)) {
    throw new Error(`Missing image #${id}`);
  }
  return element;
}

export function getDataElement(attribute: string, value: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[${attribute}="${value}"]`);
  if (!element) {
    throw new Error(`Missing element [${attribute}="${value}"]`);
  }
  return element;
}
