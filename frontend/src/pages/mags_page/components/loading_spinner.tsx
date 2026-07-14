import React from 'react'
import { Container } from 'reactstrap'

import AnimateHelix from 'components/animate_helix'

interface Props {
  text?: string
}

const LoadingSpinner = ({ text }: Props) => {
  return (
    <Container>
      <div
        style={{
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {text && <p>{text}</p>}
        <AnimateHelix />
      </div>
    </Container>
  )
}

export default LoadingSpinner
