/** Configuração lida do ambiente (.env no frodo). Falta de variável obrigatória para a partida. */
export interface Config {
  databaseUrl: string
  port: number
  vapid: { publicKey: string; privateKey: string; subject: string }
  /** Client ID OAuth do Google; sem ele, o login fica desligado. */
  googleClientId?: string
  /** Só em desenvolvimento: aceita credenciais "teste:..." nos testes de ponta a ponta. */
  authTest: boolean
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const need = (name: string) => {
    const value = env[name]?.trim()
    if (!value) throw new Error(`variável de ambiente ${name} não definida`)
    return value
  }
  return {
    databaseUrl: need('DATABASE_URL'),
    port: Number(env.PORT ?? 8787),
    vapid: { publicKey: need('VAPID_PUBLIC_KEY'), privateKey: need('VAPID_PRIVATE_KEY'), subject: need('VAPID_SUBJECT') },
    googleClientId: env.GOOGLE_CLIENT_ID?.trim() || undefined,
    // Nunca em produção, mesmo que a variável venha por engano.
    authTest: env.AUTH_TEST === '1' && env.NODE_ENV !== 'production',
  }
}
