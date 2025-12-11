import React from 'react'
import styled, { keyframes, css } from 'styled-components'

const size = 2
const time = 2.1
const timedelay = -0.89
const easeCirc = 'cubic-bezier(0.42, 0, 0.58, 1)'
const defaultColor1 = 'rgb(4, 30, 72)'
const defaultColor2 = 'rgb(23, 196, 150)'
const defaultScale = 0.3

// Keyframe animations
const animationBefore = (size: number, color: string) => keyframes`
  0% { top: ${-2 * size}vh; z-index: 1; }
  25% { transform: scale(1.2); z-index: 1; }
  50% { top: ${2 * size}vh; z-index: -1; }
  75% { background-color: ${color}; transform: scale(0.8); z-index: -1; }
  100% { top: ${-2 * size}vh; z-index: -1; }
`

const animationAfter = (size: number, color: string) => keyframes`
  0% { top: ${2 * size}vh; z-index: -1; }
  25% { background-color: ${color}; transform: scale(0.8); z-index: -1; }
  50% { top: ${-2 * size}vh; z-index: 1; }
  75% { transform: scale(1.2); z-index: 1; }
  100% { top: ${2 * size}vh; z-index: 1; }
`

// Styled components
interface HelixProps {
  color1?: string
  color2?: string
}

const Helix = styled.div<HelixProps>`
  display: inline-block;
  position: relative;
  vertical-align: middle;

  &:not(:last-child) {
    margin-right: ${size * 1.62}vh;
  }

  &:before,
  &:after {
    content: '';
    display: inline-block;
    width: ${size}vh;
    height: ${size}vh;
    border-radius: 50%;
    position: absolute;
  }

  ${(props) =>
    Array.from({ length: 10 })
      .map(
        (_, i) => css`
          &:nth-child(${i}) {
            animation-delay: ${i * timedelay * time}s;

            &:before {
              animation: ${animationBefore(size, props.color1 ?? defaultColor1)}
                ${time}s ${easeCirc} infinite;
              animation-delay: ${i * timedelay * time}s;
              background-color: ${props.color1 ?? defaultColor1};
            }

            &:after {
              animation: ${animationAfter(size, props.color2 ?? defaultColor2)}
                ${time}s ${easeCirc} infinite;
              animation-delay: ${i * timedelay * time}s;
              background-color: ${props.color2 ?? defaultColor2};
            }
          }
        `
      )
      .reduce((acc, curr) => css`
        ${acc};
        ${curr};
      `)}
`

interface HelixContainerProps {
  scale?: number
}

const HelixContainer = styled.div<HelixContainerProps>`
  display: inline-block;
  position: relative;
  transform: scale(${(props) => props.scale ?? defaultScale});
`

// Functional component
interface AnimateHelixProps {
  scale?: number
  color1?: string
  color2?: string
}

const AnimateHelix: React.FC<AnimateHelixProps> = ({ scale, color1, color2 }) => {
  return (
    <HelixContainer scale={scale}>
      {Array.from({ length: 10 }).map((_, i) => (
        <Helix key={i} color1={color1} color2={color2} />
      ))}
    </HelixContainer>
  )
}

export default AnimateHelix
