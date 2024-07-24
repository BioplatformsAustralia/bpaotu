#!/bin/bash

# Run this from the directory where a OTU+contextual download is extracted
# e.g.
# - extract a file like AustralianMicrobiome-2023-12-20T084443-csv.zip to a directory
# - cd to that directory
# - . /path/to/bpaotu/test/verify-otu-contextual-export.sh
#
# Script will output files with unique OTU hashes and Sample IDs and diff files


# Save the original file descriptors
exec 3>&1 4>&2

# Redirect stdout and stderr to a log file
exec > >(tee verify_log.txt)
exec 2>&1


function cmd_cut_csv_otus {
	tail -n +2 $1 | cut -d',' -f2 | sort | uniq
}

function cmd_cut_csv_sample_ids {
	tail -n +2 $1 | cut -d',' -f1 | sort | uniq 
}


function cmd_grep_fasta_otus {
	grep '>' OTU.fasta | cut -d'>' -f2 | sort | uniq
}

function cmd_contextual_sample_ids {
	python3 -c 'import csv; [print(row[0]) for i, row in enumerate(csv.reader(open("contextual.csv", "r", newline=""))) if i > 1]' | sort | uniq
}


domain_csvs=$(find . -type f -name '*.csv' ! -name 'contextual.csv')


verify_otus_fasta_file="verify_otus_fasta.txt"
verify_sample_ids_contextual_file="verify_sample_ids_contextual.txt"

echo "Processing OTU.fasta"
cmd_grep_fasta_otus > $verify_otus_fasta_file
count_otu_fasta_otus=$(cmd_grep_fasta_otus | wc -l)

echo "Processing contextual.csv"
cmd_contextual_sample_ids > $verify_sample_ids_contextual_file
count_contextual_sample_ids=$(cmd_contextual_sample_ids | wc -l)

echo
echo "Unique OTU hashes (OTU.fasta):				$count_otu_fasta_otus"
echo "Unique Sample IDS (contextual.csv):			$count_contextual_sample_ids"
echo

total_domain_csvs=0

for f in $domain_csvs; do 
	f_text=$(echo "$f" | sed 's|^\./||;s|\.csv$||')

	verify_otus_file="verify_otus_csv_$f_text.txt"
	verify_sample_ids_file="verify_sample_ids_otu_count_$f_text.txt"
	diff_otus_file="verify_diff_otus_csv_$f_text.txt"
	diff_sample_ids_file="verify_diff_sample_ids_otu_count_$f_text.txt"

	cmd_cut_csv_otus $f > $verify_otus_file
	
	csv_otus_count=$(cmd_cut_csv_otus $f | wc -l)
	total_domain_csvs=$(($total_domain_csvs + $csv_otus_count))
	echo "$f unique OTU hashes count:		$csv_otus_count"

	cmd_cut_csv_sample_ids $f > $verify_sample_ids_file
	echo "$f unique Sample IDs count:		$(cmd_cut_csv_sample_ids $f | wc -l)"
	
	echo

	echo "otus_csv.txt							otus_fasta.txt" > $diff_otus_file
	diff $verify_otus_file $verify_otus_fasta_file -y --suppress-common-lines >> $diff_otus_file
	
	echo "sample_ids_contextual.txt							sample_ids_otu_count.txt" > $diff_sample_ids_file
	diff $verify_sample_ids_contextual_file $verify_sample_ids_file -y --suppress-common-lines >> $diff_sample_ids_file
done

echo "Total unique OTU hashes for all domain .csv files:	$total_domain_csvs"

# Restore the original file descriptors to disable logging
exec 1>&3 2>&4


