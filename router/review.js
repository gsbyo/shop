var router = require("express").Router();

router.get('/', function(req, res){
  req.app.DB.collection('item').find().limit(4).toArray(function(err,db_res){
      res.render('reView',{item : db_res});
    })
  })
  
  router.get('/:id',function(req, res){
    req.app.DB.collection('review').find({ item_id : req.params.id }).count(function(err,db_res){
      req.app.DB.collection('review').find({ item_id : req.params.id }).toArray(function(err,db_res2){
      res.send({totalcount : db_res, review : db_res2});       
    })
  });
  });
  
  //db review data insert 
  router.post('/', function (req, res) {
  
    req.app.DB.collection('review_count').findOne({ name: '리뷰갯수' },
      function (err, db_res) {
        var count = db_res.count;
  
        req.app.DB.collection('review').insertOne(
          {
            _id: count,
            item_id: req.body.item_id,
            이미지: req.body.img,
            제목: req.body.title,
            내용: req.body.content,
            사용자: req.user.id
          },
          function (err, db_res2) {
  
          });
  
          req.app.DB.collection('review_count').updateOne(
          { name: '리뷰갯수' }, { $inc: { count: 1 } },
          function (err, db_res) {
  
          });
      });

      res.send("전송완료");
  
  });


  module.exports = router;