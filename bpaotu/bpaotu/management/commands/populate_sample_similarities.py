from __future__ import division
import time
import pandas as pd
import numpy as np
from scipy.spatial import distance
import numba as nb

from django.core.management.base import BaseCommand
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

import time # for timing method

from ...otu import (Base, OTU, SampleOTU, SampleSimilarity, Taxonomy, make_engine)

class Command(BaseCommand):
    help = 'Populate sample similarities in PostgreSQL database using SQLAlchemy'
                # .filter(SampleOTU.sample_id == '139100')
                # .join(Taxonomy.otus)

    def handle(self, *args, **options):

        def _make_2D_array(lis):
            n = len(lis)
            lengths = np.array([len(x) for x in lis])
            max_len = max(lengths)
            arr = np.zeros((n, max_len))
            for i in range(n):
                arr[i, :lengths[i]] = lis[i]
            return arr, lengths

        @nb.jit(nopython=True, cache=True)
        def compute_jaccard(session1, session2, arr, lengths):
            """Jited funciton to calculate jaccard distance
            """
            session1, session2 = session1[0], session2[0]
            intersection, union = 0, 0

            if(lengths[session2] > lengths[session1]):
                session1, session2 = session2, session1

            marked = np.zeros((lengths[session2],))

            for x in arr[session1][:lengths[session1]]:
                x_in_2 = arr[session2][:lengths[session2]] == x
                marked[x_in_2] = 1
                if(np.any(x_in_2)):
                    intersection+=1
                    union+=1
                else:
                    union+=1

            union+=np.sum(marked==0)

            jaccard = intersection/union

            return jaccard

        def calculate_sim_between(stack_dataframe):
            # get integer encodings for sample ids and otu ids
            session_encode, sessions = pd.factorize(stack_dataframe["sample_id"])
            page_encode, pages = pd.factorize(stack_dataframe["otu_id"])

            # take unique pages in each session 
            pages_in_sessions = [np.unique(page_encode[session_encode==x]) for x in range(len(sessions))]

            # convert the list of lists to numpy array
            arr, lengths = _make_2D_array(pages_in_sessions)

            # make a dummy array like [[0],, [1],, [2], ...], to get the distances between every pair of sessions
            _sessions = np.arange(len(sessions))[:, np.newaxis]

            # get the distances
            distances = distance.cdist(_sessions, _sessions, compute_jaccard, arr=arr, lengths=lengths)

            sim_df = pd.DataFrame(distances, columns=sessions, index=sessions)
            return sim_df

        def process_data_jaccard(jaccard_matrix):
            n = len(jaccard_matrix)
            matrix = [[0] * n for _ in range(n)]  # Initialize the matrix with zeros

            # Process each pair of records (i, j) where i < j
            from datetime import datetime
            print(f"Processing {n} records {str(datetime.now().time())}")
            for i in range(n):
                if i > 0 and i % 100 == 0:
                    print(f"Processed {i} records {str(datetime.now().time())}")

                # Set distance to self always as 0
                matrix[i][i] = 0

                for j in range(i + 1, n):
                    # Calculate Jaccard index between jaccard_matrix[i] and jaccard_matrix[j]
                    jaccard_similarity = jaccard_index(jaccard_matrix[i], jaccard_matrix[j])
                    braycurtis_similarity = braycurtis_index(jaccard_matrix[i], jaccard_matrix[j])

                    # Assign the calculated index to the corresponding positions in the matrix
                    matrix[i][j] = jaccard_similarity or 0
                    matrix[j][i] = jaccard_similarity or 0

                    sample_id_1 = sample_ids[i]
                    sample_id_2 = sample_ids[j]

                    with engine.begin() as conn:
                        conn.execute('''INSERT INTO sample_similarities (sample_id_1, sample_id_2, jaccard_similarity, braycurtis_similarity)
                                        VALUES (%s, %s, %s, %s)''', (sample_id_1, sample_id_2, jaccard_similarity, braycurtis_similarity))


            return matrix

        def jaccard_index(list1, list2):
            set1 = set(list1)
            set2 = set(list2)
            intersection = len(set1 & set2)
            union = len(set1 | set2)
            if union == 0:
                return 0
            return intersection / union

        def braycurtis_index(list1, list2):
            return 0.0

        try:
            time_start = time.time()

            engine = make_engine()
            Session = sessionmaker(bind=engine)

            # for testing without doing a full import
            # (causes an error with a view, but it does create the table)
            # Base.metadata.create_all(engine, tables=[SampleSimilarity.__table__], checkfirst=True)

            sample_ids_to_test = ['7056', '7057', '7058', '7059']
            sample_ids_to_test = ['10601', '10602', '10603', '10604', '10605', '10606', '10607', '10608', '10609', '10610', '10611', '10612', '10613', '10614', '10615', '10616', '10617', '10618', '10619', '10620', '10621', '10622', '10623', '10624', '10625', '10626', '10627', '10628', '10629', '10630', '37001', '37002', '37003', '37004', '37005', '37006', '37007', '37008', '37009', '37010', '37011', '37012', '37013', '37014', '37015', '37016', '37017', '37018', '37019', '37020', '37021', '37022', '37023', '37024', '37025', '37026', '37027', '37028', '37029', '37030']

            with engine.begin() as conn:
                conn.execute('TRUNCATE TABLE sample_similarities RESTART IDENTITY')

            # Fetch all sample IDs
            session = Session()
            q = session.query(SampleOTU.sample_id, SampleOTU.otu_id, SampleOTU.count) \
                .filter(OTU.id == SampleOTU.otu_id) \
                .filter(SampleOTU.sample_id.in_(sample_ids_to_test)) \
                .order_by(SampleOTU.sample_id, SampleOTU.otu_id)
                # .join(Taxonomy.otus) \
                # .filter(OTU.id == SampleOTU.otu_id)

            time_query = time.time()
            print(f"Elapsed time (query): {time_query - time_start} seconds")

            # otu_index, sample_index, count
            # [[4221, 0, 55], [12519, 0, 7], [5416, 0, 23], [9678, 0, 27],

            matrix_data = []
            otu_ids = set()
            sample_ids = set()

            for row in q.yield_per(1000):
                sample_id, otu_id, count = row
                sample_ids.add(sample_id)
                otu_ids.add(otu_id)
                matrix_data.append([sample_id, otu_id, count])

            sample_ids = sorted(sample_ids)
            otu_ids = sorted(otu_ids)

            # print('matrix_data', matrix_data)

            time_data = time.time()
            print(f"Elapsed time (matrix_data done): {time_data - time_query} seconds")

            # ## JIT way

            columns = ['sample_id', 'otu_id', 'count']
            stack_dataframe = pd.DataFrame(matrix_data, columns=columns)
            x = calculate_sim_between(stack_dataframe)
            print(x)

            time_jit = time.time()
            print(f"Elapsed time (jit): {time_jit - time_data} seconds")

            # # print('sample_ids', sample_ids)
            # # print('otu_ids', otu_ids)

            # Map sample and OTU IDs to their corresponding indices
            sample_id_to_index = {sample_id: i for i, sample_id in enumerate(sample_ids)}
            otu_id_to_index = {otu_id: i for i, otu_id in enumerate(otu_ids)}

            # Create matrix with indices and abundance values
            matrix_index = []
            for entry in matrix_data:
                sample_id, otu_id, value = entry
                sample_index = sample_id_to_index[sample_id]
                otu_index = otu_id_to_index[otu_id]
                matrix_index.append([otu_index, sample_index, value])


            max_sample_index = len(sample_ids) - 1
            jaccard_matrix = [[] for _ in range(max_sample_index + 1)]
            for elm in matrix_index:
                taxon_idx, sample_idx, abundance = elm
                jaccard_matrix[sample_idx].append(taxon_idx)

            # print('jaccard_matrix', jaccard_matrix)

            processed_data = process_data_jaccard(jaccard_matrix)

            # print('processed_data', processed_data)

            df = pd.DataFrame(processed_data, index=sample_ids, columns=sample_ids)
            print(df)

            time_gbif = time.time() - time_jit
            print(f"Elapsed time (matrix): {time_gbif} seconds")

            self.stdout.write(self.style.SUCCESS('Sample similarities populated successfully'))

        except SQLAlchemyError as e:
            self.stderr.write(self.style.ERROR(f'Error: {str(e)}'))

    def get_otu_set_for_sample(self, sample_id, conn):
        # Retrieve OTU set for a given sample ID using database connection
        result = conn.execute('''SELECT otu_index FROM Data WHERE sample_index = %s''', (sample_id,))
        return set(row[0] for row in result.fetchall())
