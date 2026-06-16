#!/usr/bin/env bash
#
# Run the small-sample otu_ingest N times and capture per-phase timings.
#
# Usage:
#   scripts/run_benchmark.sh <label> [runs] [dataset] [ingest_date]
#
# Examples:
#   scripts/run_benchmark.sh baseline        # 3 runs, label "baseline"
#   scripts/run_benchmark.sh workmem 5       # 5 runs
#
# Results go to benchmarks/results/<timestamp>-<sha>-<label>-run-<n>/
# Each contains:
#   metadata.txt - git sha/branch/dirty, dataset, run number
#   ingest.log   - full ingest output
#   timings.txt  - extracted "Completed phase: ..." lines
#
# Email notifications are sent (uses INGEST_NOTIFY_EMAIL from the container env).
#
# After running, compare labels with:
#   scripts/compare_benchmarks.py <label> --vs <baseline-label>
#
set -euo pipefail

LABEL="${1:-manual}"
RUNS="${2:-3}"
DATASET="${3:-AM_data_db_submit_202601151230_small}"
INGEST_DATE="${4:-2026-05-20}"

SHORT_SHA="$(git rev-parse --short HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ -n "$(git status --porcelain)" ]]; then DIRTY="yes"; else DIRTY="no"; fi

if [[ "${DIRTY}" == "yes" ]]; then
  echo "WARNING: working tree is dirty - results won't map cleanly to a commit." >&2
fi

for i in $(seq 1 "${RUNS}"); do
  TS="$(date -u +%Y%m%dT%H%M%SZ)"
  OUT="benchmarks/results/${TS}-${SHORT_SHA}-${LABEL}-run-${i}"
  mkdir -p "${OUT}"

  {
    echo "timestamp=${TS}"
    echo "git_sha=$(git rev-parse HEAD)"
    echo "git_short_sha=${SHORT_SHA}"
    echo "git_branch=${BRANCH}"
    echo "git_dirty=${DIRTY}"
    echo "label=${LABEL}"
    echo "run=${i}/${RUNS}"
    echo "dataset=${DATASET}"
    echo "ingest_date=${INGEST_DATE}"
  } > "${OUT}/metadata.txt"

  echo "================================================================"
  echo "Run ${i}/${RUNS}  ->  ${OUT}"
  echo "  sha=${SHORT_SHA}  branch=${BRANCH}  dirty=${DIRTY}  dataset=${DATASET}"
  echo "================================================================"

  docker compose exec -T runserver bash -c "
    /app/docker-entrypoint.sh django-admin otu_ingest \
      ${DATASET} ${INGEST_DATE} \
      --use-sql-context --no-force-fetch
  " 2>&1 | tee "${OUT}/ingest.log"

  grep -E "Completed phase:" "${OUT}/ingest.log" > "${OUT}/timings.txt" || true

  echo
  echo "--- Timings for run ${i} ---"
  cat "${OUT}/timings.txt"
  echo
done

echo "================================================================"
echo "All ${RUNS} runs complete for label '${LABEL}'."
echo "================================================================"
python3 scripts/compare_benchmarks.py "${LABEL}" 2>/dev/null || \
  grep -rH "Completed phase:" benchmarks/results/*-"${SHORT_SHA}-${LABEL}"-run-*/timings.txt
