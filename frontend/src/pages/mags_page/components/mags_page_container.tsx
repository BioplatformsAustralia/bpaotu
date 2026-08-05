import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Row, NavLink } from 'reactstrap'

const MagsPageContainer = ({ children }) => {
  6
  const navigate = useNavigate()

  return (
    <Container fluid={true}>
      <Row>
        <div>
          <NavLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              navigate(-1) // go back 1
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
