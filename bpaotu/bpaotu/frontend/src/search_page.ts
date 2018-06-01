import * as _ from 'lodash';

import 'bootstrap'

import 'datatables.net';
import 'datatables.net-bs';
import '../css/datatables.min.css';

import { createSpinner } from './spinner';
import { ErrorBox } from './errors';
import { ckanAuth, getAuthToken } from './auth';
import { setupDatatables } from './samples_table';
import { setOptions, HTMLSelectOption } from './utils';

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
    spinner = createSpinner('spin-container');
    errorBox = new ErrorBox('#error-box');
    datatable = setupDatatables(spinner, errorBox, window.otu_search_config.search_endpoint, buildSearchQuery);

    setupAmplicon();
    setupTaxonomic();
    setupContextual();
    $('#search_button').click(() => datatable.ajax.reload());
    setupExportButton();
    setupBIOMExportButton();
    setupMap();
    setupGalaxy();
}

const taxonomyHierarchy = [
    "kingdom",
    "phylum",
    "class",
    "order",
    "family",
    "genus",
    "species"
];

const taxonomyLabelSelector = (s: string) => `[for="taxonomy_${s}"]`;
const taxonomySelector = (s: string) => `#taxonomy_${s}`;
const taxonomyOpSelector = (s: string) => `#taxonomy_op_${s}`;

function taxonomyAllAfter(taxonomy: string) {
    const idx = taxonomyHierarchy.indexOf(taxonomy);
    return taxonomyHierarchy.slice(idx + 1);
};

function taxonomySetEnabled(taxonomy: string, enabled: boolean) {
    const lblTarget = $(taxonomyLabelSelector(taxonomy));
    if (enabled) {
      lblTarget.removeClass('disabled')
    } else {
      lblTarget.addClass('disabled')
    }
    $(taxonomyOpSelector(taxonomy)).prop('disabled', !enabled);
    $(taxonomySelector(taxonomy)).prop('disabled', !enabled);
};

const taxonomyEnable = _.partialRight(taxonomySetEnabled, true);
const taxonomyDisable = _.partialRight(taxonomySetEnabled, false);

function taxonomyClear(taxonomy: string) {
    const target = $(taxonomySelector(taxonomy));
    setOptions(target, []);
    const opTarget = $(taxonomyOpSelector(taxonomy));
    opTarget.val('is');
};

function taxonomiesDisableClear(taxonomies: string[]) {
  _.each(taxonomies, function(s) {
      taxonomyDisable(s);
      taxonomyClear(s);
  });
}

function taxonomySetLoading(taxonomy: string) {
    const loading_option: HTMLSelectOption = {
        text: 'Loading ....',
        value: null
    };
    const target = $(taxonomySelector(taxonomy));
    setOptions(target, [loading_option], false);
};

function taxonomyGetState() {
    return _.map(taxonomyHierarchy, function(s) {
      return {
        'value': $(taxonomySelector(s)).val(),
        'operator': $(taxonomyOpSelector(s)).val()
      };
    });
};

function marshalAmpliconFilter() {
    return {
      'value': $('#amplicon').val(),
      'operator': $('#amplicon_op').val()
    };
};

function taxonomySetPossibilities(result: any) {
    // first, we clear any drop-downs invalidated by this
    // new information
    taxonomiesDisableClear(result['clear']);
    // then set possibilities for the target we've been given
    const new_options = result['new_options'];
    if (!new_options) {
        return;
    }
    const target = $(taxonomySelector(new_options['target']));
    const possibilities: Array<[number, string]> = new_options['possibilities'];
    const options = _.map(possibilities, ([id, val]) => ({
            'value': id.toString(),
            'text': val
        }
    ));
    setOptions(target, options);
    taxonomyEnable(new_options['target']);
};

function taxonomyRefresh(taxonomy?: string) {
    const allAfter = taxonomyAllAfter(taxonomy);

    taxonomiesDisableClear(allAfter);

    const refreshAll = (typeof taxonomy === "undefined");
    const wasUnset = ($(taxonomySelector(taxonomy)).val() == "");

    if (refreshAll || !wasUnset) {
        const nextTaxonomy = _.first(allAfter);
        loadTaxonomy(nextTaxonomy);
    }

    function loadTaxonomy(taxonomy: string) {
        taxonomySetLoading(taxonomy);

        $.ajax({
            dataType: 'json',
            url: window.otu_search_config.taxonomy_endpoint,
            data: {
                'amplicon': JSON.stringify(marshalAmpliconFilter()),
                'selected': JSON.stringify(taxonomyGetState())
            }
        }).then(function(result) {
            taxonomySetPossibilities(result['possibilities']);
        });
    };
};

