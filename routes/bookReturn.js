module.exports = function(conn){
  var express = require('express');
  var route = express.Router();

  //도서반납 폼
  route.get('/', function(req, res){
    console.log('bookReturn get요청');

    res.render('bookReturn',{});
  });

  //도서반납 실행
  route.post('/', function(req, res){
    var bookCode = req.body.bookCode;
    var rentalCode = req.body.rentalCode;
    var bookTotalDay = req.body.bookTotalDay;
    var totalPrice = req.body.totalPrice;


    conn.beginTransaction(function(err){
      if(err){throw err;}
      //반납 시작
      var updateRentalStateSql = 'UPDATE rental'+
                              		' SET'+
                              			' rentalstate_no=2,'+
                              			' rental_payment=?,'+
                              			' rental_end=sysdate()'+
                              		' WHERE rental_code=?';
      conn.query(updateRentalStateSql,[totalPrice, rentalCode], function(err, result){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          console.log('대여상태 수정');

          console.log('bookTotalDay : '+bookTotalDay);
          console.log('bookCode : '+bookCode);
          //도서상태 수정(bookTotalDay, state_no)
          var updateBookStateSql = 'UPDATE book SET'+
                                      ' book.state_no = 1,'+
                                      ' book.book_totalday = ?'+
                                		' WHERE book.book_code = ?';
          conn.query(updateBookStateSql, [bookTotalDay, bookCode], function(err, result){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error');
            } else {
              console.log('도서상태 수정');
              //커밋
              conn.commit(function(err) {
                if (err) {
                  //롤백
                  conn.rollback(function() {
                    throw err;
                  });
                }
              });
              res.redirect('/bookReturn');
            }
          });
        }
      });
    });
    //트랜잭션 종료
  });
return route;
};
