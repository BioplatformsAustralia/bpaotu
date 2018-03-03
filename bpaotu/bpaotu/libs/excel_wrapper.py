# _*_ coding: utf-8 _*_
'''
Tool to manage the import of rows from Excel workbooks.

Pass a filename, a sheet_name, a mapping (fieldspec)
Fieldspec maps spread sheet column names to more manageable names. It provides
functions associated with each column type that must be used to massage the data found in the column.

It returns a iterator providing named tuples, each tuple contains key/value pairs, the keys
being the fist column of the fieldspec, the value are found in the column specisied in the second fieldspec field
as mangled by the provided method.
'''

import datetime
from collections import namedtuple, Counter

import os
import xlrd

from ..util import strip_to_ascii


FieldDefinition = namedtuple('FieldSpec', ['attribute', 'column_name', 'coerce', 'optional'])
field_definition_default = FieldDefinition('<replace>', '<replace>', None, False)


def make_field_definition(attribute, column_name, **kwargs):
    return field_definition_default._replace(attribute=attribute, column_name=column_name, **kwargs)


class ExcelWrapper(object):
    '''
    Parse a excel file and yields namedtuples.
    fieldspec specifies the columns  to be read in, and the name
    of the attribute to map them to on the new type

    field_spec: list of FieldSpec named tuples
    file_name: workbook name
    sheet_name: sheet in workbook
    header_length: first number of lines to ignore
    column_name_row_index: row in which column names are found, typically 0
    '''

    def __init__(self,
                 field_spec,
                 file_name,
                 sheet_name=None,
                 header_length=0,
                 column_name_row_index=0,
                 suggest_template=False,
                 additional_context=None):

        self._log = []
        self.file_name = file_name
        self.header_length = header_length
        self.column_name_row_index = column_name_row_index
        self.field_spec = field_spec
        assert(type(self.field_spec[0]) is FieldDefinition)
        self.additional_context = additional_context
        self.suggest_template = suggest_template

        self.workbook = xlrd.open_workbook(file_name)
        if sheet_name is None:
            self.sheet = self.workbook.sheet_by_index(0)
        else:
            self.sheet = self.workbook.sheet_by_name(sheet_name)

        self.field_names = self._set_field_names()
        self.missing_headers = []
        self.header, self.name_to_column_map = self.set_name_to_column_map()
        self.name_to_func_map = self.set_name_to_func_map()

    def _error(self, s):
        self._log.append(s)

    def get_errors(self):
        return self._log.copy()

    def _set_field_names(self):
        names = [spec.attribute for spec in self.field_spec]
        if len(set(names)) != len(self.field_spec):
            # this is a problem in the bpa-ingest code, not in the passed-in spreadsheet,
            # so we can fail hard here
            raise Exception("duplicate `attribute` in field definition: %s" % [t for (t, c) in Counter(names).items() if c > 1])
        return names

    def set_name_to_column_map(self):
        ''' maps the named field to the actual column in the spreadsheet '''

        def coerce_header(s):
            if type(s) is not str:
                self._error("header is not a string: %s `%s'" % (type(s), repr(s)))
                return str(s)
            return strip_to_ascii(s)

        header = [coerce_header(t).strip().lower() for t in self.sheet.row_values(self.column_name_row_index)]

        def find_column(column_name):
            # if has the 'match' attribute, it's a regexp
            if hasattr(column_name, 'match'):
                return find_column_re(column_name)
            col_index = -1
            try:
                col_index = header.index(column_name.strip().lower())
            except ValueError:
                pass
            return col_index

        def find_column_re(column_name_re):
            for idx, name in enumerate(header):
                if column_name_re.match(name):
                    return idx
            return -1

        cmap = {}
        missing_columns = False
        for spec in self.field_spec:
            col_index = -1
            col_descr = spec.column_name
            if hasattr(spec.column_name, 'match'):
                col_descr = spec.column_name.pattern
            if type(spec.column_name) == tuple:
                for c, _name in enumerate(spec.column_name):
                    col_index = find_column(_name)
                    if col_index != -1:
                        break
            else:
                col_index = find_column(spec.column_name)

            if col_index != -1:
                cmap[spec.attribute] = col_index
            else:
                self.missing_headers.append(spec.column_name)
                if not spec.optional:
                    self._error("Column `{}' not found in `{}' `{}'".format(col_descr, os.path.basename(self.file_name), self.sheet.name))
                    missing_columns = True
                cmap[spec.attribute] = None

        if missing_columns and self.suggest_template:
            template = ['[']
            for header in (str(t) for t in header):
                template.append("    fld('%s', '%s')," % (header.lower().replace(' ', '_'), header))
            template.append(']')
            self._error('Missing columns -- template for columns in spreadsheet is:\n%s' % ('\n'.join(template)))

        return header, cmap

    def set_name_to_func_map(self):
        ''' Map the spec fields to their corresponding functions '''

        return dict((t.attribute, t.coerce) for t in self.field_spec)

    def get_date_mode(self):
        assert (self.workbook is not None)
        return self.workbook.datemode

    def date_to_string(self, s):
        try:
            date_val = float(s)
            tpl = xlrd.xldate_as_tuple(date_val, self.workbook.datemode)
            return datetime.datetime(*tpl).strftime('%d/%m/%Y')
        except ValueError:
            return s

    def _get_rows(self):
        ''' Yields sequence of cells '''

        merge_redirect = {}
        for crange in self.sheet.merged_cells:
            rlo, rhi, clo, chi = crange
            source_coords = (rlo, clo)
            for rowx in range(rlo, rhi):
                for colx in range(clo, chi):
                    if rowx == rlo and colx == clo:
                        continue
                    merge_redirect[(rowx, colx)] = source_coords

        for row_idx in range(self.header_length, self.sheet.nrows):
            row = self.sheet.row(row_idx)
            merged_row = []
            for colx, val in enumerate(row):
                coord = (row_idx, colx)
                if coord in merge_redirect:
                    merge_row, merge_col = merge_redirect[coord]
                    merged_row.append(self.sheet.row(merge_row)[merge_col])
                else:
                    merged_row.append(val)
            yield merged_row

    def get_date_time(self, i, cell):
        ''' the cell contains a float and pious hope, get a date, if you dare. '''

        val = cell.value
        try:
            date_time_tup = xlrd.xldate_as_tuple(val, self.get_date_mode())
            # well ok...
            if date_time_tup[0] == 0 and date_time_tup[1] == 0 and date_time_tup[2] == 0:
                val = datetime.time(*date_time_tup[3:])
            else:
                val = datetime.datetime(*date_time_tup)
        except ValueError:
            self._error('column: `%s\' -- value `%s\' cannot be converted to a date' % (i, val))
        return val

    def get_all(self, typname='DataRow'):
        '''Returns all rows for the sheet as namedtuple instances. Filters out any exact duplicates.'''

        # row is added so we know where in the spreadsheet this came from
        typ_attrs = [n for n in self.field_names]
        if self.additional_context is not None:
            typ_attrs += list(self.additional_context.keys())
        typ = namedtuple(typname, typ_attrs)

        for row in self._get_rows():
            tpl = []
            for name in self.field_names:
                i = self.name_to_column_map[name]
                # i is None if the column specified was not found, in that case,
                # set the val to None as well
                if i is None:
                    tpl.append(None)
                    continue
                func = self.name_to_func_map[name]
                cell = row[i]
                ctype = cell.ctype
                val = cell.value
                # convert dates to python dates
                if ctype == xlrd.XL_CELL_DATE:
                    val = self.get_date_time(i, cell)
                if ctype == xlrd.XL_CELL_TEXT:
                    val = val.strip()
                # apply func
                if func is not None:
                    val = func(val)
                tpl.append(val)
            if self.additional_context:
                tpl += list(self.additional_context.values())
            yield typ(*tpl)
