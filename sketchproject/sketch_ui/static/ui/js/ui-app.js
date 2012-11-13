var sketchui = sketchui || {};


//Application state
sketchui.SketchApp = function(){

    var self = this;

    /* Properties */

    //the serialization name
    self.fileName = ko.observable('');
    self.fileNameProxy = ko.observable('');
    self.description = ko.observable('');
    
    self.availableFiles = ko.observableArray([]);
    
    //this flag will be used to keep track of a dirty (not saved) state
    self.isDirty = false;
    
    
    //map
    //self.map = new sketchui.Map();
    
    //timeline
    //self.timeline = new sketchui.Timeline();    
    
    //objectlist
    //self.objectlist = ko.observableArray();
    
    //sketch queries
    //self.dataLayers = ko.observableArray();
    
    
    self.toolbar = new sketchui.ToolBar();
    
    
    
    
    
    /* Methods */
    
    
    //state getter and setter
    self.getState = function(){
        var s = {'test':'state'};
        return JSON.stringify(s);
    };
    
    self.setState = function(state){
    
    };
    
    //save and load dialog show and hide
    self.saveDialog = function(){
        $('#save-dialog').modal('show');
    };
    
    self.hideSaveDialog = function(){
        $('#save-dialog').modal('hide');
    };

    self.loadDialog = function(){
        self.getStates(function(){
            $('#load-dialog').modal('show');
        });
    };
    
    self.hideLoadDialog = function(){
        $('#load-dialog').modal('hide');
    };

    
    //get available session state
    self.getStates = function(callback){
    
        $.ajax({
            url : '/ui/states/',
            type : 'get',
            dataType : 'json',
            success : function(data){
                self.availableFiles(data['results']);
                if(callback instanceof Function){
                    callback(data);
                }
            }
        
        });
    
    };
    
    //state saving
    self.saveCurrent = function(){
        if(!self.fileNameProxy()){
            return self.saveDialog();
        
        }
        return self.saveState();
    
    }
    
    self.saveState = function(){
        
        $.ajax({
            url : '/ui/state/',
            type : 'POST',
            dataType : 'json',
            data : { state_name : self.fileNameProxy(),
                     description: self.description(),
                     state : self.getState()
            },
            success : function(data){
                var res = data['results'][0];
                self.fileName(res.state_name);     
                self.fileNameProxy(res.state_name);     
                self.hideSaveDialog();
            
            },
            error : function(){
                alert("error");
            }
        
        });
    };
    
    //state loading
    self.loadState = function(){
        
        $.ajax({
            url : '/ui/state/',
            type : 'GET',
            dataType : 'json',
            data : { state_name : self.fileNameProxy(),
                    
            },
            success : function(data){
                var res = data['results'][0];
                self.fileName(res.state_name);
                self.fileNameProxy(res.state_name);
                self.description(res.description)
                self.setState(res.state);
                self.hideLoadDialog();
            
            },
            error : function(){
                alert("error");
            }
        });
    };
    
    //new state
    self.newState = function(){
    
    };
    
    
    //shortcut to set setFilenameProxy from an InterfaceState obj
    self.setFilenameProxy = function(obj){
        self.fileNameProxy(obj.state_name);
    };



};
