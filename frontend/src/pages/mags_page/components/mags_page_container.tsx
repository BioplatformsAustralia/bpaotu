import React from 'react'
import { useHistory } from 'react-router-dom'
import { Container, Row, NavLink } from 'reactstrap'

const MagsPageContainer = ({ children }) => {
  const history = useHistory()

  return (
    <Container fluid={true}>
      <Row>
        <div>
          <NavLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              history.go(-1) // go back 1
            }}
          >
            Back
          </NavLink>
        </div>
      </Row>

      {children}
    </Container>
  )
}

export default MagsPageContainer
