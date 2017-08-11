"use strict";

$(document).ready(function() {
    var taxonomy_hierarchy = [
        "kingdom",
        "phylum",
        "class",
        "order",
        "family",
        "genus",
        "species"
    ];
    var blank_option = {'text': '----', 'value': null};
    // this is populated via an ajax call, and specifies the
    // contextual metadata fields and their types
    var contextual_config;
    var next_contextual_filter_id = 1;
    var datatable;

    var set_options = function(target, options) {
        target.empty();
        $.each(options, function(index, option) {
            $('<option/>').val(option.value).text(option.text).appendTo(target);
        });
    }

    var taxonomy_selector = function(s) {
        return '#taxonomy_' + s;
    };

    var taxonomy_set_possibilities = function(result) {
        // first, we clear any drop-downs invalidated by this
        // new information
        _.each(result['clear'], function(s) {
            var target = $(taxonomy_selector(s));
            set_options(target, [blank_option]);
        });
        // then set possibilities for the target we've been given
        var new_options = result['new_options'];
        if (!new_options) {
            return;
        }
        var target = $(taxonomy_selector(new_options['target']));
        set_options(target, [blank_option].concat(_.map(new_options['possibilities'], function(val) {
            return {
                'value': val[0],
                'text': val[1]
            }
        })));
    }

    var taxonomy_get_state = function() {
        return _.map(taxonomy_hierarchy, function(s) {
            return $(taxonomy_selector(s)).val();
        });
    };

    var taxonomy_refresh = function() {
        $.ajax({
            method: 'GET',
            dataType: 'json',
            url: window.otu_search_config['taxonomy_endpoint'],
            data: {
                'selected': JSON.stringify(taxonomy_get_state())
            }
        }).done(function(result) {
            taxonomy_set_possibilities(result['possibilities']);
        });
    };

    var setup_taxonomic = function() {
        // hook up all of our events
        $.each(taxonomy_hierarchy, function(idx, s) {
            $(taxonomy_selector(s)).on('change', function() {
                taxonomy_refresh();
            });
        });
        $("#clear_taxonomic_filters").click(function () {
            $.each(taxonomy_hierarchy, function(idx, s) {
                $(taxonomy_selector(s)).val(null);
            });
            taxonomy_refresh();
        });
        // get initial selections
        taxonomy_refresh();
    };

    var update_contextual_controls = function() {
        var filters = $("#contextual_filters_target > div");
        var target = $("#no_contextual_filters");
        if (filters.length > 0) {
            target.hide()
        } else {
            target.show()
        }
        var target = $("#contextual_filters_mode_para");
        if (filters.length > 1) {
            target.show()
        } else {
            target.hide()
        }
    };

    var add_contextual_filter = function() {
        if (!contextual_config) {
            // initial config not loaded yet
            return;
        }
        var new_filter_id = 'contextual-filter-' + next_contextual_filter_id;
        next_contextual_filter_id += 1;
        var d = $([
            '<div class="row" id="' + new_filter_id + '">',
            '<div class="col-md-2"><button class="form-control" type="button"><span class="glyphicon glyphicon-minus" aria-hidden="true"></span></button></div>',
            '<div class="col-md-4"><select class="form-control contextual-item"></select></div>',
            '<div class="col-md-6 contextual-entry"></div>',
            '</div>'
        ].join("\n"));
        $("#contextual_filters_target").append(d);
        var select_box = $('#' + new_filter_id + " select");
        set_options(select_box, [blank_option].concat(_.map(contextual_config['definitions'], function(val) {
            return {
                'value': val['name'],
                'text': val['display_name']
            }
        })));
        select_box.on('change', function() {
            var target = $('#' + new_filter_id + " .contextual-entry");
            target.empty();

            var defn_name = select_box.val();
            var defn = _.find(contextual_config['definitions'], {'name': defn_name});
            var defn_type = defn['type'];

            var widget;
            if (defn_type == 'date') {
                widget = $([
                    '<div class="row">',
                    '<div class="col-md-5"><input class="form-control cval_from" /></div>',
                    '<div class="col-md-2 form-label">-</div>',
                    '<div class="col-md-5"><input class="form-control cval_to" /></div>',
                    '</div>'
                ].join("\n"));
            } else if (defn_type == 'float') {
                widget = $([
                    '<div class="row">',
                    '<div class="col-md-5"><input class="form-control cval_from" /></div>',
                    '<div class="col-md-2 form-label">-</div>',
                    '<div class="col-md-5"><input class="form-control cval_to" /></div>',
                    '</div>'
                ].join("\n"));
            } else if (defn_type == 'string') {
                widget = $([
                    '<div class="row">',
                    '<div class="col-md-4 form-label">Text contains:</div>',
                    '<div class="col-md-8"><input class="form-control cval_contains" /></div>',
                    '</div>'
                ].join("\n"));
            } else if (defn_type == 'ontology') {
                widget = $('<select class="form-control cval_select"></select>');
                set_options(widget, _.map(defn['values'], function(val) {
                    return {
                        'value': val[0],
                        'text': val[1]
                    }
                }));
            }
            target.append(widget);
        });
        $('#' + new_filter_id + ' button').click(function() {
            $('#' + new_filter_id).remove();
            update_contextual_controls();
        });
        update_contextual_controls();
    };

    var setup_contextual = function() {
        // hook up all of our events
        $("#add_contextual_filter").click(function() {
            add_contextual_filter();
        });
        $("#clear_contextual_filters").click(function() {
            $("#contextual_filters_target").empty();
            update_contextual_controls();
        });

        // get configuration of the various filters
        $.ajax({
            method: 'GET',
            dataType: 'json',
            url: window.otu_search_config['contextual_endpoint'],
        }).done(function(result) {
            contextual_config = result;
        });
        update_contextual_controls();
    };

    var marshal_contextual_filters = function() {
        var filter_state = _.map($("#contextual_filters_target > div"), function(target) {
            var marshal_input = function(selector, obj_name) {
                var matches = $(selector, target);
                if (matches.length == 1) {
                    obj[obj_name] = matches.val();
                }
            }
            var obj = {};
            obj['field'] = $(".contextual-item", target).val();
            marshal_input('.cval_from', 'from');
            marshal_input('.cval_to', 'to');
            marshal_input('.cval_contains', 'contains');
            marshal_input('.cval_select', 'is');
            return obj;
        });
        return {
            'filters': filter_state,
            'mode': $('#contextual_filters_mode').val()
        };
        return state;
    };

    var marshal_taxonomy_filters = function() {
        return taxonomy_get_state();
    };

    var setup_search = function() {
        $("#search_button").click(function() {
            datatable.ajax.reload();
        });
    };

    var setup_csrf = function() {
        var csrftoken = jQuery("[name=csrfmiddlewaretoken]").val();
        function csrfSafeMethod(method) {
            // these HTTP methods do not require CSRF protection
            return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
        }
        $.ajaxSetup({
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
    };

    var set_search_data = function(data, settings) {
        var query_obj = {
            'taxonomy_filters': marshal_taxonomy_filters(),
            'contextual_filters': marshal_contextual_filters(),
        };
        data['otu_query'] = JSON.stringify(query_obj);
        return data;
    };

    var set_errors = function(errors) {
        var target = $("#error-box");
        target.empty();
        if (!errors) {
            target.hide();
            return;
        }
        target.show();
        target.append($("<h3>Errors detected in query:"));
        var ul = $("<ul></ul>");
        target.append(ul);
        $.each(errors, function(i, e) {
            ul.append($("<li>").text(e));
        });
    }

    var setup_datatables = function() {
        datatable = $("#results").DataTable({
            'processing': true,
            'serverSide': true,
            'ajax': {
                'url': window.otu_search_config['search_endpoint'],
                'type': 'POST',
                'data': set_search_data
            },
            columns: [
              { 'data': 'bpa_id' , 'defaultContent': ''},
            ]
        });
        $("#results").on('xhr.dt', function(e, settings, json, xhr) {
            set_errors(json.errors);
        });
    };

    setup_csrf();
    setup_taxonomic();
    setup_contextual();
    setup_search();
    setup_datatables();
    set_errors(null);
});
