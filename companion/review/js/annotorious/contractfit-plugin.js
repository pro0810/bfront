annotorious.plugin.HelloWorldPlugin = function(opt_config_options) { }

annotorious.plugin.HelloWorldPlugin.prototype.initPlugin = function(anno) {
  // Add initialization code here, if needed (or just skip this method if not)
}

annotorious.plugin.HelloWorldPlugin.prototype.onInitAnnotator = function(annotator) {
  // A Field can be an HTML string or a function(annotation) that returns a string
  annotator.popup.addField(function(annotation) { 
    return '<em>Hello World: ' + annotation.text.length + ' chars</em>'
  });
}

// Add the plugin like so
anno.addPlugin('HelloWorldPlugin', {});
