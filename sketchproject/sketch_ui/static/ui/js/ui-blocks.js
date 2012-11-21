var sketchui = sketchui || {};

 
/*
    #TODO:brach : blocks_refactor
    input types and compatibility
    validators# almost ok
    errors# almost ok
    
    uniform "process" idea
    inputs connections: fix layout if more than one connection is possible ...
        
    #TODO, MAYBE
    connectors scopes
    multiple outputs

    
*/


sketchui.isEmpty = function(value){
    return(value === [] || value === "" || value === null || value === undefined);

}


/* validators */

sketchui.validators = {};

sketchui.validators.integer = (function(){

    var self={};
    self.validate = function(value){
        var intRegex = /^\d+$/;
        if(!intRegex.test(value)){
            throw {name:'ValidationError', message:'Could not convert ' + value + ' to integer'}
        }
    }
    
    return self;
    
})();

sketchui.validators.float = (function(){

    var self={};
    self.validate = function(value){
        var valid = (!(isNaN(parseFloat(value)));
        if(!valid){
            throw {name:'ValidationError', message:'Could not convert ' + value + ' to float'}
        }
    }
    
    return self;
    
})();


sketchui.validators.json = (function(){

    var self={};
    self.validate = function(value){
        try {   
            JSON.parse(value); 
            return true 
        } catch(err){
            throw {name:'ValidationError', message:'Could not convert ' + value + ' to json'}
        }
    }
    
    return self;
    
})();


sketchui.validators.notEmpty = (function(){

    var self={};
    self.validate = function(value){
        if(sketchui.isEmpty(value)){
            throw {name:'ValidationError', message:'cannot be empty, is:' + value}
        }
        return true;
    }
    return self;
    
})();

/* Field types */
sketchui.fieldtypes = {};
sketchui.fieldtypes.base = function(typeName){
    if(!typeName){
        throw {name : 'TypeError', message: 'You must pass in a typeName'};
    }
    var self={};
    self.typeName = typeName;
    self.validator = null
    self.fromValue = function(value){
        return value;
    }
    return self;
    
};

sketchui.fieldtypes.integer = (function(){

    var self = new sketchui.fieldtypes.base('integer');
    self.validator = sketchui.validators.integer;
    self.fromValue = function(value){
        return parseInt(value);
    }
    return self;
    
})();

sketchui.fieldtypes.float = (function(){

    var self = new sketchui.fieldtypes.base('float');
    self.validator = sketchui.validators.float;
    self.fromValue = function(value){
        return parseFloat(value);
    }
    return self;
    
})();


/* Blocks */

sketchui.Block = function(options){
    
    
    var self=this;
    self.register = null;
    self.oid = options.oid || sketchjs.generateOid('block');
    
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
    self.errors = ko.observableArray([]);
    self.inputErrors = ko.observableArray([]);
    
    self.allErrors = ko.computed(function(){
        return self.errors().concat(self.inputErrors);
    
    });
    
    
    
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
        self.inputObservables[inp.name] = ko.observable(inp.defaultValue || '');
        
        self.inputObservables[inp.name].subscribe(function(newV){
            self.dirty(true);
        });
        
        self.inputMeta[inp.name] = inp;
    
    }
    
    
    self.repaint = function(){
        jsPlumb.repaint(self.oid);
    };
    
     
    self.setClean = function(){
        self.errors([]);
        self.inputErrors([]);
        self.dirty(false);
    };
    

    self.readResponseCollection = function(response){
        
        if(response.errors !=null && response.errors.length){
              self.errors([response.errors]);
        } else if(false && response.errors instanceof Array && response.errors.length) {
                    console.log(2);
              self.errors(response.errors);        
        } else {
            if(response.collection_out){
                self.results(response.collection_out);  
            } else {
                self.results(null);  
            }
          
          self.setClean();
        }
      };
      
      
    self.readResponseRecords = function(response){
        if(response.errors instanceof String && response.errors.length){
              self.errors([response.errors]);
        } else if(response.errors instanceof Array && response.errors.length) {
              self.errors(response.errors);        
        } else {
          self.results(response.results);
          self.setClean();
        }
      };
    
    
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
        
        self.errors.subscribe(function(newValue){
            self.repaint();
        });
        self.inputErrors.subscribe(function(newValue){
            self.repaint();
        });
        
        
        
        return self;
    
    };
    
    
    self.minimize = function(){
        self.minimized(true);
        jsPlumb.repaint(self.oid);
    };
    
    self.maximize = function(){
        self.minimized(false);
        jsPlumb.repaint(self.oid);
    };

    
    self.inputsArgs = ko.computed(
        
        function(){
        
            var out = {};
            self.inputErrors([]);
            for(var i in self.inputObservables){
                var obs = self.inputObservables[i];
                var value = obs();
                
                //validate input here
                var noValue = sketchui.isEmpty(value);
                if(self.inputMeta[i].required){
                    try{
                        sketchui.validators.notEmpty.validate(value);
                    } catch(err){ 
                        self.inputErrors.push(i + ": " + err.message);
                        break;
                    }
                }
                if(!noValue && self.inputMeta[i].validators){
                    var validators = self.inputMeta[i].validators;
                    
                    for(var j=0,n=validators.length; j<n;j++){
                        var validator = validators[j];
                        console.log("v", validator);
                        try{
                            validator.validate(value);
                        
                        } catch(err){
                        
                            self.inputErrors.push(i + ": " + err.message);
                            break;
                        }
                        
                    }
                }
                
                var meta = self.inputMeta[i];
                out[i] = value;
            }
            return out;
        }
    );
    
    
    self.run = function(){
        
        var inputArgs = self.inputsArgs();
        
        if(self.processor instanceof Function){
            if(!self.inputErrors().length){
                self.setClean();
                self.processor(inputArgs, self);
            }
        };
        
        if(self.visualize instanceof Function){
            if(!self.allErrors().length){
                self.visualize(inputArgs, self);
            }
        };
        
    
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
           connectorStyle:{ strokeStyle:sourceColor, lineWidth:8 },
           connector: ["Bezier", { curviness: 150 }],
           maxConnections:10,
           connectionsDetachable : true,
           anchor:"TopCenter",
           
       };
       
       var output = self.output;
       var opts = { anchor:"BottomCenter" };
       self.outEndpoints[output.name] = jsPlumb.addEndpoint(self.containerElement,  opts, sourceEndpoint);
       self.outEndpoints[output.name].setLabel({ location:[0.5, 0.5], label:output.name, cssClass:"endpointTargetLabel" });
    
    };
    
    
    self.generateInEndpoints = function(){
    
        
       var targetColor = "#bbbddd";
       var targetEndpoint = {
           endpoint:["Dot", { radius:16 }],
           paintStyle:{ fillStyle:targetColor},
           isTarget:true,
           connectorStyle:{ },
           connector: ["Bezier", { curviness:150 } ],
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
            var opts = { anchors:"AutoDefault",};
            self.inEndpoints[inp.name] = jsPlumb.addEndpoint(self.containerElement,  opts, targetEndpoint);
            self.inEndpoints[inp.name].setLabel({ label: inp.name, cssClass:"endpointSourceLabel" });
            
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
        
        out.obj.inputObservables = {};
        for(var i in self.inputObservables){
            if(self.inputMeta[i]['type'] != 'objects_list'){
                out.obj.inputObservables[i] = self.inputObservables[i]();
            }
        };
        
        //out.obj.results = self.results();
        out.obj.dirty = self.dirty();
        
        out.view.offset = $(self.selector).offset();
        out.view.minimized = self.minimized();
        return out;
        
    };
    
    
    //garbage collection
    self.getReferencedCollections = function(){
        
        var collections = [];
        
        for(var i=0;i<self.numInputs; i++){
            var inp = self.inputs[i];
            if(inp.type == 'collection_name'){
                var value = self.inputObservables[inp.name](); 
                if(value !== undefined && value !== null){
                    collections.push(value);
                }
            }
    
        }
        
        if(self.output.type == 'collection_name'){
                var value = self.results(); 
                if(value !== undefined && value !== null){
                    collections.push(value);
                }
            }
        
        return collections;
    
    };
    
    
    return self;
    
};