function setupTaxonomic() {
    // hook up all of our events
    $.each(taxonomyHierarchy.slice(0, -1), function(idx, s) {
        $(taxonomySelector(s)).on('change', function() {
            taxonomyRefresh(s);
        });
        $(taxonomyOpSelector(s)).on('change', function() {
            taxonomyRefresh(s);
        });
     });
    $("#clear_taxonomic_filters").click(function () {
        $("#amplicon").val(null);
        $("#amplicon_op").val('is');
        $.each(taxonomyHierarchy, function(idx, s) {
            $(taxonomySelector(s)).val(null);
            $(taxonomyOpSelector(s)).val('is');
        });
        taxonomyRefresh();
    });
    // get initial selections
    taxonomyRefresh();
};

function setupAmplicon() {
    function setAmpliconPossibilities(options: Array<[number, string]>) {
        let opts: HTMLSelectOption[] = _.map(options, ([id, val]) => ({
            value: id.toString(), text: val
        }));
        setOptions($('#amplicon'), opts);
    };

    $("#amplicon").on('change', function() { taxonomyRefresh() });
    $("#amplicon_op").on('change', function() { taxonomyRefresh() });
    $.ajax({url: window.otu_search_config.amplicon_endpoint}).then(result => {
        setAmpliconPossibilities(result['possibilities']);
    });
};

function setupSearchButton() {
    const searchButton = $('#search_button');
    searchButton.click(() => datatable.ajax.reload());

    searchButton.click(function() {
        if (datatable != null) {
            datatable.destroy();
        }
        datatable = setupDatatables(spinner, errorBox, window.otu_search_config.search_endpoint, buildSearchQuery);
    });

    searchButton.prop('disabled', false);
}

function describeSearch() {
    return {
        'taxonomy_filters': taxonomyGetState(),
        'contextual_filters': marshalContextualFilters(),
        'amplicon_filter': marshalAmpliconFilter(),
    };
}

function buildSearchQuery(data: any = {}) {
    return {
        ...data,
        otu_query: JSON.stringify(describeSearch())
    };
}

function loadContextualData() {
    const url = window.otu_search_config.contextual_endpoint;
    return $.ajax({url})
}

function marshalContextualFilters() {
    var filter_state = _.map($("#contextual_filters_target > div"), function(target) {
        var marshal_input = function(selector: string, obj_name: string) {
            var matches = $(selector, target);
            if (matches.length == 1) {
                var val = matches.val();
                if (!val) {
                    obj.invalid = true;
                } else {
                    obj[obj_name] = val;
                }
            }
        }
        var obj: any = {};
        obj.field = $(".contextual-item", target).val();
        marshal_input('.cval_op', 'operator');
        marshal_input('.cval_from', 'from');
        marshal_input('.cval_to', 'to');
        marshal_input('.cval_contains', 'contains');
        marshal_input('.cval_select', 'is');
        return obj;
    });
    filter_state = _.filter(filter_state, function(o: any) {
        return !o.invalid;
    });
    return {
        'filters': filter_state,
        'environment': marshalEnvironmentFilter(),
        'mode': $('#contextual_filters_mode').val()
    };
};

function marshalEnvironmentFilter() {
    var value = $('#environment').val();
    if (!value) {
      return null;
    }
    return {
      'value': $('#environment').val(),
      'operator': $('#environment_op').val()
    };
};

