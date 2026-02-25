import React, { useCallback, useMemo } from 'react'
import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'

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

export const searchColumns = [
  {
    Header: 'MAG ID',
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
    Header: 'Sample ID',
    accessor: 'sample_id',
    Cell: sample_inspect_link,
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Bin ID',
    accessor: 'bin_id',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'NCBI',
    accessor: 'biosample',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Method',
    accessor: 'method',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Domain',
    accessor: 'tax_domain',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Phylum',
    accessor: 'tax_phylum',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Class',
    accessor: 'tax_class',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Order',
    accessor: 'tax_order',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Family',
    accessor: 'tax_family',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Genus',
    accessor: 'tax_genus',
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Species',
    accessor: 'tax_species',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Quality',
    sortable: true,
    accessor: 'quality',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Completeness',
    accessor: 'completeness',
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Contamination',
    sortable: true,
    accessor: 'contamination',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Length',
    accessor: 'length',
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'GC%',
    sortable: true,
    accessor: 'gc_perc',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: '# Contigs',
    sortable: true,
    accessor: 'num_contigs',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Disparity',
    sortable: true,
    accessor: 'disparity',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Strain Het',
    sortable: true,
    accessor: 'strain_het',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: 'Coverage',
    sortable: true,
    accessor: 'coverage',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  // last column needs a bit more minWidth
  {
    Header: 'TPM',
    sortable: true,
    accessor: 'tpm',
    minWidth: 160,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
]
