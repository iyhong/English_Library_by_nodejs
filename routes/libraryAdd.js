module.exports = function(conn){
  var express = require('express');
  var route = express.Router();

  //도서관등록 폼
  route.get('/', function(req, res){
    let selectLocalSql = `SELECT
                      			local_no as localNo,
                      			local_name as localName
                      		FROM local`;
    conn.query(selectLocalSql, function(err, result){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else {
        res.render('libraryAdd',{result:result});
      }
    })
  });

  //도서관등록 실행
  route.post('/', function(req,res){
    let libraryId = req.body.libraryId;
    let libraryPw = req.body.libraryPw;
    let local = req.body.local;

    let selectLibrarySql =`SELECT
                       			library_id as libraryId
                      		FROM library
                          WHERE library_id = ?`;
    conn.query(selectLibrarySql, [libraryId], function(err, result){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else {
        if(result[0]){
          console.log('아이디 중복');
          res.render('fail',{message: '아이디가 이미 있습니다.'});
          return;
        }
        //도서관등록
        let insertLibrarySql = `INSERT INTO library(
                             			library_id,
                             			library_pw,
                             			local_no
                             		)values(
                             			?,?,?
                             		)`;
        conn.query(insertLibrarySql, [libraryId, libraryPw, local], function(err,result){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
          } else {
            console.log('도서관 등록 성공');
            res.redirect('/');
          }
        });
      }
    });
  });

  return route;
}
