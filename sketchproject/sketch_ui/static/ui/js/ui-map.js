var sketchui = sketchui || {};

/*
    Map component
*/

sketchui.Map = function(){

    var self = this;
    
    self.baseLayers = ko.observableArray();
    self.overlayLayers = ko.observableArray();
    
    self.bounds = ko.observable();
    
    //the underlying leaflet/openlayers map
    self.mapObject = null;


};