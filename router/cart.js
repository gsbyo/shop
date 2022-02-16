var router = require("express").Router();

//장바구니 기본페이지
router.get('/view',  function(req, res){
    req.app.DB.collection('cart').find({ user:  req.user.id }).toArray(function (err, db_res) {
      var data = [];
      for(var i = 0; i < db_res.length; ++i){
          data.push(parseInt(db_res[i].item_id));  // 유저가 구입한 상품의 _id를 추출
      }
      req.app.DB.collection('item').find( { _id : { $in : data } }).toArray(function(err,db_res2){
       
        res.render('cartView', { basket: db_res, posts : db_res2 });
      })
  })
  })
  
  
  
  //장바구니 상품추가
  router.post('/add', function (req, res) {
    req.app.DB.collection('cart').findOne({ item_id : req.body.data.num, user : req.user.id }, function(err, db_res){
       if(db_res == null){
   
        req.app.DB.collection('cart').insertOne(
          {
            item_id: req.body.data.num,
            user: req.user.id,
            amount: req.body.data.amount
          },
          function (err, db_res2) {
              res.send('success');
          });
       }
       else{
         res.send('overlap')
       }
    });
   });
   
  
  //장바구니 -> 구매페이지로 이동
  router.get('/pay/:id', function(req, res){
  
    req.app.DB.collection('order').deleteOne({user : req.user.id , status : 'not'} );
  
    var totalpay = 0;
  
    var item = req.query.items.split('%'); 
  
    var id = [];
    var count = [];
    var name = [];
    var price = [];
    var img = [];
   
    //예를 들어 _id[0] 의 갯수 = count[0] 
     for(var i = 0; i < item.length; ++i){
      if(i % 2 == 0){
          id.push(parseInt(item[i]));
      }else{
        count.push(item[i].substring(1,2));
      }
    }
});
  

module.exports = router;