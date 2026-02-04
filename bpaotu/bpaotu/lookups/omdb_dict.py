from pathlib import Path
import pandas as pd

HERE = Path(__file__).resolve().parent
csv_path = HERE / "OMDBv2.0_data_BPAM22-1_list.csv"

df = pd.read_csv(
    csv_path,
    usecols=["GENOME", "SAMPLE"],
    dtype={"GENOME": "string", "SAMPLE": "string"},
)

df = df.dropna(subset=["GENOME", "SAMPLE"])

omdb_dict = (
    df.groupby("SAMPLE")["GENOME"]
      .apply(lambda s: sorted(set(s)))
      .to_dict()
)

