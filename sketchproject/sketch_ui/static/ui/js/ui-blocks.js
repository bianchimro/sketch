var sketchui = sketchui || {};


//sketch instance global to sketchui
sketchui.sketch = new sketchjs.Sketch("", 'sketchdb');

/*
    The Register holds a reference to each block
*/
sketchui.Register = function(options){

    options = options || {};

    var self=this;
    self.blocks = {};
    self.containerSelector = options.containerSelector || null;
    
    jsPlumb.bind("jsPlumbConnection", function(info) {
             
            var sourceLabel = info.sourceEndpoint.getLabel();
            var sourceBlock = self.blocks[info.sourceId];
            var targetLabel = info.targetEndpoint.getLabel();
            var sourceLabel = info.sourceEndpoint.getLabel();
            var targetBlock = self.blocks[info.targetId];
            
            //todo: generalize
            if(sourceBlock.results()){
                targetBlock.inConnectionsMeta[targetLabel] = sourceBlock.output;
                targetBlock.inputObservables[targetLabel](sourceBlock.results());
                targetBlock.dirty(false);  
            }
            targetBlock.inConnections[targetLabel] = sourceBlock.results.subscribe(function(newValue){
                targetBlock.inConnectionsMeta[targetLabel] = sourceBlock.output;
                targetBlock.inputObservables[targetLabel](newValue);     
                targetBlock.dirty(false);   
            });
            
            
               
    });

    jsPlumb.bind("jsPlumbConnectionDetached", function(info) {
            
            var sourceLabel = info.sourceEndpoint.getLabel();
            var sourceBlock = self.blocks[info.sourceId];
            var targetLabel = info.targetEndpoint.getLabel();
            var targetBlock = self.blocks[info.targetId];
            targetBlock.inConnections[targetLabel].dispose();
            targetBlock.dirty(true);   
    });
    
    
    
    
    self.addBlock = function(blo, containerSelector){
        containerSelector = containerSelector || self.containerSelector;
        blo = blo.renderInContainer(containerSelector);
        self.blocks[blo.oid] = blo;
        blo.register = self;
        return blo;
    
    };

    self.removeBlock = function(blo){
    
        ko.cleanNode(blo.containerElement);
        blo.destroy();
        delete self.blocks[blo.oid];
        jsPlumb.removeAllEndpoints(blo.containerElement);
        $(blo.selector).remove();
    
    };
    
    self.resetBlocks = function(){
        for(var o in self.blocks){
            
            self.removeBlock(self.blocks[o]);
        }
    
    };
    
    
    self.serialize = function(){
    
        var out = { blocks: {}};
        
        for(var o in self.blocks){
            
            out.blocks[o] = self.blocks[o].serialize();
        }
        return out;
        
    };
    
    
    self.deserialize = function(serializedState){
        
        for(x in serializedState.blocks){
            var data = serializedState.blocks[x];
            self.deserializeBlock(data);
        
        }
    
    };
    
    self.deserializeBlock = function(data){
        console.log(data);
        
        var obj = data.obj;
        var constructor = sketchui[obj.className];
        var block = new constructor();
        
        block.dirty(obj.dirty);
        block.minimized(data.view.minimized);
                
        self.addBlock(block, self.containerSelector);
        
        $(block.selector).offset(data.view.offset);

        
        jsPlumb.repaint(block.oid);
        
    
    };
    




};



