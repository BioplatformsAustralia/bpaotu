# This file maps a NCBI BioSample ID to an AM Sample ID
# Collated from CKAN

from pathlib import Path
import os
import pandas as pd
import logging

logger = logging.getLogger(__name__)

LOOKUPS_PATH = os.getenv("LOOKUPS_PATH", "/app/bpaotu/bpaotu/lookups")
CSV_PATH = Path(LOOKUPS_PATH) / "AM_to_ncbi_map.csv"


try:
    df = pd.read_csv(
        CSV_PATH,
        usecols=["sample_id", "BioSample"],
        dtype={"sample_id": "Int64", "BioSample": "string"},  # or {"sample_id": "string"} if string ids appear
    )

    df = df.dropna(subset=["sample_id", "BioSample"])

    # just build mapping from sample_id to BioSample
    ncbi_am_id_dict = dict(zip(df["sample_id"].tolist(), df["BioSample"].tolist()))
except FileNotFoundError as e:
    logger.warning("NCBI BioSample to AM Sample ID mapping CSV not found; continuing with empty map: %s", e)
    ncbi_am_id_dict = {}
