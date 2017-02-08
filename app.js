var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var app = express();
var ejs = require('ejs');

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

// root요청
app.get('/',function(req, res){
  res.send('hello main');
});

//로그인요청
app.get('/login', function(req, res){
  res.render('login', {});
});

//main요청
app.get('/main', function(req, res){
  res.render('main',{});
});

//도서추가
app.get('/bookAdd', function(req, res){
  res.render('bookAdd',{});
});

//도서폐기
app.get('/bookDisposal', function(req, res){
  res.render('bookDisposal',{});
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




conn.connect();
//이안에 쿼리문 작성
conn.end();


app.listen(3000,function(){
  console.log('Connected, 3000 port!');
});
