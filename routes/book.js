module.exports = function(conn){
  var express = require('express');
  var route = express.Router();

  //도서등록 폼
  route.get('/Add', function(req, res){
    var sql = `SELECT
          			genre_no as genreNo,
          			genre_name as genreName
          		FROM genre`;
    conn.query(sql, function(err, genre, fields){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else {
        res.render('bookAdd',{ genre: genre });
      }
    });
  });

  //도서등록 실행
  route.post('/Add', function(req,res){
    var bookName = req.body.bookName;
    console.log('bookName:'+bookName);
    var bookAuthor = req.body.bookAuthor;
    console.log('bookAuthor:'+bookAuthor);
    var bookPublisher = req.body.bookPublisher;
    console.log('bookPublisher:'+bookPublisher);
    var genre = req.body.genre;
    console.log('genre:'+genre);
    var libraryId = req.session.libraryId;
    console.log('libraryId:'+libraryId);
    var sql = 'INSERT INTO book('+
           			'library_id,'+
           			'genre_no,'+
           			'book_name,'+
           			'book_author,'+
           			'book_publisher'+
           	  ') values ('+
           		'	?,?,?,?,?)';
    if(!libraryId){
      res.render('fail',{message:'로그인이 안되어있습니다.'});
    } else {
      conn.query(sql, [libraryId, genre, bookName, bookAuthor, bookPublisher], function(err, result, fiedls){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          if(result){
            console.log('도서등록 성공');
            res.redirect('/bookAdd');
          } else {
            res.redirect('도서등록에 실패했습니다.');
          }
        }
      });
    }
  });

  //도서폐기 폼
  route.get('/Disposal', function(req, res){
    res.render('bookDisposal',{});
  });

  //도서폐기 실행
  route.post('/Disposal', function(req, res){
    var bookCode = req.body.bookCode;
    var sql = 'SELECT'+
          			'state_no as stateNo'+
           		'FROM book'+
           		'WHERE book_code=?';
    conn.query(sql, [bookCode], function(err, result){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else {
        if(!result[0]){
          res.render('fail',{message:'도서가 없습니다.'});
        } else if(result[0].stateNo===3){
          res.render('fail',{message:'이미 폐기된 도서입니다.'});
        } else if(result[0].stateNo===2){
          res.render('fail',{message:'대여중인 도서입니다.'});
        } else {

          //트랙잭션 시작
          conn.beginTransaction(function(err){
            if(err){throw err;}

          var sql = 'UPDATE book SET'+
                 			'state_no = ?'+
                		'WHERE book_code = ?';
          conn.query(sql, [3, bookCode], function(err, result){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error');
            } else {
              console.log('도서상태 폐기로 업데이트 성공');
            }
          });
          var sqlInsert = 'INSERT INTO disposal('+
                      			'disposal.book_code,'+
                      			'disposal.disposal_bookname,'+
                      			'disposal.disposal_author,'+
                      			'disposal.genre_no,'+
                      			'disposal.disposal_publisher,'+
                      			'disposal.disposal_registerday'+
                      		')SELECT '+
                      			'book.book_code,'+
                      			'book.book_name,'+
                      			'book.book_author,'+
                      			'book.genre_no,'+
                      			'book.book_publisher,'+
                      			'sysdate()'+
                      		'FROM book'+
                      		'WHERE book.book_code=?';
          conn.query(sqlInsert, [bookCode], function(err, result){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error');
            } else {
              //커밋
              conn.commit(function(err) {
                if (err) {
                  //롤백
                  conn.rollback(function() {
                    throw err;
                  });
                }
              });
              res.redirect('/bookDisposal');
            }
          });
        });
        //트랜잭션 종료
        }
      }
    });
  });

  return route;
};
