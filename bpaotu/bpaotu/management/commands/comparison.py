from django.core.management.base import BaseCommand
from sqlalchemy import create_engine, and_, or_
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from ...otu import (Base, OTU, SampleOTU, SampleSimilarity, Taxonomy, make_engine)

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Define the list of sample_ids for which you want to retrieve similarity results
        searched_sample_ids = ['7056', '7057', '7058', '7059']

        # Create SQLAlchemy engine and session
        engine = make_engine()
        Session = sessionmaker(bind=engine)
        session = Session()

        # Retrieve similarity results for each pair of sample IDs
        similarity_results = []

        for i in range(len(searched_sample_ids)):
            for j in range(i + 1, len(searched_sample_ids)):
                sample_id_1 = searched_sample_ids[i]
                sample_id_2 = searched_sample_ids[j]

                # Query for similarity result where sample_id_1 is either sample_id_1 or sample_id_2
                result = session.query(SampleSimilarity).filter(
                    or_(
                        and_(
                            SampleSimilarity.sample_id_1 == sample_id_1,
                            SampleSimilarity.sample_id_2 == sample_id_2
                        ),
                        and_(
                            SampleSimilarity.sample_id_1 == sample_id_2,
                            SampleSimilarity.sample_id_2 == sample_id_1
                        )
                    )
                ).first()

                if result:
                    similarity_results.append((sample_id_1, sample_id_2, result.jaccard_similarity))

        # Close the session
        session.close()

        # Print or process similarity results
        for result in similarity_results:
            print(f"Similarity between Sample {result[0]} and Sample {result[1]}: {result[2]}")
