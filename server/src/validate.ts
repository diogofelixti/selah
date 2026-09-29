/** Serviços de push dos navegadores. Só eles recebem chamadas do servidor (evita SSRF). */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^([a-z0-9-]+\.)*push\.services\.mozilla\.com$/, /^([a-z0-9-]+\.)*push\.apple\.com$/, /^([a-z0-9-]+\.)*notify\.windows\.com$/]

export function isPushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 1000) return false
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  return url.protocol === 'https:' && url.port === '' && PUSH_HOSTS.some((re) => re.test(url.hostname))
}

/** "HH:MM" em minutos desde a meia-noite; null se inválido. */
export function parseTime(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** Chave de inscrição em base64url, com tamanho razoável. */
export function isKey(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max && /^[A-Za-z0-9_-]+=*$/.test(value)
}

export function isDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

/** Data "AAAA-MM-DD" de um instante no fuso dado. */
export function localDate(at: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at)
}

/** Diferença em dias entre duas datas "AAAA-MM-DD". */
export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000)
}
