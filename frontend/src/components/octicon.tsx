import * as React from 'react'
import * as octicons from 'octicons'

const style = {
  display: 'inline-block',
  paddingTop: 0,
}

const Sizes = {
  small: 12,
  medium: 16,
  default: 20,
  large: 32,
  larger: 48,
}

type OcticonProps = {
  size?: keyof typeof Sizes
  name: keyof typeof octicons
}

export default ({ size = 'default', name }: OcticonProps) => {
  const width = Sizes[size]

  const options = { width, height: width }
  return <div style={style} dangerouslySetInnerHTML={{ __html: octicons[name].toSVG(options) }} />
}
