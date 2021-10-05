import React, { Component } from "react";
import styled, { keyframes, css } from "styled-components";

const size = 2
const time = 2.1
const timedelay = -0.89
const ease_circ = "cubic-bezier(0.42, 0, 0.58, 1)";

const color1 = "rgb(4, 30, 72)"
const color2 = "rgb(23, 196, 150)"
const scale = 0.3

function animationBefore(size, color) {
  return keyframes`
  0% {
    top: ${size * -2}vh;
    z-index: 1;
  }
  25% {
    transform: scale(1.2) ;
    z-index: 1;
  }
  50% {
    top: ${size * 2}vh;
    z-index: -1;
  }
  75% {
    background-color: ${color};
    transform: scale(0.8) ;
    z-index: -1;
  }
  100% {
    top: ${size * -2}vh;
    z-index: -1;
  }
`;
}

function animationAfter(size, color) {
  return keyframes`
  0% {
    top: ${size * 2}vh;
    z-index: -1;
  }
  25% {
    background-color: ${color};
    transform: scale(0.8) ;
    z-index: -1;
  }
  50% {
    top: ${size * -2}vh;
    z-index: 1;
  }
  75% {
    transform: scale(1.2) ;
    z-index: 1;
  }
  100% {
    top: ${size * 2}vh;
    z-index: 1;
  }
`;
}

function getAnimations(time, timedelay, ease_circ, size, color1, color2) {
  return css`
    &:nth-child(0) {
      animation-delay: ${0 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${0 * (timedelay * time)}s;
        animation-delay: ${0 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${0 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }

    &:nth-child(1) {
      animation-delay: ${1 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${1 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${1 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }

    &:nth-child(2) {
      animation-delay: ${2 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${2 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${2 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }

    &:nth-child(3) {
      animation-delay: ${3 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${3 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${3 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }

    &:nth-child(4) {
      animation-delay: ${4 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${4 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${4 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }

    &:nth-child(5) {
      animation-delay: ${5 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${5 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${5 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }

    &:nth-child(6) {
      animation-delay: ${6 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${6 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${6 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }

    &:nth-child(7) {
      animation-delay: ${7 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${7 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${7 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }

    &:nth-child(8) {
      animation-delay: ${8 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${8 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${8 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }

    &:nth-child(9) {
      animation-delay: ${9 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${9 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${9 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }

    &:nth-child(10) {
      animation-delay: ${10 * (timedelay * time)}s;

      &:before {
        animation: ${css`${animationBefore(
          size,
          color1
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${10 * (timedelay * time)}s;
        background-color: ${color1};
      }

      &:after {
        animation: ${css`${animationAfter(
          size,
          color2
        )} ${time}s ${ease_circ} infinite;`};
        animation-delay: ${10 * (timedelay * time)}s;
        background-color: ${color2};
      }
    }
  `;
}

const Helix = styled.div`
    display: inline-block;
    position: relative;
    vertical-align: middle;

    &:not(:last-child){
      margin-right: ${size * 1.62}vh;  
    }

    &:before, &:after {
      content: "";
      display: inline-block;
      width: ${size}vh;
      height: ${size}vh;
      border-radius: 50%; 
      position: absolute;
    }
    ${props => getAnimations(time, timedelay, ease_circ, size, props.color1 ? props.color1 : color1, props.color2 ? props.color2 : color2)}
`;

const HelixContainer = styled.div`
  display: inline-block;
  position: relative;
  transform: scale(${props => props.scale ? props.scale : scale});
`;

type IProps = { scale: number; color1: string, color2: string };

class AnimateHelix extends Component<any, IProps> {
  render() {
    return (
      <>
        <HelixContainer scale={this.props.scale}>
            <Helix color1={this.props.color1} color2={this.props.color2}/>
            <Helix color1={this.props.color1} color2={this.props.color2}/>
            <Helix color1={this.props.color1} color2={this.props.color2}/>
            <Helix color1={this.props.color1} color2={this.props.color2}/>
            <Helix color1={this.props.color1} color2={this.props.color2}/>
            <Helix color1={this.props.color1} color2={this.props.color2}/>
            <Helix color1={this.props.color1} color2={this.props.color2}/>
            <Helix color1={this.props.color1} color2={this.props.color2}/>
            <Helix color1={this.props.color1} color2={this.props.color2}/>
            <Helix color1={this.props.color1} color2={this.props.color2}/>
          </HelixContainer>
      </>
    );
  }
}

export default AnimateHelix;
