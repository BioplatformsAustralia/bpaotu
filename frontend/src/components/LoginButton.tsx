import React, { useState, useEffect } from 'react'
import authService from '../services/authService'

/**
 * LoginButton component
 * Displays a login button for unauthenticated users
 */
const LoginButton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <button onClick={() => authService.login()} className={className || 'btn btn-primary'}>
      Login to BioCommons
    </button>
  )
}

export default LoginButton
