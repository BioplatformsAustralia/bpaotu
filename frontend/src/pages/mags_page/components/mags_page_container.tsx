import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Row } from 'reactstrap'

const MagsPageContainer = ({ children }) => {
  const navigate = useNavigate()

  return (
    <Container fluid>
      <Row className="mt-1 mb-2">
        <div>
          <button
            //
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </Row>

      {children}
    </Container>
  )
}

export default MagsPageContainer
