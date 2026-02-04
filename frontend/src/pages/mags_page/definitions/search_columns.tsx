import React, { useMemo } from 'react'
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

export const searchColumns = [
  {
    Header: 'MAG ID',
    accessor: 'unique_id',
    minWidth: 250,
    filterable: true,
    sortable: true,
    Cell: mag_inspect_link,
  },
  {
    Header: 'Sample ID',
    accessor: 'sample_id',
    width: 150,
    Cell: sample_inspect_link,
  },
  {
    Header: 'Bin ID',
    accessor: 'bin_id',
    width: 150,
  },
  {
    Header: 'NCBI',
    accessor: 'biosample',
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