var setupContextual = function() {
    let contextualConfig: any;
    let nextContextualFilterId = 1;

    var getEnvironment = function() {
        return marshalEnvironmentFilter();
    }

    function addContextualFilter() {
        var new_filter_id = 'contextual-filter-' + nextContextualFilterId++;
        var d = $([
            '<div class="row contextual-filter-row" id="' + new_filter_id + '">',
            '<div class="col-md-1 no-padding-right"><button class="form-control remove-button" type="button"><span class="glyphicon glyphicon-minus" aria-hidden="true"></span></button></div>',
            '<div class="col-md-4 no-padding-right"><select class="form-control contextual-item"></select></div>',
            '<div class="col-md-7 contextual-entry"></div>',
            '</div>'
        ].join("\n"));
        $("#contextual_filters_target").append(d);
        var select_box = $('#' + new_filter_id + " select");
        select_box.on('change', function() {
            var target = $('#' + new_filter_id + " .contextual-entry");
            target.empty();

            var defn_name = select_box.val();
            var defn: any = _.find(contextualConfig, {'name': defn_name});
            var defn_type: string = defn['type'];

            var widget;
            if (defn_type == 'sample_id') {
                widget = $('<select multiple class="form-control cval_select"></select>');
                setOptions(widget, _.map(defn['values'], val => ({
                    value: val,
                    text: val,
                })));
            } else if (defn_type == 'date') {
                widget = $([
                    '<div class="row">',
                    '<div class="col-md-4 no-padding-right">',
                      '<select class="form-control cval_op">',
                        '<option value="between">between</option>',
                        '<option value="notbetween">not between</option>',
                    '</select></div>',
                    '<div class="col-md-4"><input class="form-control cval_from" /></div>',
                    '<div class="col-md-4"><input class="form-control cval_to" /></div>',
                    '</div>'
                ].join("\n"));
            } else if (defn_type == 'float') {
                widget = $([
                    '<div class="row">',
                    '<div class="col-md-4 no-padding-right">',
                      '<select class="form-control cval_op">',
                        '<option value="between">between</option>',
                        '<option value="notbetween">not between</option>',
                    '</select></div>',
                     '<div class="col-md-4"><input class="form-control cval_from" /></div>',
                    '<div class="col-md-4"><input class="form-control cval_to" /></div>',
                    '</div>'
                ].join("\n"));
            } else if (defn_type == 'string') {
                widget = $([
                    '<div class="row">',
                    '<div class="col-md-4 no-padding-right">',
                      '<select class="form-control cval_op">',
                        '<option value="contains">contains</option>',
                        '<option value="containsnot">doesn\'t contain</option>',
                    '</select></div>',
                    '<div class="col-md-8"><input class="form-control cval_contains" /></div>',
                    '</div>'
                ].join("\n"));
            } else if (defn_type == 'ontology') {
                widget = $([
                    '<div class="row">',
                    '<div class="col-md-4 no-padding-right">',
                      '<select class="form-control cval_op">',
                        '<option value="is">is</option>',
                        '<option value="isnot">isn\'t</option>',
                      '</select></div>',
                    '<div class="col-md-8"><select class="form-control cval_select"></select></div>',
                    '</div>'
                ].join("\n"));
                // clone
                let options = _.map(defn['values'], ([id, val]: [number, string]) => ({
                    value: id.toString(),
                    text: val
                }));
                setOptions(widget.find('.cval_select'), options);
            }
            target.append(widget);
            target.trigger('otu:filter_changed');
        });
        $('#' + new_filter_id + ' button').click(function() {
            $('#' + new_filter_id).remove();
            updateContextualControls();
        });
        configureUnselectedContextualFilters();
        updateContextualControls();
        return new_filter_id;
    };

    function updateContextualControls() {
        var filters = $("#contextual_filters_target > div");
        var target = $("#contextual_filters_mode_para");
        if (filters.length > 1) {
            target.show()
        } else {
            target.hide()
        }
    };

    function configureUnselectedContextualFilters() {
        var current_environment = getEnvironment();
        $.each($("#contextual_filters_target > div"), function(idx, target) {
            var select_box = $(".contextual-item", target);
            var select_val = select_box.val();
            if (select_val !== null && select_val !== '') {
                return;
            }

            // if we have an environment ID set, we filter the available options to those for that environment ID and those which are cross-environment
            var applicable_definitions = _.filter(contextualConfig, function (val) {
                // we don't ever select environment through the dynamic UI
                if (val.name == "environment_id") {
                    return false;
                }
                // we don't have a environment ID selected
                if (current_environment === null || !current_environment.value) {
                    return true;
                }
                // it's not a environment specific field
                if (val.environment === null) {
                    return true;
                }
                if (current_environment.operator === 'isnot') {
                    return current_environment.value != val.environment;
                } else {
                    return current_environment.value == val.environment;
                }
            });

            function displayName(config: any) {
                let text = config.display_name;
                if (config.units)
                    text += ` [${config.units}]`
                return {
                    'value': config.name,
                    'text': text
                }
            }
            setOptions(select_box, _.map(applicable_definitions, displayName));
        });
    }
    // hook up all of our events
    $("#add_contextual_filter").click(function() {
        addContextualFilter();
    });
    $("#clear_contextual_filters").click(function() {
        $("#contextual_filters_target").empty();
        updateContextualControls();
    });

    // get configuration of the various filters
    loadContextualData().then(result => {
        contextualConfig = result.definitions;
        // set up the environment filter
        let widget = $("#environment");
        let defn: any = _.find(contextualConfig, {'name': 'environment_id'});
        let options = _.map(defn['values'], ([id, val]: [number, string]) => ({
            value: id.toString(),
            text: val
        }));
        setOptions(widget, options);
        widget.on('change', function() {
            configureUnselectedContextualFilters();
        });
    });
    updateContextualControls();
};

