import React from 'react'
import authService from 'services/auth/authService'

type LogoutButtonProps = {
  className?: string
  children?: React.ReactNode
}

const LogoutButton = ({ className, children }: LogoutButtonProps) => {
  return (
    <button onClick={() => authService.logout()} className={className || 'btn btn-danger'}>
      {children || 'Logout'}
    </button>
  )
}

export default LogoutButton
