export type Dict = { [key: string]: string | Dict }

export function translate(dict: Dict, key: string, params?: Record<string, string | number>): string {
  let node: string | Dict | undefined = dict
  for (const part of key.split('.')) {
    node = typeof node === 'object' ? node[part] : undefined
  }
  if (typeof node !== 'string') return key
  if (!params) return node
  return node.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}

export function flattenKeys(dict: Dict, prefix = ''): string[] {
  return Object.entries(dict).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : flattenKeys(v, `${prefix}${k}.`),
  )
}
