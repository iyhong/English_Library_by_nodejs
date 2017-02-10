module.exports = function(conn){
  var express = require('express');
  var route = express.Router();


  //도서대여 폼
  route.get('/', function(req, res){
    console.log('bookRent get요청');

    res.render('bookRent',{});
  });

  //도서대여 실행
  route.post('/', function(req, res){
    let libraryId = req.session.libraryId;
    let bookCode = req.body.bookCode;
    let memberId = req.body.memberId;
    let rentalStart = req.body.rentalStart;
    let rentalEnd = req.body.rentalEnd;
    let rentalPayment = req.body.rentalPayment;
    console.log('------------------------');
    console.log('bookCode:'+bookCode);
    console.log('memberId:'+memberId);
    console.log('rentalStart:'+rentalStart);
    console.log('rentalEnd:'+rentalEnd);
    console.log('rentalPayment:'+rentalPayment);
    console.log('------------------------');
    //rentalCode 만들기
    if(!libraryId){
      res.render('fail', {message:'로그인 하세요'});
      return;
    }
    let rentalCode = req.session.libraryId;
    //rentalCode = rentalCode.toString();
    function leadingZeros(n, digits) {
      console.log('===leadingZeros 함수===')
      var zero = '';
      n = n.toString();
      if (n.length < digits) {
        for (var i = 0; i < digits - n.length; i++)
          zero += '0';
      }
      console.log(zero+n);
      console.log('===leadingZeros 함수===')
      return zero + n;
    }
    //대여일 입력이없으면 오늘날짜 넣어줌
    if(!rentalStart){
      let dt = new Date();
      rentalStart = dt.getFullYear()+'-';
      rentalStart += dt.getMonth()+1+'-';
      rentalStart += dt.getDate();
    }
    console.log('rentalStart:'+rentalStart);
    //반납일 입력이없으면 null로 넣어줌
    if(!rentalEnd){
      rentalEnd = null;
    }
    console.log('rentalEnd:'+rentalEnd);



    //도서상태 조회후 도서상태가 1이 아니면 fail로 보냄
    let selectBookStateSql = `SELECT
                           			state_no as stateNo
                           		FROM book
                           		WHERE book_code = ?`;
    conn.query(selectBookStateSql,[bookCode], function(err, result){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else {

        if(!result[0]){
          console.log('bookCode:'+bookCode);
          console.log('도서가없어요');
          res.render('fail', {message:'없는도서입니다.'});
          return;
          //res.redirect('/fail');
        } else if (result[0].stateNo===2){
          console.log('bookCode:'+bookCode);
          console.log('도서상태값:'+result[0].stateNo);
          console.log('대여중인 도서입니다');
          res.render('fail', {message:'대여중인 도서입니다'});
          return;
        } else if (result[0].stateNo===3){
          console.log('도서상태값:'+result[0].stateNo);
          console.log('폐기된 도서입니다');
          res.render('fail', {message:'폐기된 도서입니다'});
          return;
        } else {
          //도서상태가 대여가능인경우의 else문 내부
          //회원아이디 검색해보기 없으면 fail로
          let selectMemberSql = `SELECT
                                  member_id as memberId
                                FROM member
                                WHERE member_id = ?`;
          conn.query(selectMemberSql, [memberId], function(err, result){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error');
            } else {
              if(!result[0]){
                res.render('fail',{message:'없는 회원입니다.'});
                return;
              }


              //트랙잭션 시작
              conn.beginTransaction(function(err){
                if(err){throw err;}

              //대여시작
              //autoincrement 가져오기
              //db에서 autoincrement값 가져와서 formatting 하고 rentalCode에 합쳐준다.
              console.log('-----대여 프로세스 시작----');

              let selectNoSql = `SELECT
                            			max(auto_num) as num
                            		FROM rental`;
              conn.query(selectNoSql,function(err,result){
                if(err) {
                  console.log(err);
                  res.status(500).send('Internal Server Error');
                } else {
                  console.log(result[0].num);
                  //가져온 결과를 5자리수로 포맷팅
                  rentalCode += leadingZeros(result[0].num,5);
                  console.log('rentalCode:'+rentalCode);

                  //대여 등록
                  let insertRentalSql = `INSERT INTO rental(
                                    			rental_code,
                                    			book_code,
                                          book_code_clone,
                                    			rental_start,
                                    			rental_end,
                                    			member_id,
                                    			rental_payment
                                    		) VALUES (
                                    			?,?,?,?,?,?,?
                                    		)`;
                  conn.query(insertRentalSql, [rentalCode, bookCode, bookCode, rentalStart, rentalEnd, memberId, rentalPayment], function(err, result){
                    if(err){
                      console.log(err);
                      res.status(500).send('Internal Server Error');
                      return;
                    } else {
                      console.log('대여등록 성공');
                    }
                  });


                  //도서상태 변경(대여가능->대여불가)
                  let updateBookStateSql = `UPDATE book SET
                                              state_no = ?,
                                              book_totalcount = book_totalcount+1
                                            WHERE book_code = ?`;
                  conn.query(updateBookStateSql,[2, bookCode], function(err, result){
                    if(err){
                      console.log(err);
                      res.status(500).send('Internal Server Error');
                    } else {
                      console.log('도서상태 UPDATE');
                    }
                  });


                  //firstday select
                  //도서의 firstday 가져온다(null인지 아닌지 확인하기위해서)
                  let selectBookFirstDaySql = `SELECT
                                                book_firstday as bookFirstday
                                              FROM book
                                              WHERE book_code=?`;
                  conn.query(selectBookFirstDaySql, [bookCode], function(err, result){
                    if(err){
                      console.log(err);
                      res.status(500).send('Internal Server Error');
                    } else {
                      //도서의 firstday 가 null이면 오늘날짜를 update시켜준다.
                      if(!result[0].bookFirstday){
                        let updateBookFirstdaySql = `UPDATE book SET
                                                      book_firstday = sysdate()
                                                    WHERE book_code = ?`;
                        conn.query(updateBookFirstdaySql, [bookCode], function(err, result){
                          if(err){
                            console.log(err);
                            res.status(500).send('Internal Server Error');
                          } else {
                            console.log('도서 firstday UPDATE');
                            conn.commit(function(err) {
                              if (err) {
                                conn.rollback(function() {
                                  throw err;
                                });
                              }
                            });

                            res.redirect('/bookRent');
                          }
                        });
                      } else {
                        //도서의 firstday 가 null이 아니면 끝
                        conn.commit(function(err) {
                          if (err) {
                            conn.rollback(function() {
                              throw err;
                            });
                          }
                        });
                        res.redirect('/bookRent');
                      }
                    }
                  });
                }
              });
              console.log('-----대여 프로세스 끝----');
              //대여종료
            });
            //트랜잭션 끝
            }
          });
          //회원아이디 검색 끝
        }
        //도서가 대여가능상태인 else문 끝
      }
      //도서상태조회쿼리 error없는 else문 끝
    });
    //도서상태조회 끝
  });


return route;
}