sketchui.Block = function(options){
    
    
    var self=this;
    self.register = null;
    self.oid = sketchjs.generateOid('block');
    
    self.connectorId = "connector-" + self.oid;
    self.selector = "#"+self.oid;
    self.containerElement = null;
    
    self.dirty = ko.observable(true);
    
    self.name = options.name;
    self.inputs = options.inputs;
    self.output = options.output;
    
    self.className = options.className || 'Block';

    self.numInputs = self.inputs.length;
    self.processor = options.processor;
    self.templateUrl = options.templateUrl;
    
    self.results = ko.observable();    
    
    
    self.template = ko.observable("");
    self.minimized = ko.observable(options.minimized || false);
    
    self.inEndpoints = {};
    self.outEndpoints = {};
    
    self.inConnections = {};
    self.inConnectionsMeta = {};
    
    self.outConnections = {};
    
    self.inputObservables = {};
    self.inputMeta = {};
    
    for(var i=0;i<self.numInputs; i++){
        var inp = self.inputs[i];
        self.inputObservables[inp.name] = ko.observable('');
        
        self.inputObservables[inp.name].subscribe(function(newV){
            self.dirty(true);
        });
        
        self.inputMeta[inp.name] = inp;
    
    }
    
    
    
    self.renderInContainer = function(containerSelector){
        
        var template = self.getTemplate();
        var jTemplate = $(template);
        jTemplate.attr("id", self.oid);
        
        $(containerSelector).append(jTemplate);
        self.containerElement = $(self.selector)[0];
        ko.applyBindings(self, self.containerElement);
        if(self.postRender instanceof Function){
            self.postRender();
        }
        
        self.generateOutEndpoints();
        self.generateInEndpoints();
        self.setDraggable();
        
        return self;
    
    };
    
    
    self.minimize = function(){
        jsPlumb.repaint(self.oid);
        self.minimized(true);
    };
    
    self.maximize = function(){
        jsPlumb.repaint(self.oid);
        self.minimized(false);
    };

    
    self.inputsArgs = ko.computed(
        
        function(){
        
            var out = {};
            for(var i in self.inputObservables){
                var obs = self.inputObservables[i];
                out[i] = obs();
            }
            return out;
        }
    );
    
    
    self.run = function(){
        
        var inputArgs = self.inputsArgs();
        
        if(self.processor instanceof Function){
            self.processor(inputArgs, self);
            
        }
    
    };
    
    
    self._getTemplate = function(){
        //todo: cache
        $.ajax({
            url : self.templateUrl,
            type : 'GET',
            async : false,
            cache : false,
            success : function(data){
                self.template(data);
            }
        
        });
    
    
    };
    
    
    self.getTemplate = function(){
        self._getTemplate();
        return self.template();
    
    };
    
    
    self.fromjson=function(data){
        return JSON.stringify(data);
    };
    
    
    self.generateOutEndpoints = function(){
    
       if(!self.output){
        return;
       } 
       
       var sourceColor = "#ccc";
       var sourceEndpoint = {
           endpoint:["Dot", { radius:20 }],
           paintStyle:{ fillStyle:sourceColor},
           isSource: true,
           connectorStyle:{ strokeStyle:sourceColor, lineWidth:5 },
           connector: ["Flowchart"],
           overlays: [
	        	[ "Arrow", { foldback:0.2 } ],
	        	[ "Label", { cssClass:"labelClass" } ]	
	        ],
           maxConnections:10,
           connectionsDetachable : true,
           anchor:"TopCenter"
       };
       
       var output = self.output;
       var opts = { anchor:"BottomCenter", label:output.name };
       self.outEndpoints[output.name] = jsPlumb.addEndpoint(self.containerElement,  opts, sourceEndpoint);
       
    
    };
    
    
    self.generateInEndpoints = function(){
    
        
       var targetColor = "#bbbddd";
       var targetEndpoint = {
           endpoint:["Dot", { radius:16 }],
           paintStyle:{ fillStyle:targetColor},
           isTarget:true,
           connectorStyle:{ },
           connector: ["FlowChart", { curviness:63 } ],
           maxConnections:1,
           connectionsDetachable : true
           //isTarget:true,
           //dropOptions : targetDropOptions
       };
       
       for(var i=0;i<self.numInputs; i++){
            var inp = self.inputs[i];
            if(!inp.connectable){
                continue;
            }
            var opts = { anchors:"TopCenter", label:inp.name };
            self.inEndpoints[inp.name] = jsPlumb.addEndpoint(self.containerElement,  opts, targetEndpoint);
            
            
        }
    };
    
    
    
    self.setDraggable = function(){
    
        jsPlumb.draggable(self.oid, {
            //start : function(e,u){ jsPlumb.repaint(self.oid);},
            //drag : function(e,u){ jsPlumb.repaint(self.oid);},
            //stop : function(e,u){ jsPlumb.repaint(self.oid);}
            
            handle: ".modal-header"
    
        });    

    };
    
    
    self.remove = function(){
        return self.register.removeBlock(self);
    
    };
    
    
    self.destroy = function(){
        console.log("whe should dispose all notifications here ... and also remove all connections");
    
    };
    
    
    self.serialize = function(){
    
        
        var out = {
            obj : {},
            view : {}
            
        
        };
        
        out.obj.oid = self.oid;
        //serialize classes
        out.obj.className = self.className;
        out.obj.inputs = self.inputs;
        out.obj.output = self.output;
        
        out.obj.inConnectionsMeta = self.inConnectionsMeta;
        
        
        out.obj.results = self.results();
        out.obj.dirty = self.dirty();
        
        out.view.offset = $(self.selector).offset();
        out.view.minimized = self.minimized();
        return out;
        
        
        
        
    }
    
    
    
    //garbage collection
    self.getReferencedCollections = function(){
    
    
    };
    
    
    return self;
    
};



