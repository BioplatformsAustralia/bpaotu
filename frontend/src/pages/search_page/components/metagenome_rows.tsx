import * as React from 'react'
import  { Fragment } from 'react'

export const metagenome_rows = [
    [
        'Filtered sequencing reads',
        'Quality filtered R1 paired reads',
        'BBtools QC protocol',
        'combined_R1p.fastq.gz'
    ],
    [
        'Filtered sequencing reads',
        'Quality filtered R2 paired reads',
        'BBtools QC protocol',
        'combined_R2p.fastq.gz'
    ],
    [
        'Filtered sequencing reads',
        'Quality filtered merged reads',
        'BBtools QC protocol',
        'combined_merged.fastq.gz'
    ],
    [
        'Filtered sequencing reads',
        'Quality filtered unpaired reads',
        'BBtools QC protocol',
        'combined_R1R2u.fastq.gz'
    ],
    [
        'checksum',
        'md5 sum of above files',
        '',
        'SQM.md5' // FIXME check
    ],

    'Worflow activity: Assembly activity',

    [
        'Assembly',
        'Fasta file containing the contigs from the assembly',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em></Fragment>,
        'SQM_01.fasta',
    ],
    [
        'Assembly statistics',
        'Length of the contigs',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em></Fragment>,
        'SQM_01.lon',
    ],
    [
        'Assembly statistics',
        'Assembly statistics (N50, N90, number of reads, etc)',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em></Fragment>,
        'SQM_01.stats',
    ],
    [
        'Assembly',
        'Fasta file containing binned metagenomic reads',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'maxbin.002.fasta.contigs.fa',
    ],
    [
        'Annotation',
        'Compilation of all data for bins',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_19.bintable',
    ],

    'Worflow activity: Annotation activity',

    [
        'Annotation',
        'Taxonomic and functional assignments for each read',
        <Fragment>Squeezemeta reads - input: <em>R1p</em>,<em>merged</em>,<em>R1R2u</em></Fragment>,
        'sqm_reads.out.allreads',
    ],
    [
        'Annotation',
        'Abundance of all COG functions',
        <Fragment>Squeezemeta reads - input: <em>R1p</em>,<em>merged</em>,<em>R1R2u</em></Fragment>,
        'sqm_reads.out.allreads.funcog',
    ],
    [
        'Annotation',
        'Abundance of all KEGG functions',
        <Fragment>Squeezemeta reads - input: <em>R1p</em>,<em>merged</em>,<em>R1R2u</em></Fragment>,
        'sqm_reads.out.allreads.funkegg',
    ],
    [
        'Annotation',
        'Abundance of all taxa',
        <Fragment>Squeezemeta reads - input: <em>R1p</em>,<em>merged</em>,<em>R1R2u</em></Fragment>,
        'sqm_reads.out.allreads.mcount',
    ],
    [
        'Annotation',
        'Summary of total reads and hits to nr',
        <Fragment>Squeezemeta reads - input: <em>R1p</em>,<em>merged</em>,<em>R1R2u</em></Fragment>,
        'sqm_reads.out.mappingstat',
    ],
    [
        'checksum for SQM reads',
        'md5sum of SQM_reads files',
        '',
        'SQMreads.md5',
    ],
    [
        'Annotation',
        'Assignment (RDP classifier) for the 16S rRNAs sequences found',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_02.16S.txt',
    ],
    [
        'Annotation',
        'Fasta file containing all RNAs found',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_02.rnas',
    ],
    [
        'Annotation',
        'Text file containing contig and position of tRNAs found',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_02.trnas',
    ],
    [
        'Annotation',
        'Fasta file containing the contigs resulting from the assembly, masking the positions where a tRNA was found',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_02.trnas.fasta',
    ],
    [
        'Annotation',
        'Fasta file containing the contigs resulting from the assembly, masking the positions where a RNA was found',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_02.maskedrna.fasta',
    ],
    [
        'Annotation',
        'Amino acid sequences for predicted ORFs',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_03.faa',
    ],
    [
        'Annotation',
        'Nucleotide sequences for predicted ORFs',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_03.fna',
    ],
    [
        'Annotation',
        'Features and position in contigs for each of the predicted genes',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_03.gff',
    ],
    [
        'Annotation',
        'taxonomic assignments not considering identity filters for each ORF, including taxonomic ranks',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_06.fun3.tax.noidfilter.wranks',
    ],
    [
        'Annotation',
        'taxonomic assignments for each ORF, including taxonomic ranks',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_06.fun3.tax.wranks',
    ],
    [
        'Annotation',
        'COG functional assignment for each ORF',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_07.fun3.cog',
    ],
    [
        'Annotation',
        'KEGG functional assignment for each ORF',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_07.fun3.kegg',
    ],
    [
        'Annotation',
        'PFAM functional assignment for each ORF',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_07.fun3.pfam',
    ],
    [
        'Annotation statistics',
        'Mapping percentage of reads to samples',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_10.mappingstat',
    ],
    [
        'Annotation statistics -10.sampleID.mapcount',
        'Several measures regarding mapping of reads to ORFs',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_10.mapcount',
    ],
    [
        'Annotation statistics 10.sampleID.contigcov',
        'Several measures regarding mapping of reads to ORFs',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_10.contigcov',
    ],
    [
        'Annotation',
        'Abundance table of taxa',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_11.mcount',
    ],
    [
        'Annotation',
        'measurements of the abundance and distribution of each COG',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_12.cog.funcover',
    ],
    [
        'Annotation',
        'measurements of the abundance and distribution of each KEGG',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_12.kegg.funcover',
    ],
    [
        'Annotation',
        'Several measures regarding ORF characteristics',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_13.orftable',
    ],
    [
        'Annotation',
        'Compilation of data for contigs',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_20.contigtable',
    ],
    [
        'Annotation',
        'prediction of KEGG pathways in bins',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_21.kegg.pathways',
    ],
    [
        'Annotation',
        'prediction of Metacyc pathways in bins',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_21.metacyc.pathways',
    ],
    [
        'Annotation statistics',
        'Several statistics regarding ORFs, contigs and bins',
        <Fragment>Squeezemets full workflow - input <em>R1</em>, <em>R2</em> Barrnap</Fragment>,
        'SQM_22.stats',
    ],
    [
        'checksum for SQM full workflow',
        'md5sum of SQM full workflow',
        '',
        'SQM-workflow.md5'
    ]
]
