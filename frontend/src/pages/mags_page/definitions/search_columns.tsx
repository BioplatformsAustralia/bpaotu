import React, { useCallback, useMemo } from 'react'
import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'

import { UncontrolledTooltip } from 'reactstrap'
import Octicon from 'components/octicon'

const mag_inspect_link = (props) => (
  <NavLink to={`/mags/mag/${props.value}`} tag={RRNavLink}>
    {props.value}
  </NavLink>
)

const sample_inspect_link = (props) => (
  <NavLink to={`/mags/sample/${props.value}`} tag={RRNavLink}>
    {props.value}
  </NavLink>
)

const InputSearch = ({ filter, onChange, width = 150 }) => {
  // Safe string value for controlled input: empty string if no filter yet.
  const value = filter && typeof filter.value === 'string' ? filter.value : ''

  return (
    <input
      type="search"
      value={value}
      onChange={(event) => {
        // For text filters in react-table v6, `undefined` removes the filter
        const next = event.currentTarget.value
        onChange(next.trim() === '' ? undefined : next)
      }}
      style={{ width: width - 20 }}
    />
  )
}

type NumberRange = { min?: string; max?: string }
const InputNumberRange: React.FC<{
  filter?: { value?: NumberRange }
  onChange: (val: NumberRange | undefined) => void
  width?: number
}> = ({ filter, onChange, width = 150 }) => {
  const current = (filter && filter.value) || {}
  const halfWidth = (width - 20) / 2 // with buffer

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next: NumberRange = { ...current, min: e.currentTarget.value }
      if (!next.min && !next.max) return onChange(undefined) // tells react-table to clear
      onChange(next)
    },
    [current, onChange]
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next: NumberRange = { ...current, max: e.currentTarget.value }
      if (!next.min && !next.max) return onChange(undefined) // tells react-table to clear
      onChange(next)
    },
    [current, onChange]
  )

  const DECIMAL_PATTERN = '^-?\d*\.?\d*$'

  return (
    <>
      <input
        placeholder="Min"
        value={current.min || ''}
        onChange={handleMinChange}
        style={{ width: halfWidth, marginRight: 1 }}
        inputMode="decimal"
        pattern={DECIMAL_PATTERN}
      />
      <input
        placeholder="Max"
        value={current.max || ''}
        onChange={handleMaxChange}
        style={{ width: halfWidth, marginLeft: 1 }}
        inputMode="decimal"
        pattern={DECIMAL_PATTERN}
      />
    </>
  )
}

const HeaderInfo = ({ label, units = '', infoText = '' }) => {
  const tipId = `table-header-tooltip-${btoa(label)}`
  return (
    <div
      style={{
        position: 'relative',
        textAlign: 'center',
      }}
    >
      <div>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 'normal', color: '#626267' }}>
        {units || <>&nbsp;</>}
      </div>
      {infoText && (
        <>
          <span
            id={tipId}
            style={{
              position: 'absolute',
              top: 0,
              right: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Octicon name="info" />
          </span>

          <UncontrolledTooltip target={tipId} autohide={false} placement="bottom">
            {infoText}
          </UncontrolledTooltip>
        </>
      )}
    </div>
  )
}

export const searchColumns = [
  {
    Header: <HeaderInfo label="MAG ID" infoText="TEST no units" />,
    accessor: 'unique_id',
    Cell: mag_inspect_link,
    filterable: true,
    sortable: true,
    minWidth: 250,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={250} />
    ),
  },
  {
    Header: <HeaderInfo label="Sample ID" units="kg" infoText="TEST with units" />,
    accessor: 'sample_id',
    Cell: sample_inspect_link,
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Bin ID" />,
    accessor: 'bin_id',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="NCBI" />,
    accessor: 'biosample',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Domain" />,
    accessor: 'tax_domain',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Phylum" />,
    accessor: 'tax_phylum',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Class" />,
    accessor: 'tax_class',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Order" />,
    accessor: 'tax_order',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Family" />,
    accessor: 'tax_family',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Genus" />,
    accessor: 'tax_genus',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Species" />,
    accessor: 'tax_species',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Quality" units="%" />,
    sortable: true,
    accessor: 'quality',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Completeness" />,
    accessor: 'completeness',
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Contamination" />,
    sortable: true,
    accessor: 'contamination',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: (
      <HeaderInfo label="Length" units="base pairs" infoText="Length of the assembled genome" />
    ),
    accessor: 'length',
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="GC%" />,
    sortable: true,
    accessor: 'gc_perc',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="# Contigs" />,
    sortable: true,
    accessor: 'num_contigs',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Disparity" />,
    sortable: true,
    accessor: 'disparity',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Strain Het" />,
    sortable: true,
    accessor: 'strain_het',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo label="Coverage" />,
    sortable: true,
    accessor: 'coverage',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  // last column needs a bit more minWidth
  {
    Header: <HeaderInfo label="TPM" />,
    sortable: true,
    accessor: 'tpm',
    minWidth: 160,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
]
