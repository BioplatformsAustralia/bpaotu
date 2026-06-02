import React from 'react'

type RegisterButtonProps = {
  className?: string
  children?: React.ReactNode
}

const RegisterButton = ({ className, children }: RegisterButtonProps) => {
  const registerUrl = window.otu_search_config.register_access_url

  const handleClick = () => {
    window.open(registerUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button onClick={handleClick} className={className || 'btn btn-primary'} type="button">
      {children || 'Register for BioCommons Access'}
    </button>
  )
}

export default RegisterButton
