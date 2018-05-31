import * as _ from 'lodash';
import { ErrorBox } from './errors';


export function setupDatatables(spinner: any, errorBox: ErrorBox, url: string, searchQueryBuilder: any, extraColumns: DataTables.ColumnSettings[] = []) {

    const defaultColumnsSettings: DataTables.ColumnSettings[] = [{
            data: 'bpa_id',
            title: 'BPA Sample ID',
            defaultContent: '',
            render: function(data: any, type: any, row: any) {
                let environment = row.environment;
                let org = 'australian-microbiome';
                let url = window.otu_search_config['ckan_base_url'] + '/organization/' + org + '?q=bpa_id:102.100.100.' + data;
                return '<a href="' + url + '" target="_blank">' + data + '</a>';
            }
        }, {
            data: 'environment',
            title: 'BPA Project',
            defaultContent: ''
        }
    ]

    let columnsSettings = [...defaultColumnsSettings, ...extraColumns];

    const settings: DataTables.Settings = {
        processing: true,
        serverSide: true,
        ajax: {
            url,
            type: 'POST',
            data: searchQueryBuilder
        },
        columns: columnsSettings,
    };

    let tableHeadersHTML = _.join(
        _.map(columnsSettings, col => `<th class='sorting'> ${col.title}</th>`), '\n')

    const tableTarget = $('#results');

    tableTarget.find('thead').remove();
    tableTarget.find('tfoot').remove();

    const datatable = tableTarget
        .on('preXhr.dt', spinner.start)
        .on('xhr.dt', function(e:any, settings:any, json:any, xhr:JQueryXHR) {
            let errors = (xhr.status === 200) ? json.errors: [`${xhr.status} - ${xhr.statusText}`];
            errorBox.display(errors);
            spinner.stop()
        })
        .DataTable(settings);

    return datatable;
};