function setupExportButton() {
    $("#export_button").click(() => {
        const params = $.param({
            token: window.CKANAuthToken,
            q: JSON.stringify(describeSearch())
        });
        const baseURL = window.otu_search_config.export_endpoint;
        const url = `${baseURL}?${params}`;

        window.open(url)
    });
}

function setupBIOMExportButton() {
    $("#export_biom_button").click(() => {
        const params = $.param({
            token: window.CKANAuthToken,
            q: JSON.stringify(describeSearch())
        });
        const baseURL = window.otu_search_config.export_biom_endpoint;
        const url = `${baseURL}?${params}`;

        window.open(url)
    });
};

function getSampleSites(samplesMap: any) {
    const info = $('#sample-sites-info');
    info.text('Processing...');
    var data = {
        'otu_query': JSON.stringify(describeSearch())
    }

    $.ajax({
        url: window.otu_search_config.search_sample_sites_endpoint,
        method: 'POST',
        data
    }).then(result => {
        const markers = window.L.markerClusterGroup();
        _.each(result.data, function(sample) {
            var title = sample.bpa_id + ' [' + sample.latitude + ', ' + sample.longitude + ']';
            var marker = window.L.marker([sample.latitude, sample.longitude],
                                        {title: title, riseOnHover: true});
            markers.addLayer(marker);
        });
        samplesMap.addLayer(markers);

        info.text('Showing ' + result.data.length + ' samples');
    });
}

function setupMap() {
    const modal = $('#map-modal') as any;

    function removePreviousMap() {
        _.each(window.maps, function(map) {
            map.off();
            map.remove();
        });
       window.maps = [];
    };

    function displayMap() {
      window.loadmapsamples_map();
      getSampleSites(window.maps[0]);
    };

    modal.on('shown.bs.modal', function() {
      displayMap();
    });
    modal.on('hidden.bs.modal', function() {
      removePreviousMap();
    });

    $("#show_map_button").click(function() {
       modal.modal('show');
    });
};

function setupGalaxy() {
    var galaxyLoading = $('#galaxy-loading');
    var allAlertTypes = _.join(_.map(_.split(
      'primary secondary success danger warning info light dark', ' '),
      function(n) { return 'alert-' + n; }), ' ');

    function displayMsg(txt: string, type?: string) {
        type = type || 'alert-success';
        var alert = $('#search-alert') as any;
        alert.find('.text').text(txt);
        alert.removeClass(allAlertTypes).addClass(type);
        alert.show();
        alert.alert();
        if (!_.includes(['alert-warning', 'alert-danger'], type)) {
            setTimeout(function() {alert.hide()}, 3000);
        }
    }

    var target = $("#submit_galaxy_button");
    target.click(function() {
        target.attr('disabled', 'disabled');
        galaxyLoading.show();
        var data = {
            // TODO which workflow
            // 'q': JSON.stringify(describe_search())
        }

        function handleError(errMsg: string) {
            var msg = 'Error in submitting Galaxy workflow!';
            console.error(msg);
            if (errMsg) {
                console.error('    ', errMsg);
            }
            displayMsg(msg, 'alert-danger');
            galaxyLoading.hide();
            target.removeAttr('disabled');
        }

        $.ajax({
            url: window.otu_search_config.submit_to_galaxy_endpoint,
            method: 'POST',
            data: data,
        }).then(result => {
            if (!result.success) {
                handleError(result.errors);
                return;
            }
            displayMsg('Submitted to Galaxy');
            galaxyLoading.hide();
            target.removeAttr('disabled');
        }).catch((resp: JQuery.jqXHR) => {
            handleError(resp.responseText || resp.toString());
        });
    });
};
