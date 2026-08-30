export function kebabToCamel(str: string) {
  return str.replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase())
}
