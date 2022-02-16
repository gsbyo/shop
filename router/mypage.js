var router = require("express").Router();

router .get('/order',  function(req, res){
    
  req.app.DB.collection('order').find( {status : { $in : ['ok','dlvy_ing', 'vbank_ready']  }, user : req.user.id } ).toArray(function(err,db_res){
    var item_id = [];
    var imgs = [];
    var img;
    db_res.forEach(element => {
      if(element.item_id.length > 1){
        item_id.push(...element.item_id);
      }
      item_id.push(element.item_id);
    });
  
    req.app.DB.collection('item').find({_id : {$in : item_id}}).toArray(function(err, db_res2){
      res.render('mypageView',{ order : db_res, item : db_res2 });
  
    })
  
   
    });
  });

  module.exports = router;
   
  
  
 