sketchui.QueryBlock = function(){

    var options = { className : 'QueryBlock'};
    var self = this;
    
    options.name = "query";
    options.inputs = [
        { 'name' : 'collection', type : 'text' },
        { 'name' : 'querystring', type : 'textarea' },        
        { 'name' : 'formatter', type : 'text' },        
    ];
    
    options.output = { name : 'results', type : 'collection_name'};
    
    self = new sketchui.Block(options);
    self.preview = ko.observable();
    
    self.templateUrl = '/static/ui/block-templates/query.html';
    self.processor = function(inputArgs, context){
    
        var dropCollection = self.results() || null;
        var formatter = self.formatterEnabled() ? inputArgs.formatter : '';
        self.dirty(true);
        sketchui.sketch.objects({}, inputArgs.collection, { query: inputArgs.querystring, formatter: formatter, write_collection:true, drop_collection:dropCollection }, function(response){
               context.results(response.collection_out);
               self.dirty(false);
           });
    };
    
    
    self.getPreview = function(){
        if(! self.dirty()){
            var collectionName = self.results();
            sketchui.sketch.objects({}, collectionName, { limit: 10}, function(response){
               self.preview(response.results);
           })
        
        }
    };
    
    self.dirty.subscribe(function(newValue){
        self.preview(null);
    });
    
    
    
    //init code
    
    self.formatterEnabled = ko.observable(false);
    
    self.formatters = ko.observableArray();
    sketchui.sketch.getFormattersInfo(function(response){
        self.formatters(response.results);
    
    });
    
    self.availableCollections = ko.observableArray();
    sketchui.sketch.getDbInfo({}, function(response){
               self.availableCollections(response.results);
    });
    
    
    return self;

};


sketchui.DbInfoBlock = function(){

    var options = { className : 'DbInfoBlock' };
    var self = this;
    
    options.name = "dbinfo";
    options.inputs = [];
    options.output = { name : 'results', type : 'objects_list'};
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/dbinfo.html';
    self.processor = function(inputArgs, context){
    
        sketchui.sketch.getDbInfo({}, function(response){
               context.results(response.results);
               self.dirty(false);
            });
    };
    
    return self;

};





sketchui.ListBlock = function(){

    var options = { className : 'ListBlock' };
    var self = this;
    
    options.name = "listblock";
    options.inputs = [{ name : 'in_collection', type : 'collection_name', connectable: true}];
    options.output = { name : 'results', type : 'objects_list'};
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/listblock.html';
    
    
    self.inputObservables['in_collection'].subscribe(function(newValue){
        var inputType = self.inConnectionsMeta['in_collection']['type']; 
        if(inputType == 'collection_name'){
            self.readRecords(newValue);
        }
        if(inputType == 'objects_list'){
            self.results(newValue);
        }
        
        
    });
    
    
    self.readRecords = function(collectionName){
    
        sketchui.sketch.objects({}, collectionName, {  }, function(response){
               self.results(response.results);
               self.dirty(false);
           });
    };
    

    return self;

};



sketchui.MapBlock = function(){

    var options = { className : 'MapBlock' };
    var self = this;
    
    options.name = "mapblock";
    options.inputs = [{ name : 'in_collection', type : 'collection_name', connectable: true}];
    options.output = { name : 'results', type : 'objects_list'};
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/map.html';
    
    
    self.inputObservables['in_collection'].subscribe(function(newValue){
        var inputType = self.inConnectionsMeta['in_collection']['type']; 
        if(inputType == 'collection_name'){
            self.readRecords(newValue);
        }
        if(inputType == 'objects_list'){
            self.results(newValue);
        }
        
        
    });
    
    
    self.readRecords = function(collectionName){
    
        sketchui.sketch.objects({}, collectionName, {  }, function(response){
               self.results(response.results);
               self.dirty(false);
           });
    };
    
    
    self.postRender = function(){

            self.map = new OpenLayers.Map(self.mapOid);
            var osm = new OpenLayers.Layer.OSM();
            self.map.addLayer(osm);
            
            
            /*
            var geojson_layer = new OpenLayers.Layer.Vector("GeoJSON", {
                strategies: [new OpenLayers.Strategy.BBOX()],
                protocol: new OpenLayers.Protocol.HTTP({
                    //url : '/static/geogeneric/l1.geojson',
                    url: "/geo/layer/1",
                    format: new OpenLayers.Format.GeoJSON()
                })
            });
            

            map.addLayer(geojson_layer);        
            map.setCenter(new OpenLayers.LonLat(11000, 45000),10);
            */
            self.map.zoomToMaxExtent();    
            
            /*
            $(self.selector).resizable({
                resize : function(e,u){ 
                    jsPlumb.repaint(self.oid);
                    
                },
                
                alsoResize: $("#"+self.mapOid)
            
            });        
            */
    
    };
    
    
    self.addLayer = function(results){
    
        //delete self.geojson_layer;
    
        self.geojson_layer = new OpenLayers.Layer.Vector("GeoJSON");
        var geojson_format = new OpenLayers.Format.GeoJSON({
            'internalProjection': self.map.baseLayer.projection,
            'externalProjection': new OpenLayers.Projection("EPSG:4326")
        });
        
        for(var i=0,n=results.length;i<n;i++){
            var fr = geojson_format.read(JSON.stringify(results[i]));
            self.geojson_layer.addFeatures(fr);
        }
        
        self.map.addLayer(self.geojson_layer);
        self.map.zoomToExtent(self.geojson_layer.getDataExtent());
    
    };
    
    
    self.results.subscribe(function(newValue){
        self.addLayer(newValue);
    });
    
    
    self.map = null;
    self.mapOid = "map"+self.oid;
    
    

    return self;

}








