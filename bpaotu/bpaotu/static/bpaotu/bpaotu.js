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
        return '#taxonomy_' + s;
    };

    var taxonomy_refresh = function() {
        var state = _.zipObject(taxonomy_hierarchy, _.map(taxonomy_hierarchy, function(s) {
            return $(taxonomy_selector(s)).val();
        }));
        $.getJSON(window.otu_search_config['taxonomy_endpoint'], state)
            .done(function(data) {
                console.log(data);
            });
    };

    var bootstrap_taxonomic = function() {
        // bootstrap the taxonomic search function
        taxonomy_refresh();
    };

    bootstrap_taxonomic();
});
