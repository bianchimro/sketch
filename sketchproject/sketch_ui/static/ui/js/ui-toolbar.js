var sketchui = sketchui || {};

sketchui.ToolBar = function(register, canvasSelector){
    
     var self=this;
     self.register = register;
     
     self.addQuery = function(){
         var qb = self.register.addBlock(new sketchui.QueryBlock(), canvasSelector);       
     };
     
     self.addTwitter = function(){
         var tw = self.register.addBlock(new sketchui.TwitterSourceBlock(), canvasSelector);
     };
     
     
     self.addList = function(){
         var li = self.register.addBlock(new sketchui.ListBlock(), canvasSelector);
     };
     
      self.addItemList = function(){
         var db = self.register.addBlock(new sketchui.ItemListBlock(), canvasSelector);
     };
     
     self.addDbInfo = function(){
         var db = self.register.addBlock(new sketchui.DbInfoBlock(), canvasSelector);
     };
     
     self.addMap = function(){
         var db = self.register.addBlock(new sketchui.MapBlock(), canvasSelector);
     };
     
     self.addWordCloud = function(){
         var db = self.register.addBlock(new sketchui.WordCloudBlock(), canvasSelector);
     };

     self.addWordCount = function(){
         var db = self.register.addBlock(new sketchui.WordCountBlock(), canvasSelector);
     };
     
     
     
     
     
     self.zoomOut = function(){
        //not working yet;
     
     };
 
 
 };