sketchui.ItemListBlock = function(){

    var options = { className : 'ItemListBlock' };
    var self = this;
    
    
    options.name = "listblock";
    options.inputs = [{ name : 'results', type : 'objects_list', connectable: true}];
    options.output = { name : 'results', type : 'objects_list'};
    
    self = new sketchui.Block(options);
    
    self.currentIndex = ko.observable(null);
    self.currentItem = ko.computed(function(){
        if(self.currentIndex() !== null){
            return self.results()[self.currentIndex];
        }
    });

   
    self.results.subscribe(function(){
        self.currentIndex(0);
    });
    
    
    self.templateUrl = '/static/ui/block-templates/itemlistblock.html';
    self.fromjson=function(data){
        return JSON.stringify(data);
    };
    
    
    self.inputObservables['results'].subscribe(function(newValue){
        self.results(newValue);
    });
    
    
    return self;

}





sketchui.ToolBar = function(register, canvasSelector){
    
     var self=this;
     self.register = register;
     
     self.addQuery = function(){
         var qb = self.register.addBlock(new sketchui.QueryBlock(), canvasSelector);       
     };
     self.addList = function(){
         var li = self.register.addBlock(new sketchui.ListBlock(), canvasSelector);
     };
     
      self.addItemList = function(){
         var db = self.register.addBlock(new sketchui.ItemListBlock(), canvasSelector);
     };
     
     self.addDbInfo = function(){
         var db = self.register.addBlock(new sketchui.DbInfoBlock(), canvasSelector);
     };
     
     self.addMap = function(){
         var db = self.register.addBlock(new sketchui.MapBlock(), canvasSelector);
     };
     
     
     self.zoomOut = function(){
        //not working yet;
     
     };
 
 
 };








/* deprecated */
sketchui.addBlockFromOptions = function(options, containerSelector){

    var blo = new sketchui.Block(options);
    var template = blo.getTemplate();
    var jTemplate = $(template);
    jTemplate.attr("id", blo.oid);
    
    $(containerSelector).append(jTemplate);
    ko.applyBindings(blo, $(blo.selector)[0]);
    
    
    //
    var sourceColor = "#ff9696";
     var sourceEndpoint = {
       endpoint:["Dot", { radius:8 }],
       paintStyle:{ fillStyle:sourceColor},
       isSource:true,
       connectorStyle:{ strokeStyle:sourceColor, lineWidth:2 },
       connector: ["Bezier", { curviness:63 } ],
       maxConnections:1,
       //isTarget:true,
       //dropOptions : targetDropOptions
       anchor:"TopCenter"
    };
    
    jsPlumb.draggable(blo.oid, {
    
        drag : function(e,u){ jsPlumb.repaint(blo.oid);},
        stop : function(e,u){ jsPlumb.repaint(blo.oid);}
    
    });    
    var endpoint = jsPlumb.addEndpoint($(blo.selector),  { anchor:"BottomCenter" }, sourceEndpoint);
    
    
    return blo;

};



/* declarative-style widgets */

sketchui.queryBlock = {
    name : 'query',
    inputs : [
        { 'name' : 'collection', type : 'text' },
        { 'name' : 'querystring', type : 'textarea' },        
    ],
    output : { name : 'results', type : 'objects_list'},
    templateUrl : '/static/ui/block-templates/query.html',
    processor : function(inputArgs, context){
    
        sketchui.sketch.objects({}, inputArgs.collection, { query: inputArgs.query }, function(response){
                context.results(response.results);
               
           });
    }


};



sketchui.dbInfoBlock = {
    name : 'dbinfo',
    inputs : [
     
    ],
    output : { name : 'results', type : 'objects_list'},
    templateUrl : '/static/ui/block-templates/dbinfo.html',
    processor : function(inputArgs, context){
    
        sketchui.sketch.getDbInfo({}, function(response){
               context.results(response.results);
               
            });
    }


};




