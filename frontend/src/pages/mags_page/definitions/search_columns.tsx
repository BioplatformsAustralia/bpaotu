import React, { useCallback, useMemo } from 'react'
import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'
import md5 from 'blueimp-md5'

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

const HeaderInfo = ({ accessor }) => {
  const { label, units, infoText } = searchColumnsLookup[accessor]
  const tipId = `table-header-tooltip-${md5(label)}`

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

export const searchColumnsLookup = {
  mag_id: {
    label: 'MAG ID',
    units: '',
    infoText: 'MAG identifier',
  },
  sample_id: {
    label: 'Sample ID',
    units: '',
    infoText: 'AM sample identifier',
  },
  biosample: {
    label: 'NCBI',
    units: '',
    infoText: 'NCBI BioSample',
  },

  gtdb_tax: {
    label: 'GTDB Tax',
    units: 'string',
    infoText: 'GTDB-Tk taxonomy assignment of the MAG',
  },
  quality: {
    label: 'Quality',
    units: '%',
    infoText: "Quality score ('Completeness' - (5 * 'Contamination'))",
  },
  completeness: {
    label: 'Completeness',
    units: '%',
    infoText: 'Completeness of the MAG (checkM)',
  },
  contamination: {
    label: 'Contamination',
    units: '%',
    infoText: 'Contamination of the MAG (checkM)',
  },
  length: {
    label: 'Length',
    units: 'base pairs',
    infoText: 'Bin size (sum of length of the contigs)',
  },
  gc_perc: {
    label: 'GC%',
    units: '%',
    infoText: 'GC percentage for the MAG',
  },
  num_contigs: {
    label: '# Contigs',
    units: 'num',
    infoText: 'Number of contigs in the MAG ',
  },
  disparity: {
    label: 'Disparity',
    units: 'num',
    infoText:
      'Disparity of the MAG. An index representing gene heterogeneity/misassembly due to chimerism, lateral transfer, incorrect annotation etc.  ',
  },
  strain_het: {
    label: 'Strain Het',
    units: 'num',
    infoText: 'Strain heterogeneity of the MAG ',
  },
  coverage: {
    label: 'Coverage',
    units: 'num',
    infoText:
      'Coverage of the MAG in the corresponding sample (Sum of bases from reads in the sample mapped to contigs in the MAG / Sum of length of contigs in the MAG) ',
  },
  tpm: {
    label: 'TPM',
    units: 'num',
    infoText:
      'Transcripts Per Million reads for the MAG in the corresponding sample (Sum of reads from the corresponding sample mapping to contigs in the MAG x 10^6 / Sum of length of contigs in the MAG x Total number of reads)',
  },
  completeness_checkM2: {
    label: 'checkM2 Completeness',
    units: '%',
    infoText: 'Completeness of the MAG (checkM2)',
  },
  contamination_checkM2: {
    label: 'checkM2 Contamination',
    units: '%',
    infoText: 'Contamination of the MAG (checkM2)',
  },
  contig_n50_checkM2: {
    label: 'checkM2 Contig_N50',
    units: 'num',
    infoText: 'N50 value',
  },
}

export const searchColumns = [
  {
    accessor: 'mag_id',
    Header: <HeaderInfo accessor="mag_id" />,
    Cell: mag_inspect_link,
    filterable: true,
    sortable: true,
    minWidth: 250,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={250} />
    ),
  },
  {
    accessor: 'sample_id',
    Header: <HeaderInfo accessor="sample_id" />,
    Cell: sample_inspect_link,
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'biosample',
    Header: <HeaderInfo accessor="biosample" />,
    width: 150,
    Filter: ({ filter, onChange }) => (
      <InputSearch filter={filter} onChange={onChange} width={150} />
    ),
  },
  // {
  //   accessor: 'tax_domain',
  //   Header: <HeaderInfo label="Domain" />,
  //   width: 150,
  //   Filter: ({ filter, onChange }) => (
  //     <InputSearch filter={filter} onChange={onChange} width={150} />
  //   ),
  // },
  // {
  //   accessor: 'tax_phylum',
  //   Header: <HeaderInfo label="Phylum" />,
  //   width: 150,
  //   Filter: ({ filter, onChange }) => (
  //     <InputSearch filter={filter} onChange={onChange} width={150} />
  //   ),
  // },
  // {
  //   Header: <HeaderInfo label="Class" />,
  //   accessor: 'tax_class',
  //   width: 150,
  //   Filter: ({ filter, onChange }) => (
  //     <InputSearch filter={filter} onChange={onChange} width={150} />
  //   ),
  // },
  // {
  //   Header: <HeaderInfo label="Order" />,
  //   accessor: 'tax_order',
  //   width: 150,
  //   Filter: ({ filter, onChange }) => (
  //     <InputSearch filter={filter} onChange={onChange} width={150} />
  //   ),
  // },
  // {
  //   Header: <HeaderInfo label="Family" />,
  //   accessor: 'tax_family',
  //   width: 150,
  //   Filter: ({ filter, onChange }) => (
  //     <InputSearch filter={filter} onChange={onChange} width={150} />
  //   ),
  // },
  // {
  //   Header: <HeaderInfo label="Genus" />,
  //   accessor: 'tax_genus',
  //   width: 150,
  //   Filter: ({ filter, onChange }) => (
  //     <InputSearch filter={filter} onChange={onChange} width={150} />
  //   ),
  // },
  // {
  //   accessor: 'tax_species',
  //   Header: <HeaderInfo label="Species" />,
  //   minWidth: 150,
  //   Filter: ({ filter, onChange }) => (
  //     <InputSearch filter={filter} onChange={onChange} width={150} />
  //   ),
  // },
  {
    accessor: 'quality',
    Header: <HeaderInfo accessor="quality" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'completeness',
    Header: <HeaderInfo accessor="completeness" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'contamination',
    Header: <HeaderInfo accessor="contamination" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'length',
    Header: <HeaderInfo accessor="length" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'gc_perc',
    Header: <HeaderInfo accessor="gc_perc" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'num_contigs',
    Header: <HeaderInfo accessor="num_contigs" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'disparity',
    Header: <HeaderInfo accessor="disparity" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'strain_het',
    Header: <HeaderInfo accessor="strain_het" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'coverage',
    Header: <HeaderInfo accessor="coverage" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'tpm',
    Header: <HeaderInfo accessor="tpm" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'completeness_checkM2',
    Header: <HeaderInfo accessor="completeness_checkM2" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    Header: <HeaderInfo accessor="contamination_checkM2" />,
    sortable: true,
    accessor: 'contamination_checkM2',
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'contig_n50_checkM2',
    Header: <HeaderInfo accessor="contig_n50_checkM2" />,
    sortable: true,
    minWidth: 150,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  {
    accessor: 'gtdb_tax',
    Header: <HeaderInfo accessor="gtdb_tax" />,
    sortable: true,
    minWidth: 160,
    Filter: ({ filter, onChange }) => (
      <InputNumberRange filter={filter} onChange={onChange} width={150} />
    ),
  },
  // NOTE: last column needs a bit more minWidth than the width of the Input
]
