var PipeElement = function(processor){

    var self = this;
    self.processor = processor;
    
    self.results = ko.observable();
    self.connectors = {};
    self.listeners = {};
    self.dirty = ko.observable(true);
    
    
    self.addConnector = function(name){
        self.connectors[name] = null;
    };
    
    
    self.connectInput = function(name, element){
        var value, type;
        value = ko.observable(element);
        
        if(element instanceof PipeElement){
            type = 'pipe-element';
            self.listeners[name] = value().results.subscribe(function(){
                self.dirty(true);
            });
        } else {
            type = 'value';
            self.listeners[name] = value.subscribe(function(){
                self.dirty(true);
            });

        }

        self.connectors[name] = {value : value, type : type };
              
        
        
        
    }
    
    self.getResults = function(){
    
        var args = {};
        for(var i in self.connectors){
            var conn = self.connectors[i];
            if(conn.type == 'value'){
                args[i] = conn.value();
            } else {
                var elem = conn.value();
                var dirt = elem.dirty();
                if(dirt){
                    elem.getResults();
                }   
                args[i] = elem.results();                
            } 
        
        }
        var results = self.processor(args);
        self.results(results);
        
    
    };
    


}

var processor = function(options){
    return options.a + options.b;
};        

var processor2= function(options){
    return options.a;
}

var pipe = new PipeElement(processor);
var pipe2 = new PipeElement(processor2);



pipe.addConnector('a');
pipe.addConnector('b');
pipe2.addConnector('a');

pipe.connectInput('a', 20);
pipe.connectInput('b', pipe2);    
pipe2.connectInput('a', 30);
    
pipe.getResults();
console.log(pipe.results());

pipe2.connectInput('a', 130);
pipe.getResults();
console.log(pipe.results());


​