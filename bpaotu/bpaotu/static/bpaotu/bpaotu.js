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

    var taxonomy_refresh = function() {
        var state = _.map(taxonomy_hierarchy, function(s) {
            return $(taxonomy_selector(s)).val();
        });
        $.ajax({
            method: 'GET',
            dataType: 'json',
            url: window.otu_search_config['taxonomy_endpoint'],
            data: {
                'selected': JSON.stringify(state)
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

    // this is populated via an ajax call, and specifies the
    // contextual metadata fields and their types
    var contextual_config = null;

    var add_contextual_filter = function() {
        if (!contextual_config) {
            // initial config not loaded yet
            return;
        }
        var d = $([
            '<div class="row">',
            '<div class="col-md-2"><button class="form-control" type="button"><span class="glyphicon glyphicon-minus" aria-hidden="true"></span> Remove</button>',
            '</div>'
        ].join("\n"));
        $("#contextual_filters_target").append(d);
        console.log(contextual_config);
    };

    var setup_contextual = function() {
        // hook up all of our events
        $("#add_contextual_filter").click(function() {
            add_contextual_filter();
        });
        $("#clear_contextual_filters").click(function() {
            console.log("clear");

        });

        // get configuration of the various filters
        $.ajax({
            method: 'GET',
            dataType: 'json',
            url: window.otu_search_config['contextual_endpoint'],
        }).done(function(result) {
            contextual_config = result;
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

    setup_csrf();
    setup_taxonomic();
    setup_contextual();
});
