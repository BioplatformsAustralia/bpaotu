import React, { useState, useRef, useEffect } from 'react'

import authService from 'services/auth/authService'
import { UserInfo } from 'services/auth/types'
import { AuthenticationState } from 'reducers/auth'

import LoginButton from './login_button'
import LogoutButton from './logout_button'

type UserProfileProps = {
  auth: AuthenticationState
  header?: boolean
}

const UserProfile = ({ auth, header = false }: UserProfileProps) => {
  const ref = useRef<HTMLDivElement | null>(null)

  const { isAuthenticated, isLoginInProgress } = auth

  const [user, setUser] = useState<UserInfo | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true)

  // Close when clicked outside details box
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsDetailsOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Get user-info if authenticated
  useEffect(() => {
    if (!isAuthenticated || isLoginInProgress) return

    let isMounted = true

    const getUserInfo = async () => {
      try {
        const userInfo = await authService.getUserInfo()

        if (!isMounted) return
        setUser(userInfo)
      } catch (error) {
        if (isMounted) {
          console.error('Failed to check authentication status:', error)
        }
      } finally {
        if (isMounted) {
          setIsLoadingUserInfo(false)
        }
      }
    }

    getUserInfo()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, isLoginInProgress])

  if (isAuthenticated && isLoadingUserInfo) {
    return (
      <div className="spinner-border" role="status" style={{ minWidth: '32px', minHeight: '32px' }}>
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  // Don't show when not logged in because full page alert is shown
  if (!isAuthenticated) {
    if (header) {
      return null
    } else {
      return <LoginButton className="btn btn-sm btn-primary" />
    }
  }

  return (
    <div ref={ref} className="d-flex align-items-center" style={{ position: 'relative' }}>
      {user && user.picture && (
        <img
          src={user.picture}
          className="rounded-circle"
          onClick={() => setIsDetailsOpen((prev) => !prev)}
          style={{
            width: '32px',
            height: '32px',
            cursor: 'pointer',
          }}
        />
      )}

      {isDetailsOpen && user && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: 0,
            minWidth: '200px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
          }}
        >
          <div className="font-weight-bold">{user.name}</div>
          <div className="small text-muted mb-2">{user.email}</div>
          {user.auth_mode === 'local' ? (
            <div className="small text-muted">
              Authentication disabled in local development mode.
            </div>
          ) : (
            <>
              <div className="small text-muted mb-2">
                Logged in with BioCommons Access single sign-on
              </div>
              <div className="text-center">
                <LogoutButton className="btn btn-sm btn-outline-danger" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default UserProfile
