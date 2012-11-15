var sketchui = sketchui || {};

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
            
            targetBlock.inConnectionsMeta[targetLabel] = { field : sourceBlock.output, oid : sourceBlock.oid }
            
            
            //todo: generalize
            if(sourceBlock.results()){
                targetBlock.inputObservables[targetLabel](sourceBlock.results());
                targetBlock.dirty(false);  
            }
            targetBlock.inConnections[targetLabel] = sourceBlock.results.subscribe(function(newValue){
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
        
        
        // Placing all blocks on canvas
        for(x in serializedState.blocks){
            var data = serializedState.blocks[x];
            self.deserializeBlock(data);
        
        }
        
        // Setup connections
        for(x in serializedState.blocks){
            var data = serializedState.blocks[x];
            var targetBlock = self.blocks[data.obj.oid];
            var meta = data.obj.inConnectionsMeta;
            for(var in_field in meta){

                var m = meta[in_field];
                var source = m.oid;
                var sourceBlock = self.blocks[m.oid];
                var sourceEndpoint = sourceBlock.outEndpoints[m.field.name];
                var targetEndpoint = targetBlock.inEndpoints[in_field];
               
                jsPlumb.connect({
                        source : sourceEndpoint,
                        target : targetEndpoint,
                    }
                    
                );
            }
        }
        
        
        // Populate serialized inputs and outputs
        for(x in serializedState.blocks){
            var data = serializedState.blocks[x];
            var targetBlock = self.blocks[data.obj.oid];
            var inputObservables = data.obj.inputObservables;
            for(var i in inputObservables){
                
                var value = inputObservables[i];
                console.log("value", i, value);
                targetBlock.inputObservables[i](value);
            }
            targetBlock.dirty(data.obj.dirty);
            jsPlumb.repaint(data.obj.oid);
        
        }
        
        
    
    };
    
    self.deserializeBlock = function(data){
         
        var obj = data.obj;
        var constructor = sketchui[obj.className];
        var block = new constructor({oid: obj.oid});
        
        block.minimized(data.view.minimized);
        self.addBlock(block, self.containerSelector);
        $(block.selector).offset(data.view.offset);
        
    
    };
    




};