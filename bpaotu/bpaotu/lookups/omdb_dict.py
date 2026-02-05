from pathlib import Path
import os
import pandas as pd
import logging

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
LOOKUPS_PATH = os.getenv("LOOKUPS_PATH", "/app/bpaotu/bpaotu/lookups")
CSV_PATH = Path(LOOKUPS_PATH) / "OMDBv2.0_data_BPAM22-1_list.csv"


try:
    df = pd.read_csv(
        CSV_PATH,
        usecols=["GENOME", "SAMPLE"],
        dtype={"GENOME": "string", "SAMPLE": "string"},
    )

    df = df.dropna(subset=["GENOME", "SAMPLE"])

    omdb_dict = (
        df.groupby("SAMPLE")["GENOME"]
          .apply(lambda s: sorted(set(s)))
          .to_dict()
    )
except FileNotFoundError as e:
    logger.warning("OMDB GENOME/SAMPLE list CSV not found; continuing with empty map: %s", e)
    omdb_dict = {}
