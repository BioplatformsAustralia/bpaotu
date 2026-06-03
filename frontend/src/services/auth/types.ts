type AuthMode = 'oauth' | 'local'

export interface CheckAuthResult {
  authenticated: boolean
  email?: string
  organisations?: string[]
  auth_mode?: AuthMode
}

export type UserInfo = {
  username: string
  email: string
  name: string
  picture?: string
  organisations?: string[]

  auth_mode: AuthMode
}
