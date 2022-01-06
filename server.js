const express = require('express');
const axios = require('axios');
const app = express();

const helmet = require("helmet");

require('dotenv').config();

app.set('view engine', 'ejs');



const bodyParser= require('body-parser')
app.use(bodyParser.urlencoded({extended: true})) 

app.use('/public', express.static(__dirname + '/public'))


app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

var url = require('url');

//login
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');


app.use(session({
  secret : 'secretcode', 
  resave : false, 
  saveUninitialized: false,

}));

app.use(passport.initialize());
app.use(passport.session()); 

passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (input_id, input_pw, done) {
  db.collection('login').findOne({ id: input_id }, function (err, res) {
    if (err) return done(err)

    if (!res) return done(null, false, { message: '존재하지않는 아이디입니다' })
    if (input_pw == res.pw) {
      return done(null, res)
    } else {
      return done(null, false, { message: '비밀번호를 다시 확인해주세요.' })
    }
  })
}));

passport.serializeUser(function (user, done) {
  done(null, user.id)
});

passport.deserializeUser(function (input_id, done) {
  db.collection('login').findOne({ id: input_id }, function (err, res) {
    done(null, res)
  })
}); 


function login_check(req, res, next) {
  if (req.user) {
   next();
   
 
  } else {
    
    res.render('loginView');
  }
}


//mongodb
const MongoClient = require('mongodb').MongoClient;
var db;

MongoClient.connect(process.env.DB_URL, function(err, client){
    if (err) return console.log(err);
    db = client.db('List');


    app.listen(process.env.PORT, '127.0.0.1', function(){
      console.log('listening on 3000')
    });
})







//multer
let multer = require('multer');
var storage = multer.diskStorage({

  destination : function(req, file, cb){
    var dir = req.params.path;
    var dir2 = req.params.path2;

    cb(null, './public/image/'+dir+'/'+dir2);
  },
  filename : function(req, file, cb){
    cb(null, file.originalname )
  }

});

var upload = multer({storage : storage});

var path = require('path');
const { Int32 } = require('bson');
const { urlencoded } = require('body-parser');
const e = require('express');
const { ESRCH } = require('constants');
const { application } = require('express');
const { MongoDBStore } = require('connect-mongodb-session');
const { List } = require('iamport-rest-client-nodejs/dist/response');


var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
      var ext = path.extname(file.originalname);
      if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.PNG' && ext !== '.JPG') {
          return callback(new Error('PNG, JPG만 업로드하세요'))
      }
      callback(null, true)
  },
  limits:{
      fileSize: 1024 * 1024
  }
});



//로그인
app.get('/login',  function(req, res){
  if(req.user){
    res.render('loginView');
   
 }else{
    res.render('loginView');
    
  }   
});



app.get('/fail', function(req, res){

})


app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/home');
});

//홈 화면
app.get('/home', function (req, res) {
  db.collection('item').find().limit(4).toArray(function (err, db_res) {
      if(req.user){
        res.render('homeView',{ posts : db_res, 사용자 : req.user.id });
      }
      else{
        res.render('homeView',{ posts : db_res, 사용자 : null });
      }
    });
})

//Query 따라서 나타내는 상품을 나열하는 방식이 다름.
app.get('/items/list', function (req, res) {
  var toltalcount = 0; // 상품의 총 갯수
  var view_count = 8; // 한번에 나타낼 상품의 갯수

  if(req.query.way == 'new'){
    db.collection('item').count(function (err, db_res) {
      toltalcount = db_res;
      db.collection('item').find().sort({ _id : 1 }).limit(view_count).toArray(
        function (err, db_res2) {
          

        if(req.user){
          res.render('listView',{ posts: db_res2 , totalcount : toltalcount, 사용자 : req.user.id});
        }else{
          res.render('listView',{ posts: db_res2 , totalcount : toltalcount, 사용자 : null});
        }
      });
   });
  }else{

    db.collection('item').count(function (err, db_res) {
      toltalcount = db_res;
      db.collection('item').find().sort({_id : -1}).limit(view_count).toArray(
        function (err, db_res2) {

        if(req.user){
          res.render('listView',{ posts: db_res2 , totalcount : toltalcount, 사용자 : req.user.id});
        }else{
          res.render('listView',{ posts: db_res2 , totalcount : toltalcount, 사용자 : null});
        }
      });
    });
  }
});



