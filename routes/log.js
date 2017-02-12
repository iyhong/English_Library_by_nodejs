module.exports = function(conn){
  var express = require('express');
  var route = express.Router();

  //로그인실행
  route.post('/in', function(req, res){
    var libraryId = req.body.libraryId;
    var libraryPw = req.body.libraryPw;
    console.log('libraryId:'+libraryId);
    console.log('libraryPw:'+libraryPw);
    var sql = 'SELECT library_id as libraryId'+
              'FROM library'+
              'WHERE library_id = ? AND library_pw = ?';
    conn.query(sql, [libraryId,libraryPw], function(err, result, fields){
      console.log('result:'+result[0].libraryId);
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else {
        if(result[0].libraryId){
          console.log('로그인성공');
          req.session.libraryId=libraryId;
          //res.send(req.session.id);
          console.log('session:'+req.session.libraryId);
          res.redirect('/main');
        }
      }
    });
  });

  //로그아웃
  route.get('/out', function(req, res){
    console.log('session destroy before:'+req.session.libraryId);
    //세션삭제
    if(req.session.libraryId){
      req.session.destroy(function(err){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          res.redirect('/');
        }
      });
    } else {
      res.redirect('/');
    }
    console.log('session destroy after:'+req.session);
  });


  return route;



};
