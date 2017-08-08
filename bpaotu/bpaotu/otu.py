from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey
from django.conf import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from glob import glob
from csv import DictReader


Base = declarative_base()


class AbstractMixin():
    id = Column(Integer, primary_key=True)
    value = Column(String, unique=True)

    def __repr__(self):
        return "<%s(%s)>" % (type(self).__name__, self.value)


class OTUKingdom(AbstractMixin, Base):
    __tablename__ = 'otu_kingdom'


class OTUPhylum(AbstractMixin, Base):
    __tablename__ = 'otu_phylum'


class OTUClass(AbstractMixin, Base):
    __tablename__ = 'otu_class'


class OTUOrder(AbstractMixin, Base):
    __tablename__ = 'otu_order'


class OTUFamily(AbstractMixin, Base):
    __tablename__ = 'otu_family'


class OTUGenus(AbstractMixin, Base):
    __tablename__ = 'otu_genus'


class OTUSpecies(AbstractMixin, Base):
    __tablename__ = 'otu_species'


class OTU(Base):
    __tablename__ = 'otu'
    id = Column(Integer, primary_key=True)
    code = Column(String(length=21))  # current max length of OTU code
    kingdom_id = Column(Integer, ForeignKey('otu_kingdom.id'))
    phylum_id = Column(Integer, ForeignKey('otu_kingdom.id'))
    class_id = Column(Integer, ForeignKey('otu_kingdom.id'))
    order_id = Column(Integer, ForeignKey('otu_kingdom.id'))
    family_id = Column(Integer, ForeignKey('otu_kingdom.id'))
    genus_id = Column(Integer, ForeignKey('otu_kingdom.id'))
    species_id = Column(Integer, ForeignKey('otu_kingdom.id'))


def make_engine():
    conf = settings.DATABASES['default']
    engine_string = 'postgres://%(USER)s:%(PASSWORD)s@%(HOST)s:%(PORT)s/%(NAME)s' % (conf)
    return create_engine(engine_string)


class DataImporter:
    def __init__(self, import_base):
        self._engine = make_engine()
        Session = sessionmaker(bind=self._engine)
        self._session = Session()
        self._import_base = import_base
        Base.metadata.create_all(self._engine)

    def _read_taxonomy_file(self, fname):
        with open(fname) as fd:
            reader = DictReader(fd, dialect="excel-tab")
            return list(reader)

    def _build_ontology(self, db_class, vals):
        for val in vals:
            instance = db_class(value=val)
            self._session.add(instance)
        self._session.commit()
        return dict((t.value, t.id) for t in self._session.query(db_class).all())

    def load_taxonomies(self):
        # load each taxnomy file. note that not all files
        # have all of the columns
        rows = []
        for fname in glob(self._import_base + '/*.taxonomy'):
            rows += self._read_taxonomy_file(fname)
        ontologies = {
            'kingdom': OTUKingdom,
            'phylum': OTUPhylum,
            'class': OTUClass,
            'order': OTUOrder,
            'family': OTUFamily,
            'genus': OTUGenus,
            'species': OTUSpecies
        }
        # import the ontologies, and build a mapping from
        # permitted values into IDs in those ontologies
        mappings = {}
        for field, db_class in ontologies.items():
            self._session.query(db_class).delete()
            vals = set()
            for row in rows:
                if field in row:
                    vals.add(row[field])
            mappings[field] = self._build_ontology(db_class, vals)

        def _make_otus():
            for row in rows:
                attrs = {}
                for field in ontologies:
                    if field not in row:
                        continue
                    attrs[field + '_id'] = mappings[field][row[field]]
                yield OTU(code=row['OTUId'], **attrs)

        # import the OTU rows, applying onotology mappings
        self._session.query(OTU).delete()
        self._session.bulk_save_objects(_make_otus())
        self._session.commit()