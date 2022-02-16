const express = require('express');
const axios = require('axios');
const bodyParser= require('body-parser')
const helmet = require("helmet");
const app = express();


require('dotenv').config();

app.set('view engine', 'ejs');

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(bodyParser.urlencoded({extended: true})) 
app.use('/public', express.static(__dirname + '/public'))


const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({
  secret : 'secretcode', 
  resave : false, 
  saveUninitialized: false,

}));

app.locals.isAuthenticated = false;
app.locals.currentUser = null;
app.locals.auth = null;

app.use(passport.initialize());
app.use(passport.session()); 

passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (input_id, input_pw, done) {
  DB.collection('login').findOne({ id: input_id }, function (err, res) {
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
  DB.collection('login').findOne({ id: input_id }, function (err, res) {
    done(null, res)
  })
}); 


const MongoClient = require('mongodb').MongoClient;
var DB;

MongoClient.connect(process.env.DB_URL, function(err, client){
    if (err) return console.log(err);
    DB = client.db('List');
    app.DB = DB;

    app.listen(process.env.PORT, '127.0.0.1', function(){
      console.log('listening on 3000')
    });
    
})

//multer
let multer = require('multer');
var storage = multer.diskStorage({

  destination : function(req, file, cb){
    var dir = req.params.path;

    cb(null, './public/image/main/'+dir);
  },
  filename : function(req, file, cb){
    cb(null, file.originalname )
  }

});

var upload = multer({storage : storage});

var path = require('path');


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



function Admin_Check(req, res, next){
  if(req.isAuthenticated()){
      if(req.user.auth == "admin")  
      next();
  }else{
    res.status(404).send();
   }

};

function Login_Check(req, res,next){
  if(req.isAuthenticated()){
    next();
  }else{
    res.render('loginView');
  }
}

//전역변수 활용
app.use(function(req,res,next){
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  next();
});

/* ================================================================= */

const adminRouter = require('./router/admin');

app.use("/admin" ,Admin_Check ,adminRouter);

app.get('/home', function (req, res) {
  DB.collection('item').find().limit(4).toArray(function (err, db_res) {
        res.render('homeView',{ posts : db_res });
    });
})


app.post('/login', passport.authenticate('local', {failureRedirect : '/login'}), function(req, res){
  res.redirect('/home');
});


app.get('/login',  function(req, res){
    res.render('loginView');
});


app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/home');
});


const itemsRouter = require('./router/items');
app.use("/items", itemsRouter);


const paymnetRouter = require('./router/payment');
app.use("/payment", Login_Check , paymnetRouter);

const deliveryRouter = require('./router/delivery');
app.use("/delivery", Admin_Check ,deliveryRouter);

//상품이미지추가 multer 
app.post('/admin/edit/add/:path', Admin_Check ,upload.array('imgfile[]'), function (req, res) {
   res.redirect('/admin/edit')
});

//상품이미지수정 multer 
app.post('/admin/edit/change/:path', Admin_Check, upload.single('editfile'), function (req, res) {
  res.redirect('/admin/edit')
});

//상품이미지변경 multer 
app.post('/review/:path', Login_Check, upload.array('file[]'), function (req, res) {
  res.redirect('/review');
});

const cartRouter = require('./router/cart');
app.use("/cart", Login_Check ,cartRouter);

const mypageRouter = require('./router/mypage');
app.use("/mypage", Login_Check, mypageRouter);

const serachRouter = require('./router/search');
app.use("/search", serachRouter);

const reviewRouter = require('./router/review');
app.use("/review", Login_Check ,reviewRouter);


app.all('*', function (req, res) {
    res.status(404).send();
  }
);


