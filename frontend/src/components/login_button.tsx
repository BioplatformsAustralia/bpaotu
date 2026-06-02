import React from 'react'
import authService from 'services/auth/authService'

type LoginButtonProps = {
  className?: string
  children?: React.ReactNode
}

const LoginButton = ({ className, children }: LoginButtonProps) => {
  return (
    <button onClick={() => authService.login()} className={className || 'btn btn-primary'}>
      {children || 'Login to BioCommons'}
    </button>
  )
}

export default LoginButton