app.get('/items/list/new/:id', function (req, res) {
    
  if( req.params.id == 1) return res.status(404).send();
    
  
  var totalcount = 0;
  var view_count = 8;

  db.collection('item').count(function (err, db_res) {
    totalcount  = db_res;

    if( Math.ceil(totalcount / view_count) < req.params.id) return res.status(404).send();

    db.collection('item').find().sort({_id : 1}).limit(view_count).skip(view_count * (req.params.id - 1)).toArray(
      function (err, db_res2) {

      if(req.user){
        res.render('listView',{ posts: db_res2, totalcount : totalcount , 사용자 : req.user.id });
      }else{
        res.render('listView',{ posts: db_res2, totalcount : totalcount , 사용자 : null});
      }
    });
  });
});

app.get('/items/list/best/:id', function (req, res) {

  if( req.params.id == 1) return res.status(404).send();

  var totalcount = 0;
  var view_count = 8;
  db.collection('item').count(function (err, db_res) {
    totalcount = db_res;

    if( Math.ceil(totalcount / view_count) < req.params.id) return res.status(404).send();

    db.collection('item').find().sort({_id : -1}).limit(view_count).skip(view_count * (req.params.id - 1)).toArray(
      function (err, db_res2) {
      
      if(req.user){
        res.render('listView',{ posts: db_res2 , totalcount : totalcount , 사용자 : req.user.id });
      }else{
        res.render('listView',{ posts: db_res2 , totalcount : totalcount , 사용자 : null});
      }
    });
  });
});


//상품 구매페이지
app.get('/items/detail/:id', function (req, res) {
  db.collection('item').findOne({ _id : parseInt(req.query.itemid)},function(err, db_res){

    if(db_res == null) return res.status(404).send();   

    if(req.user){
      res.render('productView', {post : db_res, 사용자: req.user.id});
    }else{
      res.render('productView', {post : db_res, 사용자: null});
    }
  
  });
});



//상품 추가 
app.get('/new', function (req, res) {
    res.render('addView')
});

app.post('/new', function (req, res) {
  res.send("성공");
});

app.post('/add_img/:path/:path2', upload.array('imgfile[]'), function (req, res) {
   res.redirect('/new')
});

app.post('/add_item', function (req, res) {

  db.collection('item_count').findOne({ name: '상품갯수' },
    function (err, db_res) {
  
      var item_id = db_res.item_id;
      
      for (var i = 0; i < req.body.상품.length; ++i) {
        db.collection('item').insertOne(
          {
            _id: item_id + i,
            상품: req.body.상품[i].상품명,
            가격: req.body.상품[i].가격,
            분류: req.body.상품[i].분류,
            재고: req.body.상품[i].재고,
            이미지: req.body.상품[i].파일,
            날짜: new Date()
          },
          function (err, db_res2) {
          });
      }

      db.collection('item_count').updateOne(
        { name: '상품갯수' }, { $set: { item_id: item_id+req.body.상품.length } },
        function (err, db_res) {
        });
    });

    res.send('전송완료');
});

app.post('/direct/payment', login_check , function(req, res){ 
  console.log(req.user.id);
  //같은 구매 물건이 결제가 안되있을 경우 삭제함.
   db.collection('order').deleteOne( {user : req.user.id , status : "not" } );

  db.collection('item').findOne( { _id : parseInt(req.body.id)}, function(err, db_res){
    db.collection('order').insertOne(
      {
        _id :  req.body.order_num,
        item_id : parseInt(req.body.id),
        item_name : db_res.상품,
        item_price : db_res.가격,
        count : req.body.count,
        totalpay : req.body.count * db_res.가격,
        imp_uid : '',
        merchant_uid : '',
        status : 'not',
        user : req.user.id
      }
    )
  })
});



//결제페이지
app.get('/direct/pay/:id',login_check, function(req, res){
  //바로구매버튼
  var queryData = url.parse(req.url, true).query;
  var totalpay = 0;

  db.collection('item').find({_id : parseInt(queryData.item) }).toArray(function(err,db_res){
      totalpay = parseInt(db_res[0].가격) * parseInt(queryData.a);
   
      res.render('payView', {items : db_res , count : queryData.a, totalpay : totalpay});
  });
});


