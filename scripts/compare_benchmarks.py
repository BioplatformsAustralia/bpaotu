#!/usr/bin/env python3
"""
Summarise and compare otu_ingest benchmark results.

Benchmark runs live in benchmarks/results/<timestamp>-<sha>-<label>-run-<n>/,
each containing a timings.txt with lines like:

    ... Completed phase: <phase name> in <seconds> seconds

This script groups runs by label, computes the median time per phase across
the runs in a label, and (optionally) compares two labels.

Usage:
    # List all labels found and their run counts
    scripts/compare_benchmarks.py --list

    # Show per-phase medians for one label
    scripts/compare_benchmarks.py baseline

    # Compare a label against a baseline (shows % change)
    scripts/compare_benchmarks.py workmem --vs baseline

The first positional arg is the "new" label; --vs names the baseline label.
"""
import argparse
import re
import statistics
import sys
from collections import defaultdict
from pathlib import Path

RESULTS_DIR = Path(__file__).resolve().parent.parent / "benchmarks" / "results"

DIR_RE = re.compile(r"^(?P<ts>[^-]+)-(?P<sha>[^-]+)-(?P<label>.+)-run-(?P<n>\d+)$")
PHASE_RE = re.compile(r"Completed phase:\s*(?P<name>.+?)\s+in\s+(?P<secs>[\d.]+)\s+seconds")


def collect():
    """Return {label: {phase: [seconds, ...]}} and {label: set(shas)}."""
    by_label = defaultdict(lambda: defaultdict(list))
    shas = defaultdict(set)
    if not RESULTS_DIR.is_dir():
        return by_label, shas
    for d in sorted(RESULTS_DIR.iterdir()):
        if not d.is_dir():
            continue
        m = DIR_RE.match(d.name)
        if not m:
            continue
        label = m.group("label")
        shas[label].add(m.group("sha"))
        timings = d / "timings.txt"
        if not timings.is_file():
            continue
        for line in timings.read_text().splitlines():
            pm = PHASE_RE.search(line)
            if pm:
                by_label[label][pm.group("name")].append(float(pm.group("secs")))
    return by_label, shas


def medians(phase_times):
    return {phase: statistics.median(times) for phase, times in phase_times.items()}


def run_count(phase_times):
    return max((len(t) for t in phase_times.values()), default=0)


def cmd_list(by_label, shas):
    if not by_label:
        print("No benchmark results found in", RESULTS_DIR)
        return
    print(f"{'label':24} {'runs':>5}  shas")
    print("-" * 50)
    for label in sorted(by_label):
        print(f"{label:24} {run_count(by_label[label]):>5}  {','.join(sorted(shas[label]))}")


def cmd_single(label, by_label, shas):
    if label not in by_label:
        sys.exit(f"No results for label '{label}'. Try --list.")
    med = medians(by_label[label])
    n = run_count(by_label[label])
    print(f"Label: {label}  (runs={n}, sha={','.join(sorted(shas[label]))})\n")
    print(f"{'phase':28} {'median':>10}")
    print("-" * 40)
    total = 0.0
    for phase, secs in med.items():
        print(f"{phase:28} {secs:>9.1f}s")
        total += secs
    print("-" * 40)
    print(f"{'TOTAL (sum of medians)':28} {total:>9.1f}s")


def cmd_compare(new, base, by_label, shas):
    for label in (new, base):
        if label not in by_label:
            sys.exit(f"No results for label '{label}'. Try --list.")
    new_med = medians(by_label[new])
    base_med = medians(by_label[base])
    phases = list(base_med) + [p for p in new_med if p not in base_med]

    print(f"Comparing '{new}' (sha={','.join(sorted(shas[new]))}, runs={run_count(by_label[new])})")
    print(f"   vs '{base}' (sha={','.join(sorted(shas[base]))}, runs={run_count(by_label[base])})\n")
    print(f"{'phase':28} {'base':>10} {'new':>10} {'change':>10}")
    print("-" * 62)
    base_total = new_total = 0.0
    for phase in phases:
        b = base_med.get(phase)
        nw = new_med.get(phase)
        if b is not None:
            base_total += b
        if nw is not None:
            new_total += nw
        b_str = f"{b:.1f}s" if b is not None else "-"
        n_str = f"{nw:.1f}s" if nw is not None else "-"
        if b and nw is not None:
            pct = (nw - b) / b * 100
            chg = f"{pct:+.1f}%"
        else:
            chg = "-"
        print(f"{phase:28} {b_str:>10} {n_str:>10} {chg:>10}")
    print("-" * 62)
    tot_pct = (new_total - base_total) / base_total * 100 if base_total else 0.0
    print(f"{'TOTAL (sum of medians)':28} {base_total:>9.1f}s {new_total:>9.1f}s {tot_pct:>+9.1f}%")
    print("\nNote: only trust phases you actually changed; others are run-to-run noise.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("label", nargs="?", help="label to summarise (the 'new' label when comparing)")
    ap.add_argument("--vs", metavar="BASELINE", help="baseline label to compare against")
    ap.add_argument("--list", action="store_true", help="list all labels and run counts")
    args = ap.parse_args()

    by_label, shas = collect()

    if args.list or (not args.label and not args.vs):
        cmd_list(by_label, shas)
    elif args.vs:
        cmd_compare(args.label, args.vs, by_label, shas)
    else:
        cmd_single(args.label, by_label, shas)


if __name__ == "__main__":
    main()
