var sketchui = sketchui || {};

//sketch instance global to sketchui
sketchui.sketch = new sketchjs.Sketch("", 'sketchdb');


sketchui.notifyCollections = function(data){

    $.ajax({
            url : sketchui.sketch.url + "/ui/collections_references/",
            type : 'POST',
            dataType : 'json',
            data : data,
            success : function(response){
                //console.log("notified:", response.results);
            }
        }
    );

}


sketchui.getField = function(target, fieldSelector){
    
    var getFieldPart = function(obj,keys){
        
        if(keys.length == 1){
            console.log(1, obj[keys[0]]);
            return obj[keys[0]];
        }
        
        var subObj = obj[keys[0]];
        if(subObj === undefined || subObj === null){
            return null;
        }
        
        keys.splice(0,1);
        return getFieldPart(subObj, keys);
    
    }
    
    var keys = fieldSelector.split('.');
    return getFieldPart(target, keys);

}