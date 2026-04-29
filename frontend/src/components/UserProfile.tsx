import React, { useState, useRef, useEffect } from 'react'
import authService from '../services/authService'
import LoginButton from './LoginButton'
import LogoutButton from './LogoutButton'

interface UserInfo {
  id: number
  username: string
  email: string
  name: string
  picture?: string
}

interface UserProfileProps {
  header?: boolean
}

const UserProfile: React.FC<UserProfileProps> = ({ header = false }) => {
  const ref = useRef<HTMLDivElement | null>(null)

  const [user, setUser] = useState<UserInfo | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Close when clicked outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsDetailsOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Check auth status on mount
  useEffect(() => {
    let isMounted = true

    const checkAuthStatus = async () => {
      try {
        const authStatus = await authService.checkAuth()

        if (!isMounted) return
        setIsAuthenticated(authStatus.authenticated)

        if (authStatus.authenticated) {
          const userInfo = await authService.getUserInfo()
          if (!isMounted) return
          setUser(userInfo)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to check authentication status:', error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuthStatus()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
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
          <div className="small text-muted mb-2">
            Logged in with BioCommons Access single sign-on
          </div>
          <div className="text-center">
            <LogoutButton className="btn btn-sm btn-outline-danger">Logout</LogoutButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile
