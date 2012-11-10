var sketchui = sketchui || {};

sketchui.Register = function(){

    
    var self=this;
    self.blocks = [];
    
    
    
    
    jsPlumb.bind("jsPlumbConnection", function(info) {
             
            var sourceLabel = info.sourceEndpoint.getLabel();
            var sourceBlock = self.blocks[info.sourceId];
            var targetLabel = info.targetEndpoint.getLabel();
            var targetBlock = self.blocks[info.targetId];
            
            //todo: generalize
            targetBlock.inputObservables[targetLabel](sourceBlock.results());
            targetBlock.inConnections[targetLabel] = sourceBlock.results.subscribe(function(newValue){
                targetBlock.inputObservables[targetLabel](newValue);        
            });
            
               
    });

    jsPlumb.bind("jsPlumbConnectionDetached", function(info) {
            
            var sourceLabel = info.sourceEndpoint.getLabel();
            var sourceBlock = self.blocks[info.sourceId];
            var targetLabel = info.targetEndpoint.getLabel();
            var targetBlock = self.blocks[info.targetId];
       
            targetBlock.inConnections[targetLabel].dispose();
               
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
        
        sketchui.register.blocks[blo.oid] = blo;
        return blo;
    
    };




};


//#todo: ensure singleton
sketchui.register = new sketchui.Register();




sketchui.Block = function(options){
    
    
    var self=this;
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
    self.outConnections = {};
    
    
    
    self.inputObservables = {};
    
    for(var i=0;i<self.numInputs; i++){
        var inp = self.inputs[i];
        self.inputObservables[inp.name] = ko.observable('');
        
        self.inputObservables[inp.name].subscribe(function(newV){
            self.dirty(true);
        });
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
            self.dirty(false);
        }
    
    };
    
    
    self._getTemplate = function(){
        //todo: cache
        $.ajax({
            url : self.templateUrl,
            type : 'GET',
            async : false,
            success : function(data){
                self.template(data);
            }
        
        });
    
    
    };
    
    self.getTemplate = function(){
        self._getTemplate();
        return self.template();
    
    };
    
    self.generateOutEndpoints = function(){
    
       if(!self.output){
        return;
       } 
       
       var sourceColor = "#ff9696";
       var sourceEndpoint = {
           endpoint:["Dot", { radius:16 }],
           paintStyle:{ fillStyle:sourceColor},
           isSource:true,
           connectorStyle:{ strokeStyle:sourceColor, lineWidth:2 },
           connector: ["Bezier", { curviness:63 } ],
           maxConnections:1,
           //isTarget:true,
           //dropOptions : targetDropOptions
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
            var opts = { anchor:"BottomCenter", label:inp.name };
            self.inEndpoints[inp.name] = jsPlumb.addEndpoint($(self.selector),  opts, targetEndpoint);
            
            
        }
    

    
    
    };
    
    
    
    self.setDraggable = function(){
    
        jsPlumb.draggable(self.oid, {
            start : function(e,u){ jsPlumb.repaint(self.oid);},
            drag : function(e,u){ jsPlumb.repaint(self.oid);},
            stop : function(e,u){ jsPlumb.repaint(self.oid);}
    
        });    

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
    options.output = { name : 'results', type : 'objlist'};
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/query.html';
    self.processor = function(inputArgs, context){
    
        var sketch = new sketchjs.Sketch("", 'sketchdb');
        sketch.objects({}, inputArgs.collection, { query: inputArgs.query }, function(response){
    
               context.results(response.results);
               
           });
    };
    
    return self;

};


sketchui.DbInfoBlock = function(){

    var options = {};
    var self = this;
    
    options.name = "dbinfo";
    options.inputs = [];
    options.output = { name : 'results', type : 'objlist'};
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/dbinfo.html';
    self.processor = function(inputArgs, context){
    
        var sketch = new sketchjs.Sketch("", 'sketchdb');
        sketch.getDbInfo({}, function(response){
               context.results(response.results);
               
            });
    };
    
    return self;

};





sketchui.ListBlock = function(){

    var options = {};
    var self = this;
    
    options.name = "listblock";
    options.inputs = [{ name : 'results', type : 'objlist', connectable: true}];
  
    
    self = new sketchui.Block(options);
    
    self.templateUrl = '/static/ui/block-templates/listblock.html';
    self.fromjson=function(data){
        return JSON.stringify(data);
    };
    
    
    return self;

}












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
    output : { name : 'results', type : 'objlist'},
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
    output : { name : 'results', type : 'objlist'},
    templateUrl : '/static/ui/block-templates/dbinfo.html',
    processor : function(inputArgs, context){
    
        var sketch = new sketchjs.Sketch("", 'sketchdb');
        sketch.getDbInfo({}, function(response){
               context.results(response.results);
               
            });
    }


};




