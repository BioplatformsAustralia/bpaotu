import React from 'react'
import Octicon from 'components/octicon'

const SearchFinishedIcon = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 35,
        transform: 'translate(50%, -50%)',
        background: '#00AF50',
        borderRadius: '50%',
        paddingBottom: '2px',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Octicon name="check" size="medium" />
    </div>
  )
}

export default SearchFinishedIcon
