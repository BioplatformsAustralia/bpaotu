import React from 'react'
import Tour from 'reactour'
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
import { Badge, UncontrolledTooltip } from 'reactstrap'
import Octicon from 'components/octicon'

export const stepsStyle = {
  backgroundColor: 'rgb(30 30 30 / 90%)',
  color: 'rgb(255 255 255 / 90%)',
  padding: '50px 30px',
  boxShadow: 'rgb(0 0 0 / 30%) 0px 0.5em 3em',
  maxWidth: '500px',
}

export const AMBLink = ({ text }) => {
  return (
    <a
      rel="noopener noreferrer"
      target="_bpaotu"
      href={
        window.otu_search_config.ckan_base_url +
        'organization/pages/australian-microbiome/processed'
      }
    >
      {text}
    </a>
  )
}

export const Tutorial = (props) => {
  const disableBody = (target) => disableBodyScroll(target)
  const enableBody = (target) => enableBodyScroll(target)

  return (
    <>
      <Tour
        accentColor={'#007bff'}
        prevButton={'<< Prev'}
        nextButton={'Next >>'}
        disableFocusLock={true}
        closeWithMask={false}
        badgeContent={(curr, tot) => `${curr} of ${tot}`}
        rounded={5}
        onAfterOpen={disableBody}
        onBeforeClose={enableBody}
        {...props}
      />
    </>
  )
}

export const TutorialBadge = ({ id, onClick, tooltip = '' }) => {
  return (
    <>
      <Badge
        id={id}
        style={{
          cursor: 'pointer',
          fontSize: '14px',
          marginTop: '-10px',
          padding: '10px 25px',
          color: '#041e48',
          backgroundColor: '#17c496',
        }}
        onClick={onClick}
        pill
      >
        <Octicon name="book" />
        <span style={{ marginLeft: 6 }}>Tutorial</span>
      </Badge>
      <UncontrolledTooltip target={id} placement="auto">
        {tooltip}
      </UncontrolledTooltip>
    </>
  )
}
