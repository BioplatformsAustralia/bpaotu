import React, { useMemo } from 'react'
import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'

const inspect_link = (props) => (
  <NavLink to={`/mags/${props.value}`} tag={RRNavLink}>
    {props.value}
  </NavLink>
)

export const columns = [
  {
    Header: 'Uniq ID',
    accessor: 'unique_id',
    minWidth: 250,
    filterable: true,
    sortable: true,
    Cell: inspect_link,
  },
  {
    Header: 'Sample ID',
    accessor: 'sample_id',
    width: 150,
  },
  {
    Header: 'Bin ID',
    accessor: 'bin_id',
    width: 150,
  },
  {
    Header: 'Method',
    accessor: 'method',
    minWidth: 150,
  },
  {
    Header: 'Domain',
    accessor: 'tax_domain',
    width: 150,
  },
  {
    Header: 'Phylum',
    accessor: 'tax_phylum',
    width: 150,
  },
  {
    Header: 'Class',
    accessor: 'tax_class',
    width: 150,
  },
  {
    Header: 'Order',
    accessor: 'tax_order',
    width: 150,
  },
  {
    Header: 'Family',
    accessor: 'tax_family',
    width: 150,
  },
  {
    Header: 'Genus',
    accessor: 'tax_genus',
    width: 150,
  },
  {
    Header: 'Species',
    accessor: 'tax_species',
    minWidth: 150,
  },
  {
    Header: 'Length',
    accessor: 'length',
    sortable: true,
    minWidth: 150,
  },
  {
    Header: 'GC%',
    sortable: true,
    accessor: 'gc_perc',
  },
  {
    Header: '# Contigs',
    sortable: true,
    accessor: 'num_contigs',
  },
  {
    Header: 'Disparity',
    sortable: true,
    accessor: 'disparity',
  },
  {
    Header: 'Completeness',
    accessor: 'completeness',
    sortable: true,
    minWidth: 150,
  },
  {
    Header: 'Contamination',
    sortable: true,
    accessor: 'contamination',
    minWidth: 150,
  },
  {
    Header: 'Strain Het',
    sortable: true,
    accessor: 'strain_het',
  },
  {
    Header: 'Coverage',
    sortable: true,
    accessor: 'coverage',
  },
  {
    Header: 'TPM',
    sortable: true,
    accessor: 'tpm',
  },
  {
    Header: 'Quality',
    sortable: true,
    accessor: 'quality',
  },
]

// export const columns = [
//   {
//     Header: 'Genome',
//     accessor: 'genome',
//     width: 350,
//     Cell: inspect_link,
//   },
//   {
//     Header: 'Domain',
//     accessor: 'domain',
//     width: 150,
//   },
//   {
//     Header: 'Phylum',
//     accessor: 'phylum',
//     width: 150,
//   },
//   {
//     Header: 'Class',
//     accessor: 'class',
//     width: 150,
//   },
//   {
//     Header: 'Order',
//     accessor: 'order',
//     width: 150,
//   },
//   {
//     Header: 'Family',
//     accessor: 'family',
//     width: 150,
//   },
//   {
//     Header: 'Genus',
//     accessor: 'genus',
//     width: 150,
//   },
//   {
//     Header: 'Species',
//     accessor: 'species',
//     minWidth: 150,
//   },
//   {
//     Header: 'mOTU4',
//     accessor: 'motu4',
//   },
//   {
//     Header: 'Sample',
//     accessor: 'sample',
//   },
//   {
//     Header: 'Study ',
//     accessor: 'study ',
//   },
//   {
//     Header: 'Q-Score',
//     accessor: 'q-score',
//   },
//   {
//     Header: 'Completeness',
//     accessor: 'completeness',
//     width: 150,
//   },
//   {
//     Header: 'Contamination',
//     accessor: 'contamination',
//     width: 150,
//   },
//   {
//     Header: 'N50',
//     accessor: 'n50',
//     width: 100,
//   },
//   {
//     Header: '#Scaffolds',
//     accessor: '#scaffolds',
//     width: 100,
//   },
//   {
//     Header: 'MAG',
//     accessor: 'mag',
//     width: 100,
//   },
//   {
//     Header: 'IsRep',
//     accessor: 'isrep',
//     width: 100,
//   },
//   {
//     Header: 'Representative',
//     accessor: 'representative',
//     width: 350,
//   },
// ]
