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

    var taxonomy_selector = function(s) {
        return '#' + s + '_id';
    };

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
            console.log(result);
        });
    };

    var bootstrap_taxonomic = function() {
        // bootstrap the taxonomic search function
        taxonomy_refresh();
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
                    console.log('set the header', csrftoken);
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
    };

    setup_csrf();
    bootstrap_taxonomic();
});
