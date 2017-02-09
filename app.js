var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var app = express();
var ejs = require('ejs');
var session = require('express-session');

app.use(session({
  secret: '@#@$MYSIGN#@$#$',  // 쿠키에 저장할 connect.sid값을 암호화할 키값 입력
  resave: false,  //세션 아이디를 접속할때마다 새롭게 발급하지 않음
  saveUninitialized: true,  //세션 아이디를 실제 사용하기전에는 발급하지 않음
}));

// db Connection
var conn = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'java0000',
  database : 'library'
});
//bodyParser 사용설정
app.use(bodyParser.urlencoded({ extended: false }));

//뷰파일들을 views_file폴더밑에 놓겠다고 설정
app.set('views','./views');
//express에게 ejs를 쓰겠다고 선언
app.set('view engine','ejs');

conn.connect();
//로그인요청
app.get('/', function(req, res){
  res.render('login', {});
});
//로그인실행
app.post('/login', function(req, res){
  var libraryId = req.body.libraryId;
  var libraryPw = req.body.libraryPw;
  console.log('libraryId:'+libraryId);
  console.log('libraryPw:'+libraryPw);
  var sql = `SELECT library_id as libraryId
            FROM library
            WHERE library_id = ? AND library_pw = ?`;
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
app.get('/logout', function(req, res){
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


//main요청
app.get('/main', function(req, res){
  res.render('main',{});
});


//도서등록 폼
app.get('/bookAdd', function(req, res){
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
app.post('/bookAdd', function(req,res){
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
  var sql = `INSERT INTO book(
         			library_id,
         			genre_no,
         			book_name,
         			book_author,
         			book_publisher
         		) values (
         			?,?,?,?,?
         		)`;
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
app.get('/bookDisposal', function(req, res){
  res.render('bookDisposal',{});
});

//도서폐기 실행
app.post('/bookDisposal', function(req, res){
  var bookCode = req.body.bookCode;
  var sql = `SELECT
        			state_no as stateNo
         		FROM book
         		WHERE book_code=?`;
  conn.query(sql, [bookCode], function(err, result){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      if(!result[0]){
        res.render('fail',{message:'도서가 없습니다.'})
      } else if(result[0].stateNo===3){
        res.render('fail',{message:'이미 폐기된 도서입니다.'});
      } else if(result[0].stateNo===2){
        res.render('fail',{message:'대여중인 도서입니다.'});
      } else {
        let sql = `UPDATE book SET
               			state_no = ?
              		WHERE book_code = ?`;
        conn.query(sql, [3, bookCode], function(err, result){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
          } else {
            console.log('도서상태 폐기로 업데이트 성공')
          }
        });
        let sqlInsert = `INSERT INTO disposal(
                    			disposal.book_code,
                    			disposal.disposal_bookname,
                    			disposal.disposal_author,
                    			disposal.genre_no,
                    			disposal.disposal_publisher,
                    			disposal.disposal_registerday
                    		)SELECT
                    			book.book_code,
                    			book.book_name,
                    			book.book_author,
                    			book.genre_no,
                    			book.book_publisher,
                    			sysdate()
                    		FROM book
                    		WHERE book.book_code=?`;
        conn.query(sqlInsert, [bookCode], function(err, result){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
          } else {
            res.redirect('/bookDisposal');
          }
        });
      }
    }
  });
});


//도서대여 폼
app.get('/bookRent', function(req, res){
  res.render('bookRent',{});
});

//도서대여 실행
app.post('/bookRent', function(req, res){
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
                rentalCode += leadingZeros(result[0].num,5);
                console.log('rentalCode:'+rentalCode);

                //대여 등록
                let insertRentalSql = `INSERT INTO rental(
                                  			rental_code,
                                  			book_code,
                                  			rental_start,
                                  			rental_end,
                                  			member_id,
                                  			rental_payment
                                  		) VALUES (
                                  			?,?,?,?,?,?
                                  		)`;
                conn.query(insertRentalSql, [rentalCode, bookCode, rentalStart, rentalEnd, memberId, rentalPayment], function(err, result){
                  if(err){
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                  } else {
                    console.log('대여등록 성공');
                  }
                });

                //도서상태 변경(대여가능->대여불가)
                let updateBookStateSql = `UPDATE book SET
                                            state_no = ?
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

//도서반납
app.get('/bookReturn', function(req, res){
  res.render('bookReturn',{});
});

//회원등록
app.get('/memberAdd', function(req, res){
  res.render('memberAdd',{});
});

app.get('/fail',function(req,res){
  res.redirect('fail1');
  return;
  console.log('tesetsetset');
});
app.get('/fail1',function(req,res){

  //res.redirect('fail');
  console.log('1111111111');
  res.send('asdfasd');
});

app.listen(3000,function(){
  console.log('Connected, 3000 port!');
});
