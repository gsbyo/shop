var router = require('express').Router();

router.get('/list', function (req, res) {
  var toltalcount = 0; // 상품의 총 갯수
  var view_count = 8; // 한번에 나타낼 상품의 갯수

  if (req.query.way == 'new') {
    req.app.DB.collection('item').count(function (err, db_res) {
      toltalcount = db_res;

      req.app.DB.collection('item').find().sort({ _id: 1 }).limit(view_count).toArray(
        function (err, db_res2) {

          res.render('listView', { posts: db_res2, totalcount: toltalcount });
        });
    });
  } else {
    req.app.DB.collection('item').count(function (err, db_res) {
      toltalcount = db_res;
      req.app.DB.collection('item').find().sort({ _id: -1 }).limit(view_count).toArray(
        function (err, db_res2) {
          res.render('listView', { posts: db_res2, totalcount: toltalcount });
        });
    });
  }
});

router.get('/list/new/:id', function (req, res) {

  if (req.params.id == 1) return res.status(404).send();


  var totalcount = 0;
  var view_count = 8;

  req.app.DB.collection('item').count(function (err, db_res) {
    totalcount = db_res;

    if (Math.ceil(totalcount / view_count) < req.params.id) return res.status(404).send();

    req.app.DB.collection('item').find().sort({ _id: 1 }).limit(view_count).skip(view_count * (req.params.id - 1)).toArray(
      function (err, db_res2) {
        res.render('listView', { posts: db_res2, totalcount: totalcount });
      });
  });
});

router.get('/list/best/:id', function (req, res) {

  if (req.params.id == 1) return res.status(404).send();

  var totalcount = 0;
  var view_count = 8;
  req.app.DB.collection('item').count(function (err, db_res) {
    totalcount = db_res;

    if (Math.ceil(totalcount / view_count) < req.params.id) return res.status(404).send();

    req.app.DB.collection('item').find().sort({ _id: -1 }).limit(view_count).skip(view_count * (req.params.id - 1)).toArray(
      function (err, db_res2) {


        res.render('listView', { posts: db_res2, totalcount: totalcount });

      });
  });
});


//상품 구매페이지
router.get('/detail/:id', function (req, res) {
  req.app.DB.collection('item').findOne({ _id: parseInt(req.query.itemid) }, function (err, db_res) {

    if (db_res == null) return res.status(404).send();


    res.render('productView', { post: db_res });


  });
});


module.exports = router;

