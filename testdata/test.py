# numba
# scipy
import time
import pandas as pd
from fastdist import fastdist

print("init")
results_file = open("abundance_envlocal.csv")
column_names = ['sample_id', 'otu_id', 'abundance']
column_dtypes = { "sample_id": str, "otu_id": int, "abundance": int }
df = pd.read_csv(results_file, header=None, names=column_names, dtype=column_dtypes)
df = df.sort_values(by=['sample_id', 'otu_id'], ascending=[True, True])

print(f"pivot start")
rect_df = df.pivot(index="sample_id", columns="otu_id", values="abundance").fillna(0)

print(f"fastdist start")
start = time.time()
dist_matrix = fastdist.matrix_pairwise_distance(rect_df.values, fastdist.braycurtis, "braycurtis", return_matrix=True)
elapsed = time.time() - start

print(f"fastdist braycurtis matrix took {elapsed:.2f} seconds")

