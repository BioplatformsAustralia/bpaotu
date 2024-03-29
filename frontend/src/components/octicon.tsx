import * as React from 'react'
import * as octicons from 'octicons'

const style = {
  display: 'inline-block',
  paddingTop: 0,
}

export default (props) => {
  const Sizes = {
    small: 12,
    medium: 16,
    large: 32,
    larger: 48,
  }
  const width = Sizes[props.size] || 20

  const options = { width, height: width }
  return (
    <div style={style} dangerouslySetInnerHTML={{ __html: octicons[props.name].toSVG(options) }} />
  )
}
