# BPA-OTU Ingest Benchmarking

Measure `otu_ingest` performance and compare changes.

## Prerequisites

- Containers running (`docker compose up -d`), small sample dataset in the container.
- Run all commands from the repo root.
- No DB restore needed: the importer drops/recreates the `otu` schema each run, so every run starts from the same empty state. These are warm benchmarks - good for comparing one change vs another, not for absolute production claims.

## Workflow

```bash
# 1. Baseline (3 runs)
scripts/run_benchmark.sh baseline

# 2. Make ONE code change (source is bind-mounted, no rebuild needed)

# 3. Benchmark it
scripts/run_benchmark.sh workmem

# 4. Compare
scripts/compare_benchmarks.py workmem --vs baseline

# 5. Keep (commit the one file) or revert (git checkout <file>)
```

## Reading results

- Only trust the phase you actually changed; other phases move a few % from cache/load noise.
- Treat <5% as possible noise. Use medians, run at least 3 times.
- For borderline SQL results, confirm with `EXPLAIN (ANALYZE, BUFFERS)`.

## Scripts

| Script | Purpose |
| --- | --- |
| `scripts/run_benchmark.sh <label> [runs] [dataset] [date]` | Run ingest N times (default 3); writes `ingest.log`, `timings.txt`, `metadata.txt` per run. |
| `scripts/compare_benchmarks.py [--list] <label> [--vs <baseline>]` | Summarise/compare labels by per-phase median. |

## Result layout

```
benchmarks/results/<timestamp>-<sha>-<label>-run-<n>/
  metadata.txt   # git sha/branch/dirty, dataset, run number
  ingest.log     # full output
  timings.txt    # "Completed phase: ..." lines
```

`results/` is gitignored - run artifacts stay local.
