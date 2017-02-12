module.exports = function(conn){
  var express = require('express');
  var route = express.Router();

  function getDateDiff(date1,date2) {
    console.log('getDateDiff 함수실행');
    var arrDate1 = date1.split("-");
    var getDate1 = new Date(parseInt(arrDate1[0]),parseInt(arrDate1[1])-1,parseInt(arrDate1[2]));
    console.log('getDate1 : '+getDate1);
    //date2는 db에서 가져오는데 이미 포맷이 되어잇기때문에 변환할필요가 없음
    console.log('date2 : '+date2);
    var getDiffTime = getDate1.getTime() - date2.getTime();
    return Math.floor(getDiffTime / (1000 * 60 * 60 * 24));
  }



  //ajax 요청받음

  route.post('/', function(req, res){
    console.log('ajax 요청시작');
    var bookCode = req.body.bookCode;

    var selectBookStateSql = 'SELECT'+
                        			 ' state_no as stateNo'+
                           		' FROM book'+
                           		' WHERE book_code=?';
    conn.query(selectBookStateSql, [bookCode], function(err, result){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else {
        if(!result[0]){
          res.send();
        } else if (result[0].stateNo!==2){
          //대여가능한 도서가 아니므로 row 값을 담은 객체를 보내준다.
          res.send({row:'false'});
          //return;
        } else {
          //도서코드로 대여정보 가져옴
          var sql = 'SELECT'+
                			' rental_code as rentalCode,'+
                			' rental.book_code as bookCode,'+
                			' book.book_name as bookName,'+
                			' member.member_name as memberName,'+
                			' rental_payment as rentalPayment,'+
                			' rental_start as rentalStart,'+
                			' memberlevel.price as memberLevelPrice,'+
                			' book.book_totalday as bookTotalDay'+
                		' FROM rental'+
                		' JOIN book ON rental.book_code=book.book_code'+
                		' JOIN member ON rental.member_id=member.member_id'+
                		' JOIN memberlevel ON member.member_id=memberlevel.memberlevel_no'+
                		' WHERE rental.book_code=? and rentalstate_no !=2';
          conn.query(sql, [bookCode], function(err, result){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error');
            } else {
              console.log('쿼리 정상 실행');
              var bookName = result[0].bookName;
              var rentalCode = result[0].rentalCode;
              var rentalPayment = result[0].rentalPayment;
              var memberName = result[0].memberName;
              var rentalStart = result[0].rentalStart;
              var memberLevelPrice = result[0].memberLevelPrice;
              var bookTotalDay = result[0].bookTotalDay;
              console.log('bookName : '+bookName);
              // 날짜 차이 계산 함수
              // date1 : 기준 날짜(YYYY-MM-DD), date2 : 대상 날짜(YYYY-MM-DD)

              //오늘날짜 만들기
              var dt = new Date();
              var today = dt.getFullYear()+'-';
              today += dt.getMonth()+1+'-';
              today += dt.getDate();
              console.log('today : '+today);
              console.log('rentalStart : '+rentalStart);
              var diffDay = getDateDiff(today,rentalStart)+1;
              console.log('날짜차이 : '+diffDay);

              bookTotalDay += diffDay;
              console.log('bookTotalDay : '+bookTotalDay);

              //계산 총 금액, 받을금액
              var totalPrice = memberLevelPrice*diffDay;
              var willPay = totalPrice - rentalPayment;
              console.log('totalPrice : '+totalPrice);
              console.log('willPay : '+willPay);

              res.send({bookName : bookName,
                        memberName : memberName,
                        totalPrice : totalPrice,
                        rentalPayment : rentalPayment,
                        willPay : willPay,
                        rentalCode : rentalCode,
                        bookTotalDay : bookTotalDay
              });
            }
          });
        }
      }
    });
  });


return route;
};
