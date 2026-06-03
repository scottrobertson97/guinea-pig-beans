const BASE_URL = import.meta.env.BASE_URL;

export function assetPath(path: string): string {
  return `${BASE_URL}${path.replace(/^\/+/, "")}`;
}
