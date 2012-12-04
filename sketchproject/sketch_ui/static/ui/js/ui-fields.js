var sketchui = sketchui || {};

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
        var notValid = isNaN(parseFloat(value));
        if(notValid){
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