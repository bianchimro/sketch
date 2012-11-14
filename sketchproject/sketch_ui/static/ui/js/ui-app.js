var sketchui = sketchui || {};


//Application state
sketchui.SketchApp = function(){

    var self = this;

    
    self.oid = ko.observable(sketchjs.generateOid());
    self.oidProxy = ko.observable(self.oid);
    
    self.temporary = ko.observable(false);
    
    self.fileName = ko.observable('');
    self.fileNameProxy = ko.observable('');
    
    self.description = ko.observable('');
    
    self.saveLoopHandler = null;
    
    
    self.availableFiles = ko.observableArray([]);
    
    //this flag will be used to keep track of a dirty (not saved) state
    self.isDirty = false;
    
    
    self.register  = new sketchui.Register({containerSelector : "#blocks-canvas" });
    self.toolbar = new sketchui.ToolBar(self.register, "#blocks-canvas");
    
    //inteface options
    self.uiOptions = {};
    self.canvasBackgrounds = ko.observableArray([]);
    var currentBackground = 'old_mathematics.png';
    self.canvasBackground = ko.observable();
    
    $.ajax({
            url : '/ui/backgrounds/',
            type : 'get',
            async : false,
            dataType : 'json',
            success : function(data){
                self.canvasBackgrounds(data['results']);
            }
        
        });

    self.canvasBackground(currentBackground);    
    
    self.canvasBackground.subscribe(function(newValue){
        var v = "url('/static/ui/backgrounds/" +newValue + "')";
        console.log(newValue, "x", v);
        $("#blocks-canvas").css('background-image', v);
   
    });

    


    /* Methods */
    
    
    //state getter and setter
    self.getState = function(){
        var s = self.register.serialize();
        return JSON.stringify(s);
    };
    
    self.setState = function(state){

        self.register.resetBlocks();
        self.register.deserialize(state);
        //a good idea here would be destroying and re-instantiating the register;
        
    
    };
    
    //save and load dialog show and hide
    self.saveDialog = function(){
        $('#save-dialog').modal('show');
    };
    
    //#TODO: this is messy
    self.saveDialogAs = function(){
        $('#save-dialog').modal('show');
        self.oidProxy(sketch.generateOid());
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
        return self.saveState(self.hideSaveDialog);
    
    }
    
    self.saveState = function(callback){
    
        if(self.fileNameProxy()){
            self.temporary(false);
        }
        
        $.ajax({
            url : '/ui/state/',
            type : 'POST',
            dataType : 'json',
            data : { 
                     oid : self.oidProxy(),
                     state_name : self.fileNameProxy(),
                     description: self.description(),
                     state : self.getState(),
                     temporary : self.temporary()
            },
            success : function(data){
                var res = data['results'][0];
                
                self.oid(res.oid);
                self.oidProxy(res.oid);
                
                if(res.state_name){
                    self.fileName(res.state_name);     
                    self.fileNameProxy(res.state_name); 
                    self.temporary(res.temporary);
                }
                if (callback instanceof Function){
                    callback();
                }    
            
            },
            error : function(){
                alert("error");
            }
        
        });
    };
    
    
    self.saveAndHideDialog = function(){ 
        self.stopSaveLoop();
        self.saveState(self.hideSaveDialog);
        self.startSaveLoop();
    }
    
    self.loadAndHideDialog = function(){
        
        self.stopSaveLoop();
        self.loadState(self.hideLoadDialog);
        self.startSaveLoop();
        
    };
    
    
    
    //state loading
    self.loadState = function(callback){
        
        $.ajax({
            url : '/ui/state/',
            type : 'GET',
            dataType : 'json',
            data : { oid : self.oidProxy(),
                    
                },
                
            success : function(data){

                var res = data['results'][0];
                console.log(res);
                self.fileName(res.state_name);
                self.oid(res.oid);
                self.oidProxy(res.oid);
                
                self.fileNameProxy(res.state_name);
                self.description(res.description)
                self.setState(res.state);
                self.temporary(res.temporary);
                
                if (callback instanceof Function){
                    callback();
                } 
                //move to callback
                self.hideLoadDialog();
            
            },
            error : function(){
                alert("error");
            }
        });
    };
    
    //new state
    self.newState = function(){
        self.setState({});
        self.oid(sketchjs.generateOid());
        self.oidProxy(self.oid());
        self.fileNameProxy('');
        self.fileName('');
        self.description('');
    };
    
    
    //shortcut to set setFilenameProxy from an InterfaceState obj
    self.setFilenameProxy = function(obj){
        self.fileNameProxy(obj.state_name);
        self.oidProxy(obj.oid);
    };
    
    
    
    self.startSaveLoop = function(){
        if(!self.saveLoopHandler){
            self.saveLoopHandler = setInterval(self.saveState, 14000);
        }
    
    };
    
    self.stopSaveLoop = function(){
        if(self.saveLoopHandler){
            window.clearInterval(self.saveLoopHandler);
            self.saveLoopHandler = null;
        }
    };
    
    
    self.init = function(){
        
        self.startSaveLoop();
    
    };
    
    
    /* init code */
    self.init();



};