//장바구니 기본페이지
app.get('/cart/view', login_check, function(req, res){
  db.collection('cart').find({ user:  req.user.id }).toArray(function (err, db_res) {
    var data = [];
    for(var i = 0; i < db_res.length; ++i){
        data.push(parseInt(db_res[i].item_id));  // 유저가 구입한 상품의 _id를 추출
    }
    db.collection('item').find( { _id : { $in : data } }).toArray(function(err,db_res2){
     
      res.render('cartView', { basket: db_res, posts : db_res2 , 사용자: req.user });
    })
})
})



//장바구니 상품추가
app.post('/cart/add', login_check, function (req, res) {
  db.collection('cart').findOne({ item_id : req.body.data.num, user : req.user.id }, function(err, db_res){
     if(db_res == null){
 
     db.collection('cart').insertOne(
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
app.get('/cart/pay/:id',login_check, function(req, res){

  db.collection('order').deleteOne({user : req.user.id , status : 'not'} );

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


  db.collection('item').find({ _id : { $in : id } }).toArray(function(err,db_res){
    for(var i = 0; i < id.length; ++i){
        totalpay += db_res[i].가격 * parseInt(count[i]);
        name.push(db_res[i].상품);
        price.push(db_res[i].가격);
        img.push(db_res[i].이미지);
    }
  
    db.collection('order').insertOne({ 
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
      // 거래의 총액과 갯수 그리고 각 상품의 정보를 보내주어야함.
      res.render('payView', {items : db_res  , totalpay : totalpay, count : count });
    });
  });
});

//장바구니 목록삭제
app.delete('/cart/del', login_check, function (req, res) {
  console.log(req.body.del_id);
   db.collection('cart').deleteOne({ item_id: req.body.del_id, user: req.user.id }, function (err, db_res) {
     
     console.log('삭제완료');
   });
});



app.post('/payment/update', login_check, async function(req, res){

var id = parseInt(req.body.item_id);

db.collection('order').updateOne(
  { item_id : id , status : "not", user : req.user.id }, 
   { $set: {
      imp_uid : req.body.imp_uid , 
      merchant_uid : req.body.merchant_uid, 
      pay_method : req.body.pay_method
   }
  }, function(err, db_res){

    db.collection('order').findOne({imp_uid : req.body.imp_uid }, async function(err, db_res2){
      console.log(db_res2);
 try {

   
   const { imp_uid, merchant_uid } = req.body; // req의 body에서 imp_uid, merchant_uid 추출
   // 액세스 토큰(access token) 발급 받기
   const getToken = await axios({
     url: "https://api.iamport.kr/users/getToken",
     method: "post", // POST method
     headers: { "Content-Type": "application/json" }, // "Content-Type": "application/json"
     data: {
       imp_key: "imp_apikey", // REST API 키
       imp_secret: process.env.import_key// REST API Secret
     }
   });
   const { access_token } = getToken.data.response; // 인증 토큰    
   // imp_uid로 아임포트 서버에서 결제 정보 조회
   //db를 가져와서 imp_id를 조회하면된다. status가 'ok'
   const getPaymentData = await axios({
     url: 'https://api.iamport.kr/payments/'+imp_uid, // imp_uid 전달
     method: "get", // GET method
     headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
   });
 
   const paymentData = getPaymentData.data.response; // 조회한 결제 정보      
 

   if(paymentData.amount = db_res2.totalpay){
     db.collection('order').updateOne(
       { imp_uid : paymentData.imp_uid}, 
        { $set: {
           status : 'vbank_ready'} 
       });
   }else{
     db.collection('order').updateOne(
       { imp_uid : paymentData.imp_uid}, 
        { $set: {
           status : 'false'} 
       }); 
   }


 } catch (e) {
   res.status(400).send(e);
 }


 
});

  });

     
    res.send('success');
});


app.post('/payment/complete',function(req, res){
  console.log(req.body);
  db.collection('order').updateOne(
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

app.get('/order',function(req, res){
  res.render('completeView');
})

app.get('/search/',function(req, res){
  db.collection('item').find({ 상품 : { $regex : req.query.value }}).toArray(function(err,db_res){
    if(req.user){
      res.render('searchView', { search_res : db_res , 사용자 : req.user.id });
    }else{
      res.render('searchView', { search_res : db_res , 사용자 : null });
    }
    
  })
  

})

app.get('/review',login_check, function(req, res){
  db.collection('item').find().limit(4).toArray(function(err,db_res){
    res.render('reView',{item : db_res});

  })

 
})

app.get('/review/:id/',function(req, res){
  db.collection('review').find({ item_id : req.params.id }).count(function(err,db_res){
  db.collection('review').find({ item_id : req.params.id }).toArray(function(err,db_res2){
    res.send({totalcount : db_res, review : db_res2});       
  })
});
});


//db review data insert 
app.post('/review', login_check, function (req, res) {

  db.collection('review_count').findOne({ name: '리뷰갯수' },
    function (err, db_res) {
      var count = db_res.count;

      db.collection('review').insertOne(
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

      db.collection('review_count').updateOne(
        { name: '리뷰갯수' }, { $inc: { count: 1 } },
        function (err, db_res) {

        });
    });

});


//img path insert
app.post('/review_add/:path/:path2', login_check, upload.array('file[]'), function (req, res) {
  res.redirect('/review');
});



app.get('/edit/:word',login_check, function(req, res){
  db.collection('item').find({ 상품 : { $regex : req.params.word } }).toArray(function(err,db_res){
    res.send(db_res);       
  })
});



app.post('/edit',function(req,res){
  db.collection('item').updateOne({ _id : parseInt(req.body._id) },
   { $set: { 
    상품 : req.body.상품 , 
    가격 : req.body.가격, 
    분류 : req.body.분류,
    재고 : req.body.재고,
    이미지 : req.body.이미지 
  } 
}, function(err,db_res){
    res.send(db_res);       
  });
});


app.post('/edit_img/:path/:path2', upload.single('editfile'), function (req, res) {
  res.redirect('/new')
});



app.delete('/edit',function(req, res){
  db.collection('item').deleteOne({ _id : parseInt(req.body.item_id) } , function(err,db_res){
    if(err) return err;


      res.send('success');
  });
  
});



app.get('/mypage/order',login_check,  function(req, res){
  //여기서 order에서 staus가 ok, ready인 부분을 가져옴.

db.collection('order').find( {status : { $in : ['ok','dlvy_ing', 'vbank_ready']  }, user : req.user.id } ).toArray(function(err,db_res){
  var item_id = [];
  var imgs = [];
  var img;
  db_res.forEach(element => {
    if(element.item_id.length > 1){
      item_id.push(...element.item_id);
    }
    item_id.push(element.item_id);
  });

  db.collection('item').find({_id : {$in : item_id}}).toArray(function(err, db_res2){
    res.render('mypageView',{ order : db_res, item : db_res2, 사용자 : req.user.id});

  })

 
   
  
  });
});

 


app.get('/dlvyment',login_check, function(req, res){
  db.collection('order').find({ status : 'ok'}).toArray(function(err,db_res){
    res.render('dlvyView', { order : db_res});
  })

});

 //여기서는 운송장이 기입이 안되있지만 결제가 된 데이터를 가져와서
  //입력을 해서 update시킴.
app.post('/dlvyment', login_check, function(req,res){
  db.collection('order').updateOne(
    { _id : req.body.order_num , status : "ok", },  { $set: {
        dlvy_num :  req.body.dlvy_num,
        status :  'dlvy_ing'
      } 
    },
   function (err, db_res) {
     if(err) return err;

     res.send('수정완료');
  });
});




app.get('/track/:url', function(req, res){
    axios({
      method: 'get',
      url: `http://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=${process.env.tracker_key}&t_code=04&t_invoice=${req.params.url}`,
      headers: {
         'Content-Type': 'application/json; charset=UTF-8'
      }
   }).then((response) => {
      res.render("trackView", { res : response } );
   })
   .catch((response) => console.log('error', response));


 
});


app.get('/test',function(req, res){
  res.render("testView");

})

app.post('/admin/*', auth_check);


app.post('/admin/add',function(req, res){
   res.send("테스트완료");
})

function auth_check(req, res, next){

if(!req.user) res.status(404).send(); 

if(req.user.auth == "admin"){
   next();
}else{
 res.status(404).send();
}

}




app.all('*',
    function (req, res)
    {
        res.status(404).send();
    }
);


