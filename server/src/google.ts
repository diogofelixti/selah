import { OAuth2Client } from 'google-auth-library'

/** Confere o token de identidade do Google. null quando não vale (assinatura, audiência, validade, e-mail). */
export type VerifyGoogle = (credential: string) => Promise<{ sub: string; email: string } | null>

export function googleVerifier(clientId: string): VerifyGoogle {
  const client = new OAuth2Client(clientId)
  return async (credential) => {
    try {
      // A biblioteca confere assinatura (chaves do Google), audiência, emissor e expiração.
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId })
      const p = ticket.getPayload()
      if (!p?.sub || !p.email || p.email_verified !== true) return null
      return { sub: p.sub, email: p.email }
    } catch {
      return null
    }
  }
}

/**
 * Verificador dos testes de ponta a ponta: aceita "teste:<sub>:<email>". Só existe fora de produção e com
 * AUTH_TEST=1 (ver config.ts); nunca é ligado na imagem do frodo.
 */
export const testVerifier: VerifyGoogle = async (credential) => {
  const m = /^teste:([\w-]{1,40}):([^:\s]{3,100})$/.exec(credential)
  return m ? { sub: `teste-${m[1]}`, email: m[2] } : null
}
