var sketchui = sketchui || {};

sketchui.Register = function(){

    
    var self=this;
    self.blocks = [];
    
    
    
    
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

        var template = blo.getTemplate();
        var jTemplate = $(template);
        jTemplate.attr("id", blo.oid);
        
        $(containerSelector).append(jTemplate);
        ko.applyBindings(blo, $(blo.selector)[0]);
        blo.generateOutEndpoints();
        blo.generateInEndpoints();
        blo.setDraggable();
        
        self.blocks[blo.oid] = blo;
        blo.register = self;
        return blo;
    
    };

    self.removeBlock = function(blo){
    
        ko.cleanNode($(blo.selector)[0]);
        blo.destroy();
        delete self.blocks[blo.oid];
        jsPlumb.removeAllEndpoints($(blo.selector)[0]);
        $(blo.selector).remove();
    
    };



};


//#todo: ensure singleton
sketchui.register = new sketchui.Register();




sketchui.Block = function(options){
    
    
    var self=this;
    self.register = null;
    self.oid = sketchjs.generateOid('block');
    
    self.connectorId = "connector-" + self.oid;
    self.selector = "#"+self.oid;
    
    self.dirty = ko.observable(true);
    
    self.name = options.name;
    self.inputs = options.inputs;
    self.output = options.output;
    

    self.numInputs = self.inputs.length;
    self.processor = options.processor;
    self.templateUrl = options.templateUrl;
    
    self.results = ko.observable();    
    
    
    self.template = ko.observable("");
    
    self.inEndpoints = {};
    self.outEndpoints = {};
    
    self.inConnections = {};
    self.inConnectionsMeta = {};
    
    self.outConnections = {};
    
    
    
    self.inputObservables = {};
    self.inputMeta = {}
    
    for(var i=0;i<self.numInputs; i++){
        var inp = self.inputs[i];
        self.inputObservables[inp.name] = ko.observable('');
        
        self.inputObservables[inp.name].subscribe(function(newV){
            self.dirty(true);
        });
        
        self.inputMeta[inp.name] = inp;
    
    }
    
    
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
       
       var sourceColor = "blue";
       var sourceEndpoint = {
           endpoint:["Dot", { radius:20 }],
           paintStyle:{ fillStyle:sourceColor},
           isSource: true,
           connectorStyle:{ strokeStyle:sourceColor, lineWidth:2 },
           connector: ["Bezier"],
           overlays: [
	        	[ "Arrow", { foldback:0.2 } ],
	        	[ "Label", { cssClass:"labelClass" } ]	
	        ],
           maxConnections:10,
           anchor:"TopCenter"
       };
       
       var output = self.output;
       var opts = { anchor:"BottomCenter", label:output.name };
       self.outEndpoints[output.name] = jsPlumb.addEndpoint($(self.selector),  opts, sourceEndpoint);
       
    
    };
    
    self.generateInEndpoints = function(){
    
        
       var targetColor = "red";
       var targetEndpoint = {
           endpoint:["Dot", { radius:16 }],
           paintStyle:{ fillStyle:targetColor},
           isTarget:true,
           connectorStyle:{ strokeStyle:targetColor, lineWidth:2 },
           connector: ["Bezier", { curviness:63 } ],
           maxConnections:1,
           //isTarget:true,
           //dropOptions : targetDropOptions
       };
       
       for(var i=0;i<self.numInputs; i++){
            var inp = self.inputs[i];
            if(!inp.connectable){
                continue;
            }
            var opts = { anchors:"TopCenter", label:inp.name };
            self.inEndpoints[inp.name] = jsPlumb.addEndpoint($(self.selector),  opts, targetEndpoint);
            
            
        }
    

    
    
    };
    
    
    
    self.setDraggable = function(){
    
        jsPlumb.draggable(self.oid, {
            //start : function(e,u){ jsPlumb.repaint(self.oid);},
            //drag : function(e,u){ jsPlumb.repaint(self.oid);},
            //stop : function(e,u){ jsPlumb.repaint(self.oid);}
    
        });    

    };
    
    self.remove = function(){
        return self.register.removeBlock(self);
    
    };
    
    
    self.destroy = function(){
        console.log("whe should dispose all notifications here ... and also remove all connections");
    
    };
    
    

    return self;
    
    

};



sketchui.QueryBlock = function(){

    var options = {};
    var self = this;
    
    options.name = "query";
    options.inputs = [
        { 'name' : 'collection', type : 'text' },
        { 'name' : 'querystring', type : 'textarea' },        
    ];
    options.output = { name : 'results', type : 'collection_name'};
    
    self = new sketchui.Block(options);
    self.preview = ko.observable();
    
    self.templateUrl = '/static/ui/block-templates/query.html';
    self.processor = function(inputArgs, context){
    
        var sketch = new sketchjs.Sketch("", 'sketchdb');
        var dropCollection = self.results() || null;
        self.dirty(true);
        sketch.objects({}, inputArgs.collection, { query: inputArgs.query, write_collection:true, drop_collection:dropCollection }, function(response){
               context.results(response.collection_out);
               self.dirty(false);
           });
    };
    
    
    self.getPreview = function(){
        if(! self.dirty()){
            var collectionName = self.results();
            var sketch = new sketchjs.Sketch("", 'sketchdb');
            sketch.objects({}, collectionName, { limit: 10}, function(response){
               self.preview(response.results);
           })
        
        }
    };
    
    self.dirty.subscribe(function(newValue){
        self.preview(null);
    });
    
    return self;

};


sketchui.DbInfoBlock = function(){

    var options = {};
    var self = this;
    
    options.name = "dbinfo";
    options.inputs = [];
    options.output = { name : 'results', type : 'objects_list'};
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/dbinfo.html';
    self.processor = function(inputArgs, context){
    
        var sketch = new sketchjs.Sketch("", 'sketchdb');
        sketch.getDbInfo({}, function(response){
               context.results(response.results);
               self.dirty(false);
            });
    };
    
    return self;

};





sketchui.ListBlock = function(){

    var options = {};
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
    
        var sketch = new sketchjs.Sketch("", 'sketchdb');
        sketch.objects({}, collectionName, {  }, function(response){
               self.results(response.results);
               self.dirty(false);
           });
    };
    
    
    
    
    return self;

}


sketchui.ItemListBlock = function(){

    var options = {};
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





sketchui.ToolBar = function(){
 
     var self=this;
     self.addQuery = function(){
         var qb = sketchui.register.addBlock(new sketchui.QueryBlock(), '#blocks-canvas');       
     };
     self.addList = function(){
         var li = sketchui.register.addBlock(new sketchui.ListBlock(), '#blocks-canvas');
     };
     
      self.addItemList = function(){
         var db = sketchui.register.addBlock(new sketchui.ItemListBlock(), '#blocks-canvas');
     };
     
     self.addDbInfo = function(){
         var db = sketchui.register.addBlock(new sketchui.DbInfoBlock(), '#blocks-canvas');
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
    
        var sketch = new sketchjs.Sketch("", 'sketchdb');
        sketch.objects({}, inputArgs.collection, { query: inputArgs.query }, function(response){
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
    
        var sketch = new sketchjs.Sketch("", 'sketchdb');
        sketch.getDbInfo({}, function(response){
               context.results(response.results);
               
            });
    }


};




