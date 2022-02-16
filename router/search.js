var router = require("express").Router();

router.get('/',function(req, res){
   req.app.DB.collection('item').find({ 상품 : { $regex : req.query.value }}).toArray(function(err,db_res){
        res.render('searchView', { search_res : db_res });
      });
  });


  module.exports = router;
