(function ($) {
  $.jstree.defaults.conditionalselect = function () { return true; };

  $.jstree.plugins.conditionalselect = function (options, parent) {
    this.select_node = function (obj, supress_event, prevent_open) {
      if(this.settings.conditionalselect.call(this, this.get_node(obj))) {
        parent.select_node.call(this, obj, supress_event, prevent_open);
      }
    };
  };

})(jQuery);

