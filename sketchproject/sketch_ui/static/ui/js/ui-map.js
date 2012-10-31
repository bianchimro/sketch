var sketchui = sketchui || {};


sketchui.Map = function(){

    var self = this;
    
    self.baseLayers = ko.observableArray();
    self.overlayLayers = ko.observableArray();
    
    self.bounds = ko.observable();


}