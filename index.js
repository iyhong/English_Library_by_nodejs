// var http = require('http');
// var express = require('express');
// var bodyParser = require('body-parser');
// var mysql = require('mysql');
// var route = express.Router();
// var app = express();
// var ejs = require('ejs');
// var session = require('express-session');
// var port = process.env.PORT || 3000;
//
// app.use(session({
//   secret: '@#@$MYSIGN#@$#$',  // 쿠키에 저장할 connect.sid값을 암호화할 키값 입력
//   resave: false,  //세션 아이디를 접속할때마다 새롭게 발급하지 않음
//   saveUninitialized: true,  //세션 아이디를 실제 사용하기전에는 발급하지 않음
// }));
//
// // db Connection
// var conn = mysql.createConnection({
//   host     : 'loverman85.cafe24.com',
//   user     : 'loverman85',
//   password : 'alskdj12!',
//   database : 'loverman85'
// });
// //bodyParser 사용설정
// app.use(bodyParser.urlencoded({ extended: false }));
//
// //뷰파일들을 views_file폴더밑에 놓겠다고 설정
// app.set('views','./views');
// //express에게 ejs를 쓰겠다고 선언
// app.set('view engine','ejs');
//
// conn.connect();
//
//
// //로그인요청
// app.get('/', function(req, res){
//   res.render('login', {});
// });
//
// //main요청
// app.get('/main', function(req, res){
//   res.render('main',{});
// });
//
//
// // route시작
//
// //로그인 & 로그아웃
// var log = require('./routes/log')(conn);
// app.use('/log', log);
//
//
// //도서등록 & 도서폐기
// var book = require('./routes/book')(conn);
// app.use('/book', book);
//
//
// // 도서대여
// var bookRent = require('./routes/bookRent')(conn);
// app.use('/bookRent', bookRent);
//
//
// // 도서반납
// var bookReturn = require('./routes/bookReturn')(conn);
// app.use('/bookReturn', bookReturn);
//
// // ajax요청
// var getRental = require('./routes/getRental')(conn);
// app.use('/getRental', getRental);
//
// // 도서관등록
// var libraryAdd = require('./routes/libraryAdd')(conn);
// app.use('/libraryAdd', libraryAdd);
//
// // 도서관등록
// var memberAdd = require('./routes/memberAdd')(conn);
// app.use('/memberAdd', memberAdd);
//
//
// http.createServer(app).listen(port, function(){
//   console.log('server run');
// });
// // app.listen(3000,function(){
// //   console.log('Connected, 3000 port!');
// // });


var http = require('http');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var ejs = require('ejs');

var app = express();

app.use(bodyParser());
var router = express.Router();
app.use(express.static('public'));
app.use(router);

var port = process.env.PORT || 3000;

//뷰파일들을 views_file폴더밑에 놓겠다고 설정
app.set('views','./views');
//express에게 ejs를 쓰겠다고 선언
app.set('view engine','ejs');



router.get("/",function(req,res){
res.send("19191818");
});



http.createServer(app).listen(port, function(){
console.log('server run');
});
