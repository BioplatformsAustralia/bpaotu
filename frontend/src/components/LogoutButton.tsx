import React from 'react'
import authService from '../services/authService'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
}

/**
 * LogoutButton component
 * Displays a logout button for authenticated users
 */
const LogoutButton: React.FC<LogoutButtonProps> = ({ className, children }) => {
  return (
    <button onClick={() => authService.logout()} className={className || 'btn btn-danger'}>
      {children || 'Logout'}
    </button>
  )
}

export default LogoutButton
