module.exports = function(conn){
  var express = require('express');
  var route = express.Router();

  //회원등록 폼
  route.get('/', function(req, res){
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

  //회원등록 실행
  route.post('/', function(req, res){
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

  return route;
}
