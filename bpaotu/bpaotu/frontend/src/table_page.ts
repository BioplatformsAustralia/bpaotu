import * as _ from 'lodash';

import 'bootstrap'

import 'datatables.net';
import 'datatables.net-bs';
import '../css/datatables.min.css';

import { createSpinner } from './spinner';
import { ErrorBox } from './errors';
import { ckanAuth } from './auth';
import * as search from './search';

// On datatables.net Ajax errors don't display alert box.
// We're handling display of error messages.
$.fn.dataTable.ext.errMode = 'none';

let spinner: any;
let datatable: any;
let errorBox: ErrorBox;

export function init() {
    $(document).ready(() => {
        ckanAuth().then(() => {
            initPage();
        });
    })
};

function initPage() {
    setupContextual();
    errorBox = new ErrorBox('#error-box');
    spinner = createSpinner('spin-container');
    datatable = setupDatatables();
    setupSearchButton();
    setupExportButton();
}

interface HTMLSelectOption {
    value: string,
    text: string
}

function setupSearchButton() {
    const searchButton = $('#search_button');
    searchButton.click(() => datatable.ajax.reload());

    searchButton.click(function() {
        let cols: DataTables.ColumnSettings[] = _.map(getSelectedColumns(), select => ({
                data: select.value,
                title: select.text,
                defaultContent: '',
                render: (data: any) => data == null ? '' : data
             }));

        if (datatable != null) {
            datatable.destroy();
        }
        datatable = setupDatatables(cols);
    });

    searchButton.prop('disabled', false);
}

function buildSearchQuery(data: any = {}): any {
    let query = {...search.EmptyOTUQuery};
    query.required_headers = _.map(getSelectedColumns(), so => so.value);

    return Object.assign(data, {
        otu_query: JSON.stringify(query)
    });
}

function setupDatatables(extraColumns: DataTables.ColumnSettings[] = []) {

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
            url: window.otu_search_config['required_table_headers_endpoint'],
            type: 'POST',
            data: buildSearchQuery
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

function loadContextualData() {
    const url = window.otu_search_config.contextual_endpoint;
    return $.ajax({url})
};

function setOptions(target: JQuery, options: HTMLSelectOption[], addBlank=false) {
    const blankOption: HTMLSelectOption = {
        text: '----',
        value: null
    };
    target.empty();

    if (addBlank) {
        options = [blankOption, ...options];
    }
    $.each(options, function(index, option) {
        $('<option/>').val(option.value).text(option.text).appendTo(target);
    });
};

function setupContextual() {
    let contextualConfig: any;
    let nextContextualFilterId = 0;

    function setContextualFilterOptions() {
        $.each($("#contextual_filters_target > div"), function(idx, target: HTMLElement) {
            let select_box = $(".contextual-item", target);
            let select_val = select_box.val();
            if (select_val !== null && select_val !== '') {
                return;
            }

            function displayName(config: any) {
                let text = config.display_name;
                if (config.units)
                    text += ` [${config.units}]`
                return {
                    'value': config.name,
                    'text': text
                }
            }
            setOptions(select_box, _.map(contextualConfig, displayName), true);
        });

    }

    function addContextualFilter() {
        let newFilterId = 'contextual-filter-' + nextContextualFilterId++;

        let template = `
            <div class="row" id="${newFilterId}">
                <div class="col-md-2">
                    <button class="form-control remove-button" type="button">
                        <span class="glyphicon glyphicon-minus" aria-hidden="true"></span>
                    </button>
                </div>
                <div class="col-md-10">
                    <select class="form-control contextual-item"></select>
                </div>
            </div>`;
        $("#contextual_filters_target").append(template);
        $(`#${newFilterId} button`).click(function() {
            $('#' + newFilterId).remove();
        });
        setContextualFilterOptions();
    }

    loadContextualData().then(data => {
        contextualConfig = data.definitions;

        $('#add_contextual_filter').click(() => {
            addContextualFilter();
        });
        $('#clear_contextual_filters').click(() => {
            $("#contextual_filters_target").empty();
        });
        $('#add_contextual_filter').prop('disabled', false);
        $('#clear_contextual_filters').prop('disabled', false);
    });
}

function getSelectedColumns(): HTMLSelectOption[] {
    let selectBoxes = _.map($('#contextual_filters_target .contextual-item'), (x: any) => $(x));
    let values = _.map(selectBoxes, select => ({
        value: select.val(),
        text: select.find('option:selected').text()
    }));
    values = _.filter(values, x => x.value != '');
    return (_.uniqBy(values, 'value') as HTMLSelectOption[]);
}

function setupExportButton() {
    $("#export_button").click(function() {
        let data = buildSearchQuery();

        $.ajax({
            type: 'POST',
            url: window.otu_search_config.contextual_csv_download_endpoint,
            data: data
        }).done(function(data: any) {
            const blob = new Blob([data], {type: 'octet/stream'});
            let link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'my-csv.csv';
            link.click();
        });
    });
}


