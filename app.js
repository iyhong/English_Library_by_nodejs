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
      if(result[0].stateNo===3){
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
            res.redirect('/bookDisposal');
          }
        });
      }
    }
  });
});


//도서대여
app.get('/bookRent', function(req, res){
  res.render('bookRent',{});
});

//도서반납
app.get('/bookReturn', function(req, res){
  res.render('bookReturn',{});
});

//회원등록
app.get('/memberAdd', function(req, res){
  res.render('memberAdd',{});
});

app.get('/hi',function(req,res){
  res.send('hello world');
});


app.listen(3000,function(){
  console.log('Connected, 3000 port!');
});
