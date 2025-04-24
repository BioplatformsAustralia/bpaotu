import os
import pandas as pd
import numpy as np
# from fastdist import fastdist
# from scipy.spatial import distance
from sklearn.metrics import pairwise_distances
from scipy.spatial.distance import jaccard

from django.core.management.base import BaseCommand
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from memory_profiler import profile

import time # for timing method

from ...otu import (Base, OTU, SampleOTU, SampleSimilarity, Taxonomy, make_engine)

class Command(BaseCommand):
    help = 'Populate sample similarities in PostgreSQL database using SQLAlchemy'
                # .filter(SampleOTU.sample_id == '139100')
                # .join(Taxonomy.otus)

    # @profile
    def handle(self, *args, **options):

        try:
            time_start = time.time()

            engine = make_engine()
            Session = sessionmaker(bind=engine)

            # for testing without doing a full import
            # (causes an error with a view, but it does create the table)
            # Base.metadata.create_all(engine, tables=[SampleSimilarity.__table__], checkfirst=True)

            with engine.begin() as conn:
                conn.execute('TRUNCATE TABLE sample_similarities RESTART IDENTITY')


            # TODO: get list of samples

            # sample_ids_to_test = ['7056', '7057']
            # sample_ids_to_test = ['7056', '7057', '7058', '7059']
            # sample_ids_to_test = ['10601', '10602', '10603', '10604', '10605', '10606', '10607', '10608', '10609']
            sample_ids_to_test = ['10601', '10602', '10603', '10604', '10605', '10606', '10607', '10608', '10609', '10610', '10611', '10612', '10613', '10614', '10615', '10616', '10617', '10618', '10619', '10620', '10621', '10622', '10623', '10624', '10625', '10626', '10627', '10628', '10629', '10630', '37001', '37002', '37003', '37004', '37005', '37006', '37007', '37008', '37009', '37010', '37011', '37012', '37013', '37014', '37015', '37016', '37017', '37018', '37019', '37020', '37021', '37022', '37023', '37024', '37025', '37026', '37027', '37028', '37029', '37030']

            print('start')

            session = Session()
            q = session.query(SampleOTU.sample_id, SampleOTU.otu_id, SampleOTU.count) \
                .filter(OTU.id == SampleOTU.otu_id) \
                .filter(SampleOTU.sample_id.in_(sample_ids_to_test)) \
                .order_by(SampleOTU.sample_id, SampleOTU.otu_id)

            # Execute the query
            results = q.all()

            print('results', len(results))

            # matrix_data = []
            # otu_ids = set()
            # sample_ids = set()

            # for row in q.yield_per(1000):
            #     sample_id, otu_id, count = row
            #     sample_ids.add(sample_id)
            #     otu_ids.add(otu_id)
            #     matrix_data.append([sample_id, otu_id, count])

            # sample_ids = sorted(sample_ids)
            # otu_ids = sorted(otu_ids)

            # # Map sample and OTU IDs to their corresponding indices
            # sample_id_to_index = {sample_id: i for i, sample_id in enumerate(sample_ids)}
            # otu_id_to_index = {otu_id: i for i, otu_id in enumerate(otu_ids)}

            # # Create matrix with indices and abundance values
            # matrix_index = []
            # for entry in matrix_data:
            #     sample_id, otu_id, value = entry
            #     sample_index = sample_id_to_index[sample_id]
            #     otu_index = otu_id_to_index[otu_id]
            #     matrix_index.append([otu_index, sample_index, value])

            # print('matrix_index', matrix_index)

            df = pd.DataFrame(results, columns=['sample_id', 'otu_id', 'abundance'])
            abundance_matrix = df.pivot_table(index='otu_id', columns='sample_id', values='abundance', fill_value=0)

            # print(df)
            # print(abundance_matrix.shape)
            # print("Abundance Matrix:\n", abundance_matrix)

            abundance_matrix_np = abundance_matrix.to_numpy().T

            # max_sample_index = len(sample_ids) - 1
            # jaccard_matrix = [[] for _ in range(max_sample_index + 1)]
            # for elm in matrix_index:
            #     taxon_idx, sample_idx, abundance = elm
            #     jaccard_matrix[sample_idx].append(taxon_idx)

            # %%timeit -n 1
            # Calculate the Bray-Curtis distance matrix using sklearn's pairwise_distances
            # SKL_dist = pairwise_distances(abundance_matrix, metric='jaccard')
            SKL_dist = pairwise_distances(abundance_matrix_np, metric='jaccard')
            # SKL_dist = pairwise_distances(abundance_matrix, metric='braycurtis', n_jobs=5)

            print(SKL_dist)

            self.stdout.write(self.style.SUCCESS('Sample similarities populated successfully'))

        except SQLAlchemyError as e:
            self.stderr.write(self.style.ERROR(f'Error: {str(e)}'))
