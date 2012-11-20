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