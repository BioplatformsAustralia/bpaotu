"use strict";

$(document).ready(function() {
    var theSpinner = null;
    var authentication_token = null;


    function stop_spinner() {
        if (theSpinner) {
            theSpinner.stop();
            theSpinner = null;
        }
    }

    function start_spinner() {
        var opts = {
            lines: 15, // The number of lines to draw
            length: 14, // The length of each line
            width: 10, // The line thickness
            radius: 20, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 60, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            color: '#000', // #rgb or #rrggbb or array of colors
            speed: 2.2, // Rounds per second
            trail: 95, // Afterglow percentage
            shadow: true, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: 'spinner', // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: '50%', // Top position relative to parent
            left: '50%' // Left position relative to parent
        };
        var target = document.getElementById('spinner');

        if (!theSpinner) {
            theSpinner = new Spinner(opts).spin(target);
        }
    }

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
    };

    var taxonomy_selector = function(s) {
        return '#taxonomy_' + s;
    };

    var taxonomy_get_state = function() {
        return _.map(taxonomy_hierarchy, function(s) {
            return $(taxonomy_selector(s)).val();
        });
    };

    var update_contextual_controls = function() {
        var filters = $("#contextual_filters_target > div");
        var target = $("#contextual_filters_mode_para");
        if (filters.length > 1) {
            target.show()
        } else {
            target.hide()
        }
    };

    var get_environment_id = function() {
        return marshal_environment_filter();
    }


    var configure_unselected_contextual_filters = function() {
        var current_environment_id = get_environment_id();
        $.each($("#contextual_filters_target > div"), function(idx, target) {
            var select_box = $(".contextual-item", target);
            var select_val = select_box.val();
            if (select_val !== null && select_val !== '') {
                return;
            }

            // if we have an environment ID set, we filter the available options to those for that environment ID and those which are cross-environment
            var applicable_definitions = _.filter(contextual_config['definitions'], function (val) {
                // we don't ever select environment through the dynamic UI
                if (val.name == "environment_id") {
                    return false;
                }
                // we don't have a environment ID selected
                if (current_environment_id === null) {
                    return true;
                }
                // it's not a environment specific field
                if (val.environment === null) {
                    return true;
                }
                // it matches current environment
                if (val.environment == current_environment_id) {
                    return true;
                }
                return false;
            });
            set_options(select_box, [blank_option].concat(_.map(applicable_definitions, function(val) {
                var dn = val['display_name'];
                var units = val['units'];
                if (units) {
                    dn = dn + ' [' + units + ']';
                }
                return {
                    'value': val['name'],
                    'text': dn
                }
            })));
        });
    }


    var add_contextual_filter = function() {
        if (!contextual_config) {
            // initial config not loaded yet
            return;
        }
        var new_filter_id = 'contextual-filter-' + next_contextual_filter_id;
        next_contextual_filter_id += 1;
        var d = $([
            '<div class="row" id="' + new_filter_id + '">',
            '<div class="col-md-2"><button class="form-control remove-button" type="button"><span class="glyphicon glyphicon-minus" aria-hidden="true"></span></button></div>',
            '<div class="col-md-4"><select class="form-control contextual-item"></select></div>',
            '<div class="col-md-6 contextual-entry"></div>',
            '</div>'
        ].join("\n"));
        $("#contextual_filters_target").append(d);
        var select_box = $('#' + new_filter_id + " select");
        select_box.on('change', function() {
            var target = $('#' + new_filter_id + " .contextual-entry");
            target.empty();

            var defn_name = select_box.val();
            var defn = _.find(contextual_config['definitions'], {'name': defn_name});
            var defn_type = defn['type'];

            var widget;
            if (defn_type == 'sample_id') {
                widget = $('');
                set_options(widget, _.map(defn['values'], function(val) {
                    return {
                        'value': val,
                        'text': val,
                    }
                }));
            } else if (defn_type == 'date') {
                widget = $([].join("\n"));
            } else if (defn_type == 'float') {
                widget = $([].join("\n"));
            } else if (defn_type == 'string') {
                widget = $([].join("\n"));
            } else if (defn_type == 'ontology') {
                widget = $();
                // clone
                var options = defn['values'].slice(0);
                options.unshift([null, '- All -']);
                set_options(widget, _.map(options, function(val) {
                    return {
                        'value': val[0],
                        'text': val[1]
                    }
                }));
            }
            target.append(widget);
            target.trigger('otu:filter_changed');
        });
        $('#' + new_filter_id + ' button').click(function() {
            $('#' + new_filter_id).remove();
            update_contextual_controls();
        });
        configure_unselected_contextual_filters();
        update_contextual_controls();
        return new_filter_id;
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

        $.when(check_for_auth_token).done(function() {
            $.ajax({
                method: 'GET',
                dataType: 'json',
                url: window.otu_search_config['contextual_endpoint'],
                data: {
                    'token': authentication_token, 
                }
            }).done(function(result) {
                contextual_config = result;
                // set up the environment filter
                var widget = $("#environment");
                var defn = _.find(contextual_config['definitions'], {'name': 'environment_id'});
                var options = defn['values'].slice(0);
                options.unshift([null, '- All -']);
                set_options(widget, _.map(options, function(val) {
                    return {
                        'value': val[0],
                        'text': val[1]
                    }
                }));
                widget.on('change', function() {
                    configure_unselected_contextual_filters();
                });
            });
            update_contextual_controls();

        });

    };

    var marshal_environment_filter = function() {
        var val = $("#environment").val();
        if (!val) {
            return null;
        }
        return val;
    };


    var marshal_taxonomy_filters = function() {
        return taxonomy_get_state();
    };


    var search_complete = function() {
        stop_spinner();
    };


    var setup_search = function() {
        $("#search_button").click(function() {
            start_spinner()
            datatable.ajax.reload(search_complete);
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


    var marshal_contextual_filters = function() {
        var filter_state = _.map($("#contextual_filters_target > div"), function(target) {
            var marshal_input = function(selector, obj_name) {

                var matches = $(selector, target);
                if (matches.length == 1) {
                    var val = matches.val();
                    if (!val) {
                        // obj['invalid'] = true; // Keep this even if there is no entry
                    } else {
                        obj[obj_name] = val;
                    }
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
            'environment': null, // We are using null for all data
            'mode': 'or' // remove the option to specifiy search criteria
        };
    };


    var describe_search = function() {
        return {
            'taxonomy_filters': marshal_taxonomy_filters(),
            'contextual_filters': marshal_contextual_filters(),
            'amplicon_filter': '',
        };
    }


    var set_search_data = function(data, settings) {
        data['otu_query'] = JSON.stringify(describe_search());
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
        target.append($("<h3>Error:</h3>"));
        var ul = $("<ul></ul>");
        target.append(ul);
        $.each(errors, function(i, e) {
            ul.append($("<li>").text(e));
        });
    }


    var columns_config_default = [
        {
            'data': 'bpa_id',
            'defaultContent': '',
            'render': function(data, type, row) {
                var environment = row.environment;
                var org;
                if (environment == 'Soil') {
                    org = 'bpa-base';
                } else {
                    org = 'bpa-marine-microbes';
                }
                var url = window.otu_search_config['ckan_base_url'] + '/organization/' + org + '?q=bpa_id:102.100.100.' + data;
                return '<a href="' + url + '" target="_blank">' + data + '</a>';
            }
        },
        {
            'data': 'environment',
            'defaultContent': ''
        }
    ];


    $("#export_button").click(function() {
        const saveData = (function () {
            const a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            return function (data, fileName) {
                const blob = new Blob([data], {type: "octet/stream"}),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            };
        }());

        const fileName = "my-csv.csv";

        var header_data = { 'otu_query': JSON.stringify(describe_search()) };

        $.ajax({
            type: 'POST',
            url: window.otu_search_config['ckan_base_url'] + '/contextual_csv_download_endpoint/',
            data: header_data
        }).done(function(data) {
            saveData(data, fileName);
        });
    });


    var datatable_config = {
        'processing': true,
        'serverSide': true,
        'ajax': {
            'url': window.otu_search_config['required_table_headers_endpoint'],
            'type': 'POST',
            'data': set_search_data
        },
        columns: columns_config_default,
    };


    var setup_datatables = function() {
        datatable = $("#results").DataTable(datatable_config);
        $("#results").on('xhr.dt', function(e, settings, json, xhr) {
            set_errors(json.errors);
        });

        return datatable;
    };


    $("#search_button").click(function() {
        if ($.fn.DataTable.isDataTable("#results")) {
            $('#results').DataTable().clear().destroy();
        }

        var required_headers = marshal_contextual_filters();
        required_headers = required_headers["filters"];

        var headers = [];
        var datatable_headers = [];

        for (var i=0; i<required_headers.length; i++) {
            var elem = required_headers[i]["field"];

            if (elem.length > 0) {
                datatable_headers.push(elem);

                var array = elem.split("_");
                var user_friendly = "";

                for(var j=0; j<array.length; j++) {
                    user_friendly += (array[j].substr(0,1).toUpperCase() + array[j].substr(1) + ' ');
                }

                user_friendly = user_friendly.substr(0, user_friendly.length -1);
                headers.push(user_friendly);
            }
        }

        headers = $.unique(headers);
        datatable_headers = $.unique(datatable_headers);

        var cols = columns_config_default;
        cols.splice(2);

        for (var i = 0; i<datatable_headers.length; i++) {
            cols.push({
                'data': datatable_headers[i],
                'defaultContent': ''
            });
        }

        datatable_config.columns = cols;
        var header_footer_str = "<th class='sorting_asc'>Sample BPA ID</th><th class='sorting'>BPA Project</th>";
        for (var i=0; i<headers.length; i++) {
            header_footer_str += "<th class='sorting'>" + headers[i] + "</th>";
        }

        $("#results > thead > tr > th").remove();
        $("#results > tfoot > tr > th").remove();
        $("#results").find('thead').find('tr').append(header_footer_str);
        $("#results").find('tfoot').find('tr').append(header_footer_str);

        tbl_ptr = setup_datatables();
    }); // End click function()



    function check_for_auth_token() {
        if (authentication_token == null) {
            get_auth_token();
        }
        return;
    }


    function get_auth_token() {
        var bpa_endpoint = '/user/private/api/bpa/check_permissions';

        $.ajax({
            url: bpa_endpoint,
            async: true,
            success: function(result) {
                authentication_token = result;

                setup_csrf();
                setup_contextual();
                setup_search();
                var tbl_ptr = setup_datatables();
                set_errors(null);

                $(document).tooltip();
            },
            error: function(result) {
                $("#token_error_message").html("<h4>Please log into CKAN and ensure that you are authorised to access the AusMicro data.</h4>");
            }
        });
    }

    get_auth_token();



});
