var router = require('express').Router();

var url = require('url');

//결제페이지
router.get('/direct/:id', function (req, res) {
    var queryData = url.parse(req.url, true).query;
    var totalpay = 0;

    req.app.DB.collection('item').find({ _id: parseInt(queryData.item) }).toArray(function (err, db_res) {
        totalpay = parseInt(db_res[0].가격) * parseInt(queryData.a);

        res.render('payView', { items: db_res, count: queryData.a, totalpay: totalpay });
    });
});

//장바구니 구매
router.get('/cart/:id', function(req, res){
    req.app.DB.collection('order').deleteOne({user : req.user.id , status : 'not'} );
  
    var totalpay = 0;
  
    var item = req.query.items.split('%'); 
  
    var id = [];
    var count = [];
    var name = [];
    var price = [];
    var img = [];
   
     for(var i = 0; i < item.length; ++i){
      if(i % 2 == 0){
          id.push(parseInt(item[i]));
      }else{
        count.push(item[i].substring(1,2));
      }
    }
  
    req.app.DB.collection('item').find({ _id : { $in : id } }).toArray(function(err,db_res){
      for(var i = 0; i < id.length; ++i){
          totalpay += db_res[i].가격 * parseInt(count[i]);
          name.push(db_res[i].상품);
          price.push(db_res[i].가격);
          img.push(db_res[i].이미지);
      }
    
      req.app.DB.collection('order').insertOne({ 
        _id :  req.params.id,
        item_id : id,
        item_name : name,
        item_price : price,
        count : count,
        totalpay : totalpay,
        imp_uid : '',
        merchant_uid : '',
        status : 'not',
        user : req.user.id
        
      }, function(err, db_res2){
        res.render('payView', {items : db_res  , totalpay : totalpay, count : count });
      });
    });
  });

//상품페이지에서 바로구매
router.post('/direct', function (req, res) {
    req.app.DB.collection('order').deleteOne({ user: req.user.id, status: "not" });
    
    req.app.DB.collection('item').findOne({ _id: parseInt(req.body.id) }, function (err, db_res) {
        req.app.DB.collection('order').insertOne(
            {
                _id: req.body.order_num,
                item_id: parseInt(req.body.id),
                item_name: db_res.상품,
                item_price: db_res.가격,
                count: req.body.count,
                totalpay: req.body.count * db_res.가격,
                imp_uid: '',
                merchant_uid: '',
                status: 'not',
                user: req.user.id
            }
        )
    })
});

//결제강제완료
router.post('/complete',function(req, res){
  console.log(req.body);
  req.app.DB.collection('order').updateOne(
    { item_id :  parseInt(req.body.item_id) , status : "not", user : req.user.id },  { $set: {
        imp_uid : req.body.imp_uid, 
        merchant_uid : req.body.merchant_uid, 
        pay_method : req.body.pay_method,
        status :  "ok"
      } 
    },
   function (err, db_res) {
     if(err) return err;

     res.send('결제완료');
  });
})

//주문완료
router.get('/order',function(req, res){
  res.render('completeView');
})

module.exports = router;