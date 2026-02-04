# This file maps a NCBI BioSample ID to an AM Sample ID
# Collated from CKAN

from pathlib import Path
import pandas as pd

HERE = Path(__file__).resolve().parent
csv_path = HERE / "AM_to_ncbi_map.csv"

df = pd.read_csv(
    csv_path,
    usecols=["sample_id", "BioSample"],
    dtype={"sample_id": "Int64", "BioSample": "string"},  # or {"sample_id": "string"} if string ids appear
)

df = df.dropna(subset=["sample_id", "BioSample"])

# just build mapping from sample_id to BioSample
ncbi_am_id_dict = dict(zip(df["sample_id"].tolist(), df["BioSample"].tolist()))
