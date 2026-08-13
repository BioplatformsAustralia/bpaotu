import * as React from 'react'
import { Alert } from 'reactstrap'

import { type Error } from 'pages/search_page/reducers/types'

type SearchErrorsProps = {
  errors: Error[]
}

const SearchErrors = ({ errors }: SearchErrorsProps) => {
  if (errors.length === 0) {
    return <span />
  }
  return (
    <Alert color="danger" fade={false}>
      <h4 className="alert-heading">Errors</h4>
      <ul>
        {errors.map((err: Error, idx: number) => (
          <li key={idx}>{err}</li>
        ))}
      </ul>
    </Alert>
  )
}

export default SearchErrors
