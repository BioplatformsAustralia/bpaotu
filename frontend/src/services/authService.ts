/**
 * Auth service for handling OAuth/OIDC with Auth0
 */

import axios from 'axios'

export type UserInfo = {
  id: number
  username: string
  email: string
  name: string
  picture?: string
  organisations?: string[]

  auth_mode: 'oauth' | 'local'
}

interface AuthStatus {
  authenticated: boolean
  username?: string
}

class AuthService {
  /**
   * Redirect to Auth0 login
   */
  login() {
    window.location.href = '/oidc/login/'
  }

  /**
   * Redirect to logout
   */
  logout() {
    window.location.href = '/oidc/logout/'
  }

  /**
   * Get current user info
   */
  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const response = await axios.get(window.otu_search_config.oauth_user_info, {
        headers: {
          Accept: 'application/json',
        },
      })
      return response.data
    } catch (error) {
      console.error('Failed to get user info:', error)
      return null
    }
  }

  /**
   * Check if user is authenticated
   */
  async checkAuth(): Promise<AuthStatus> {
    try {
      const response = await axios.get(window.otu_search_config.oauth_check_auth, {
        headers: {
          Accept: 'application/json',
        },
      })
      return response.data
    } catch (error) {
      console.error('Failed to check auth:', error)
      return { authenticated: false }
    }
  }

  /**
   * Handle OAuth callback
   * Usually called automatically, but can be used for manual redirect handling
   */
  handleCallback() {
    // The backend handles the callback and redirects
    // This is mostly here for reference
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return { error, state }
    }

    if (code && state) {
      return { code, state }
    }

    return null
  }
}

export default new AuthService()
