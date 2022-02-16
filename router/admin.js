var router = require("express").Router();


//edit 페이지
router.get("/edit", (req, res) => {
        res.render('editView');
        
})

//상품추가
router.post("/edit", (req, res) => {

        req.app.DB.collection('item_count').findOne({ name: '상품갯수' },
         (err, db_res) => {
      
          var item_id = db_res.item_id;
          
          for (var i = 0; i < req.body.상품.length; ++i) {
            req.app.DB.collection('item').insertOne(
              {
                _id: item_id + i,
                상품: req.body.상품[i].상품명,
                가격: req.body.상품[i].가격,
                분류: req.body.상품[i].분류,
                재고: req.body.상품[i].재고,
                이미지: req.body.상품[i].파일,
                날짜: new Date()
              },
               (err, db_res2) => {
              });
          }
    
          req.app.DB.collection('item_count').updateOne(
            { name: '상품갯수' }, { $set: { item_id: item_id+req.body.상품.length } },
             (err, db_res) => {
            });
        });
    
        res.send('전송완료');
      
})

//상품수정
router.put("/edit", (req, res) => {

  req.app.DB.collection('item').updateOne({ _id : parseInt(req.body._id) },
        { $set: { 
         상품 : req.body.상품 , 
         가격 : req.body.가격, 
         분류 : req.body.분류,
         재고 : req.body.재고,
         이미지 : req.body.이미지 
       } 
     }, (err,db_res) => {
         res.send(db_res);       
       });
   
})

//상품삭제
router.delete("/edit", (req, res) => {
  req.app.DB.collection('item').deleteOne({ _id : parseInt(req.body.item_id) } , (err,db_res) => {
                if(err) return err;
            
                res.send('success');
        });

})


router.get('/edit/search/:word', (req, res) => {
  req.app.DB.collection('item').find({ 상품 : { $regex : req.params.word } }).toArray( (err,db_res) => {
      res.send(db_res);       
    })
});


router.get('/dlvyment', (req, res) => {
  req.app.DB.collection('order').find({ status : 'ok'}).toArray((err,db_res) => {
      res.render('dlvyView', { order : db_res});
    })
  
  });
  
   //여기서는 운송장이 기입이 안되있지만 결제가 된 데이터를 가져와서
    //입력을 해서 update시킴.
 router.post('/dlvyment', (req, res) => {
  req.app.DB.collection('order').updateOne(
      { _id : req.body.order_num , status : "ok", },  { $set: {
          dlvy_num :  req.body.dlvy_num,
          status :  'dlvy_ing'
        } 
      },
      (err, db_res) => {
       if(err) return err;
  
       res.send('수정완료');
    });
  });
  
  

module.exports = router;