sketchui.QueryBlock = function(opts){

    var opts = opts || {};
    var options = { className : 'QueryBlock', oid: opts.oid};
    var self = this;
    
    options.name = "Mongo Query";
    options.inputs = [
        { 'name' : 'collection', type : 'collection_name', connectable: true, required:true },
        { 'name' : 'querystring', type : 'textarea',  validators : [sketchui.validators.json] },        
        { 'name' : 'formatterEnabled', type : 'boolean', defaultValue : false },        
        { 'name' : 'formatter', type : 'text' },        
    ];
    
    options.output = { name : 'results', type : 'collection_name'};
    
    self = new sketchui.Block(options);
    self.preview = ko.observable();
    
    self.templateUrl = '/static/ui/block-templates/query.html';
    self.processor = function(inputArgs, context){
    
        var dropCollection = self.results() || null;
        var formatter = self.inputObservables['formatterEnabled']() ? inputArgs.formatter : '';
        self.dirty(true);
        
        //just skipping the query if there is not query or formatter    
        if(!inputArgs.querystring && !formatter){
             context.results(inputArgs.collection);   
             self.setClean();
        } else {      
           
           // commented version with objects
           /*
            sketchui.sketch.objects({ }, inputArgs.collection, { query: inputArgs.querystring, formatter: formatter, write_collection:true, drop_collection:dropCollection, limit:1000 }, function(response){
               context.results(response.collection_out);
               self.dirty(false);
           });
          */
          
          var mapOperationsData = [];
          if (formatter){
            mapOperationsData.push({ 'name' : 'formatters.' + formatter});
          };
            
          sketchui.sketch.operation('mongo', 
                                { 'collection_name' : inputArgs.collection, 'query_dict':inputArgs.querystring || {} },
                                mapOperationsData,
                                [],
                                { success : context.readResponseCollection
                                    
                                });
        }
           
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
    
    self.inputObservables['formatterEnabled'].subscribe(function(newValue){
        jsPlumb.repaint(self.oid);
    });
    
    
    
    //init code
    
    //self.formatterEnabled = ko.observable(false);
    
    self.formatters = ko.observableArray();
    sketchui.sketch.getFormattersInfo(function(response){
        self.formatters(response.results);
    
    }, { async:false });
    
    self.availableCollections = ko.observableArray();
    sketchui.sketch.getDbInfo({ async:false }, function(response){
               self.availableCollections(response.results);
    });
    
    
    return self;

};


sketchui.DbInfoBlock = function(opts){

    var opts = opts || {};
    var options = { className : 'DbInfoBlock', oid : opts.oid };
    var self = this;
    
    options.name = "Db Info";
    options.inputs = [];
    options.output = { name : 'results', type : 'objects_list'};
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/dbinfo.html';
    self.processor = function(inputArgs, context){
    
        sketchui.sketch.getDbInfo({ async:false }, function(response){
               context.results(response.results);
               self.dirty(false);
            });
    };
    
    return self;

};





sketchui.ListBlock = function(opts){

    var opts = opts || {};
    var options = { className : 'ListBlock', oid: opts.oid };
    var self = this;
    
    options.name = "List";
    options.inputs = [{ name : 'in_collection', type : 'collection_name', connectable: true}];
    options.output = { name : 'results', type : 'objects_list'};
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/listblock.html';
    
    
    self.visualize = function(){
    
    
    };
    
    self.inputObservables['in_collection'].subscribe(function(newValue){
        var inputType = self.inConnectionsMeta['in_collection']['field']['type']; 
        if(inputType == 'collection_name'){
            self.readRecords(newValue);
        }
        if(inputType == 'objects_list'){
            self.results(newValue);
        }
        
        
    });
    
    
    self.readRecords = function(collectionName){
        if(collectionName){
            sketchui.sketch.objects({}, collectionName, {  }, self.readResponseRecords);
        } else {
            self.results([]);
        }
    };
    

    return self;

};



sketchui.MapBlock = function(opts){

    var opts = opts || {};
    var options = { className : 'MapBlock', oid: opts.oid };
    var self = this;
    
    options.name = "Map";
    options.inputs = [{ name : 'in_collection', type : 'collection_name', connectable: true}];
    options.output = { name : 'results', type : 'objects_list'};
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/map.html';
    
    
    self.inputObservables['in_collection'].subscribe(function(newValue){
        var inputType = self.inConnectionsMeta['in_collection']['field']['type']; 
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
        console.log("wwW", newValue);
        if(self.geojson_layer){
            self.map.removeLayer(self.geojson_layer);
        }
        self.addLayer(newValue);
    });
    
    
    self.map = null;
    self.mapOid = "map"+self.oid;
    
    

    return self;

}



sketchui.WordCloudBlock = function(opts){

    var opts = opts || {};
    var options = { className : 'WordCloudBlock', oid:opts.oid };
    var self = this;
    
    options.name = "D3 Word Cloud";
    options.inputs = [
        { name : 'in_collection', type : 'collection_name', connectable: true},
        //{ name : 'in_words', type : 'collection_name', connectable: true},
        { name : 'text_field', type : 'text', connectable: false, required:true},
        { name : 'min_length', type : 'text', connectable: false, defaultValue : 3},
        
    
    ];
    options.output = { name : 'results', type : 'objects_list'};
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/wordcloud.html';
    
    
    self.inputObservables['in_collection'].subscribe(function(newValue){
        var inputType = self.inConnectionsMeta['in_collection']['field']['type']; 
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
    
    
    self.renderCloud = function(){
        
        if(!self.words().length){
            return;
        }
    
        self.dirty(true);
        $("#"+self.cloudOid).html('');
         
        
        var fill = d3.scale.category20();
        
        d3.layout.cloud().size([500, 300])
          .words(self.words().map(function(d) {
            return {text: d, size: 10 + Math.random() * 90};
          }))
          .rotate(function() { return ~~(Math.random() * 2) * 90; })
          .font("Impact")
          .fontSize(function(d) { return d.size; })
          .on("end", draw)
          .start();

        self.dirty(false);

    
      function draw(words) {
        d3.select($("#"+self.cloudOid)[0]).append("svg")
            .attr("width", 500)
            .attr("height", 300)
          .append("g")
            .attr("transform", "translate(250,150)")
          .selectAll("text")
            .data(words)
          .enter().append("text")
            .style("font-size", function(d) { return d.size + "px"; })
            .style("font-family", "Impact")
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; });
      }
        
    
    };


    self.postRender = function(){
    
        self.renderCloud();
    
    };
     
    
    self.results.subscribe(function(newValue){
        var textField = self.inputObservables['text_field']();
         if(!textField){
            console.log("no text field set");
            return
        }
         self.words([]);
         for(var i=0,n=newValue.length; i<n; i++){
            res = newValue[i];
            text = res[textField];
            var pieces = text.split(" ");
            for(var j=0,m=pieces.length;j<m;j++){
                var p = pieces[j];
                if(p.length > parseInt(self.inputObservables['min_length']())){
                    self.words.push(p);
                }
            }
            
        
        }
        self.renderCloud();
    });
    

    self.cloudOid = "cloud"+self.oid;
    self.words = ko.observableArray(["Hello", "world", "normally", "you", "want", "more", "words", "than", "this"]
    );

    return self;

}



sketchui.ItemListBlock = function(opts){
    
    var opts = opts || {};
    var options = { className : 'ItemListBlock', oid:opts.oid  };
    var self = this;
    
    
    options.name = "Item View";
    options.inputs = [{ name : 'in_collection', type : 'collection_name', connectable: true}];
    options.output = { name : 'results', type : 'object'};
    
    self = new sketchui.Block(options);
    
    self.currentIndex = ko.observable(null);
    self.currentItem = ko.observable(null);

   
    self.inputObservables['in_collection'].subscribe(function(newValue){

        self.dirty(true);
        var inputType = self.inConnectionsMeta['in_collection']['field']['type']; 
        if(inputType == 'collection_name'){
               sketchui.sketch.objects({}, newValue, { limit: 1 }, function(response){
                console.log("r", response);
               self.currentIndex(0);
               self.currentItem(response.results[0]);
           });
        }
        if(inputType == 'objects_list'){
            self.currentIndex(0);
            self.currentItem(newValue[0]);
        }
        self.dirty(false)
        
    });
    
    /*
    self.currentIndex.subscribe(function(newValue){
      
    });
    */
    
    self.templateUrl = '/static/ui/block-templates/itemlistblock.html';
    
    
    self.currentItem.subscribe(function(newValue){
        $('#'+self.jsonDivOid).empty();
        $('#'+self.jsonDivOid).jsonView(newValue, {"status": "close"});
        jsPlumb.repaint(self.oid);
    });
    
    self.jsonDivOid = "jsonDiv" + self.oid;
    
    return self;

}




sketchui.WordCountBlock = function(opts){
    
    var opts = opts || {};
    var options = { className : 'WordCountBlock', oid:opts.oid  };
    var self = this;
    
    
    options.name = "Word count";
    options.inputs = [{ name : 'in_collection', type : 'collection_name', connectable: true, required: true},
        { name : 'field_name', type : 'text', connectable: false, defaultValue : 'text', required: true},
        { name : 'num_words', type : 'integer', connectable: false, defaultValue : 20, required:true, validators:[sketchui.validators.integer]},
        { name : 'min_length', type : 'integer', connectable: false, defaultValue : 4, required:true, validators:[sketchui.validators.integer]}
        
    ];

    options.output = { name : 'results', type : 'collection_name'};
    
    self = new sketchui.Block(options);
    
    self.inputObservables['in_collection'].subscribe(function(newValue){

        self.dirty(true);
        //self.dirty(false)
        
    });
    
  
    
    self.templateUrl = '/static/ui/block-templates/wordcount.html';
   
   
    self.processor = function(inputArgs, context){
     
          var reduceOperationsData = [];
         
         reduceOperationsData.push(
            { 'name' : 'processors.frequentWords', 
              'arguments': { num_words : parseInt(inputArgs.num_words), 
                             text_field:inputArgs.field_name,
                             min_length:parseInt(inputArgs.min_length),
                            }
              
            });
         
            
          sketchui.sketch.operation('mongo', 
                                { 'collection_name' : inputArgs.in_collection },
                                [],
                                reduceOperationsData,
                                { success : function(response){
                                        console.log("eee", response);
                                       context.results(response.collection_out);
                                       self.dirty(false);
                                    }
                                    
                                });
    
           
    };
    
    return self;

}




sketchui.TwitterSourceBlock = function(opts){

    var opts = opts || {};
    var options = { className : 'TwitterSourceBlock', oid: opts.oid};
    var self = this;
    
    options.name = "Twitter API Query";
    options.inputs = [
        { 'name' : 'q', type : 'text' },        
        { 'name' : 'formatterEnabled', type : 'boolean', defaultValue : false },        
        { 'name' : 'formatter', type : 'text' },        
    ];
    
    options.output = { name : 'results', type : 'collection_name'};
    
    self = new sketchui.Block(options);
    self.preview = ko.observable();
    
    self.templateUrl = '/static/ui/block-templates/twitterapi.html';
    self.processor = function(inputArgs, context){
    
        var dropCollection = self.results() || null;
        var formatter = self.inputObservables['formatterEnabled']() ? inputArgs.formatter : '';
        self.dirty(true);
        
        var mapOperationsData = [];
        if (formatter){
          mapOperationsData.push({ 'name' : 'formatters.' + formatter});
        };
          
        sketchui.sketch.operation('twitter', 
                              { 'q' : inputArgs.q },
                              mapOperationsData,
                              [],
                              { success : function(response){
                                     context.results(response.collection_out);
                                     self.dirty(false);
                                  }
                                  
                              });
     
           
    };
    
    
    self.inputObservables['formatter'].subscribe(function(newValue){
        jsPlumb.repaint(self.oid);
    });
    
    
    self.formatters = ko.observableArray();
    sketchui.sketch.getFormattersInfo(function(response){
        self.formatters(response.results);
    
    }, { async:false });
    
    
    
    return self;

};












