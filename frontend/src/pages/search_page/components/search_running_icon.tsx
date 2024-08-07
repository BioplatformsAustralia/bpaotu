import React from 'react'
import Octicon from 'components/octicon'

const SearchRunningIcon = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 35,
        transform: 'translate(50%, -50%)',
        background: '#FF1216',
        borderRadius: '50%',
        padding: '3px',
        width: '26px',
        height: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Octicon name="watch" />
    </div>
  )
}

export default SearchRunningIcon
