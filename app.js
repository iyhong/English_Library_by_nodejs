var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var app = express();
app.get('/',function(req,res){
  res.send('hello main');
});

app.get('/hi',function(req,res){
  res.send('hello world');
});

var conn = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'java0000',
  database : 'library'
});


conn.connect();
//이안에 쿼리문 작성
conn.end();


app.listen(3000,function(){
  console.log('Connected, 3000 port!');
});
