import React, { useMemo } from 'react'
import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'

export const sampleColumns = [
  {
    Header: 'Sample ID',
    accessor: 'Sample ID',
    width: 150,
  },
  {
    Header: 'AM Environment',
    accessor: 'Am Environment',
    width: 150,
  },
  {
    Header: 'Sample Type',
    accessor: 'Sample Type',
    width: 150,
  },
  {
    Header: 'Sample Site Location Description',
    accessor: 'Sample Site Location Description',
    width: 150,
  },
  {
    Header: 'Latitude [decimal_degrees]',
    accessor: 'Latitude [decimal_degrees]',
    width: 150,
  },
  {
    Header: 'Longitude [decimal_degrees]',
    accessor: 'Longitude [decimal_degrees]',
    width: 150,
  },
  {
    Header: 'Env Broad Scale',
    accessor: 'Env Broad Scale',
    width: 150,
  },
  {
    Header: 'Env Local Scale',
    accessor: 'Env Local Scale',
    width: 150,
  },
  {
    Header: 'Env Medium',
    accessor: 'Env Medium',
    width: 150,
  },
]
