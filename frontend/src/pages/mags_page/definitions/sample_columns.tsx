import React, { useMemo } from 'react'
import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'

export const sampleColumnsLookup = {
  'Sample ID': {
    label: 'Sample ID',
  },
  'Am Environment': {
    label: 'AM Environment',
  },
  'Sample Type': {
    label: 'Sample Type',
  },
  'Sample Site Location Description': {
    label: 'Sample Site Location Description',
  },
  'Latitude [decimal_degrees]': {
    label: 'Latitude',
    units: 'decimal degrees',
  },
  'Longitude [decimal_degrees]': {
    label: 'Longitude',
    units: 'decimal degrees',
  },
  'Env Broad Scale': {
    label: 'Env Broad Scale',
  },
  'Env Local Scale': {
    label: 'Env Local Scale',
  },
  'Env Medium': {
    label: 'Env Medium',
  },
}

export const sampleColumns = [
  {
    accessor: 'Sample ID',
  },
  {
    accessor: 'Am Environment',
  },
  {
    accessor: 'Sample Type',
  },
  {
    accessor: 'Sample Site Location Description',
  },
  {
    accessor: 'Latitude [decimal_degrees]',
  },
  {
    accessor: 'Longitude [decimal_degrees]',
  },
  {
    accessor: 'Env Broad Scale',
  },
  {
    accessor: 'Env Local Scale',
  },
  {
    accessor: 'Env Medium',
  },
]
