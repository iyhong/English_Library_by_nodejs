var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var route = express.Router();
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


//main요청
app.get('/main', function(req, res){
  res.render('main',{});
});

// route시작

//로그인 & 로그아웃
var log = require('./routes/log')(route, conn);
app.use('/log', log);


//도서등록 & 도서폐기
var book = require('./routes/book')(route, conn);
app.use('/book', book);


//대여 & 반납
var bookRent = require('./routes/bookRent')(route, conn);
app.use('/bookRent', bookRent);



//도서반납 폼
app.get('/bookReturn', function(req, res){
  res.render('bookReturn',{});
});

//도서반납 실행
app.post('/bookReturn', function(req, res){
  let bookCode = req.body.bookCode;
  let rentalCode = req.body.rentalCode;
  let bookTotalDay = req.body.bookTotalDay;
  let totalPrice = req.body.totalPrice;


  conn.beginTransaction(function(err){
    if(err){throw err;}
    //반납 시작
    let updateRentalStateSql = `UPDATE rental
                            		SET
                            			rentalstate_no=2,
                            			rental_payment=?,
                            			rental_end=sysdate()
                            		WHERE rental_code=?`;
    conn.query(updateRentalStateSql,[totalPrice, rentalCode], function(err, result){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('대여상태 수정');

        console.log('bookTotalDay : '+bookTotalDay);
        console.log('bookCode : '+bookCode);
        //도서상태 수정(bookTotalDay, state_no)
        let updateBookStateSql = `UPDATE book SET
                                    book.state_no = 1,
                                    book.book_totalday = ?
                              		WHERE book.book_code = ?`;
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

//ajax 요청받음
app.post('/getRental', function(req, res){
  console.log('ajax 요청시작');
  let bookCode = req.body.bookCode;

  let selectBookStateSql = `SELECT
                      			 state_no as stateNo
                         		FROM book
                         		WHERE book_code=?`;
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
        let sql = `SELECT
              			rental_code as rentalCode,
              			rental.book_code as bookCode,
              			book.book_name as bookName,
              			member.member_name as memberName,
              			rental_payment as rentalPayment,
              			rental_start as rentalStart,
              			memberlevel.price as memberLevelPrice,
              			book.book_totalday as bookTotalDay
              		FROM rental
              		JOIN book ON rental.book_code=book.book_code
              		JOIN member ON rental.member_id=member.member_id
              		JOIN memberlevel ON member.member_id=memberlevel.memberlevel_no
              		WHERE rental.book_code=? and rentalstate_no !=2`;
        conn.query(sql, [bookCode], function(err, result){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
          } else {
            console.log('쿼리 정상 실행');
            let bookName = result[0].bookName;
            let rentalCode = result[0].rentalCode;
            let rentalPayment = result[0].rentalPayment;
            let memberName = result[0].memberName;
            let rentalStart = result[0].rentalStart;
            let memberLevelPrice = result[0].memberLevelPrice;
            let bookTotalDay = result[0].bookTotalDay;

            // 날짜 차이 계산 함수
            // date1 : 기준 날짜(YYYY-MM-DD), date2 : 대상 날짜(YYYY-MM-DD)
            function getDateDiff(date1,date2) {
              console.log('getDateDiff 함수실행')
              var arrDate1 = date1.split("-");
              var getDate1 = new Date(parseInt(arrDate1[0]),parseInt(arrDate1[1])-1,parseInt(arrDate1[2]));
              console.log('getDate1 : '+getDate1);
              //date2는 db에서 가져오는데 이미 포맷이 되어잇기때문에 변환할필요가 없음
              console.log('date2 : '+date2);
              var getDiffTime = getDate1.getTime() - date2.getTime();
              return Math.floor(getDiffTime / (1000 * 60 * 60 * 24));
            }

            //오늘날짜 만들기
            let dt = new Date();
            let today = dt.getFullYear()+'-';
            today += dt.getMonth()+1+'-';
            today += dt.getDate();
            console.log('today : '+today);
            console.log('rentalStart : '+rentalStart);
            let diffDay = getDateDiff(today,rentalStart)+1;
            console.log('날짜차이 : '+diffDay);

            bookTotalDay += diffDay;
            console.log('bookTotalDay : '+bookTotalDay);

            //계산 총 금액, 받을금액
            let totalPrice = memberLevelPrice*diffDay;
            let willPay = totalPrice - rentalPayment;
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


//도서관등록 폼
app.get('/libraryAdd', function(req, res){
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
app.post('/libraryAdd', function(req,res){
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



//회원등록 폼
app.get('/memberAdd', function(req, res){
  let selectMemberLevelSql = `SELECT
                          			memberlevel_no as memberLevelNo,
                          			memberlevel_name as memberLevelName,
                          			price
                          		FROM memberlevel`;
  conn.query(selectMemberLevelSql, function(err, result){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.render('memberAdd',{level:result});
    }
  });
});

app.post('/memberAdd', function(req, res){
  let memberName = req.body.memberName;
  let memberPhone = req.body.memberPhone;
  let memberLevelNo = req.body.memberLevelNo;

  let insertMember = `INSERT INTO member(
                  			member_name,
                  			member_phone,
                  			memberlevel_no
                  		) VALUES (
                  			?,?,?
                  		)`;
  conn.query(insertMember, [memberName, memberPhone, memberLevelNo], function(err, result){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      console.log('회원등록 성공');
      res.redirect('/memberAdd');
    }
  });
});


// 테스트용
// app.get('/fail',function(req,res){
//   res.redirect('fail1');
//   return;
//   console.log('tesetsetset');
// });
// app.get('/fail1',function(req,res){
//
//   //res.redirect('fail');
//   console.log('1111111111');
//   res.send('asdfasd');
// });

app.listen(3000,function(){
  console.log('Connected, 3000 port!');
});
