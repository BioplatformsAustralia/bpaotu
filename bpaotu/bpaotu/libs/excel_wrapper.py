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
from collections import namedtuple

import xlrd


class ExcelWrapper(object):
    '''
    Parse a excel file and yields namedtuples.
    fieldspec specifies the columns  to be read in, and the name
    of the attribute to map them to on the new type

    field_spec: list of (new_name, column_name, callable) tuples
    file_name: workbook name
    sheet_name: sheet in workbook
    header_length: first number of lines to ignore
    column_name_row_index: row in which column names are found, typically 0
    '''

    def __init__(self,
                 field_spec,
                 file_name,
                 sheet_name,
                 header_length,
                 column_name_row_index=0,
                 ignore_date=False,
                 formatting_info=False,
                 additional_context=None):

        self.ignore_date = ignore_date  # ignore xlrd's attempt at date conversion
        self.file_name = file_name
        self.header_length = header_length
        self.column_name_row_index = column_name_row_index
        self.field_spec = ExcelWrapper._pad_field_spec(field_spec)
        self.additional_context = additional_context

        self.workbook = xlrd.open_workbook(file_name, formatting_info=False)  # not implemented
        if sheet_name is None:
            self.sheet = self.workbook.sheet_by_index(0)
        else:
            self.sheet = self.workbook.sheet_by_name(sheet_name)

        self.field_names = self._set_field_names()
        self.missing_headers = []
        self.header, self.name_to_column_map = self.set_name_to_column_map()
        self.name_to_func_map = self.set_name_to_func_map()

    @classmethod
    def _pad_field_spec(cls, spec):
        # attribute, column_name, func, is_optional
        new_spec = []
        for tpl in spec:
            if len(tpl) == 2:
                new_spec.append(tpl + (None, False))
            elif len(tpl) == 3:
                new_spec.append(tpl + (False,))
            else:
                new_spec.append(tpl)
        return new_spec

    def _set_field_names(self):
        ''' sets field name list '''

        names = []
        for attribute, _, _, _ in self.field_spec:
            names.append(attribute)
        return names

    def set_name_to_column_map(self):
        ''' maps the named field to the actual column in the spreadsheet '''

        def coerce_header(s):
            return str(s)

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
        for attribute, column_name, _, is_optional in self.field_spec:
            col_index = -1
            if type(column_name) == tuple:
                for c, _name in enumerate(column_name):
                    col_index = find_column(_name)
                    if col_index != -1:
                        break
            else:
                col_index = find_column(column_name)

            if col_index != -1:
                cmap[attribute] = col_index
            else:
                self.missing_headers.append(column_name)
                if not is_optional:
                    missing_columns = True
                cmap[attribute] = None

        if missing_columns:
            template = ['[']
            for header in (str(t) for t in header):
                template.append("    ('%s', '%s')," % (header.lower().replace(' ', '_'), header))
            template.append(']')

        return header, cmap

    def set_name_to_func_map(self):
        ''' Map the spec fields to their corresponding functions '''

        function_map = {}
        for attribute, _, func, _ in self.field_spec:
            function_map[attribute] = func
        return function_map

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
            pass
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
                if not self.ignore_date and ctype == xlrd.XL_CELL_DATE:
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
