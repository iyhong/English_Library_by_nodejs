-- --------------------------------------------------------
-- 호스트:                          127.0.0.1
-- 서버 버전:                        5.5.32 - MySQL Community Server (GPL)
-- 서버 OS:                        Win32
-- HeidiSQL 버전:                  8.0.0.4396
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- library 의 데이터베이스 구조 덤핑
CREATE DATABASE IF NOT EXISTS `library` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `library`;


-- 테이블 library의 구조를 덤프합니다. book
CREATE TABLE IF NOT EXISTS `book` (
  `book_code` int(11) NOT NULL AUTO_INCREMENT,
  `library_id` varchar(50) NOT NULL,
  `state_no` int(10) NOT NULL DEFAULT '1',
  `genre_no` int(10) NOT NULL,
  `book_name` varchar(50) NOT NULL,
  `book_author` varchar(50) NOT NULL,
  `book_publisher` varchar(50) NOT NULL,
  `book_firstday` datetime DEFAULT NULL,
  `book_totalday` int(11) NOT NULL DEFAULT '0',
  `book_totalcount` int(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`book_code`),
  KEY `FK__library` (`library_id`),
  KEY `FK__state` (`state_no`),
  KEY `FK__genre` (`genre_no`),
  CONSTRAINT `FK__genre` FOREIGN KEY (`genre_no`) REFERENCES `genre` (`genre_no`),
  CONSTRAINT `FK__library` FOREIGN KEY (`library_id`) REFERENCES `library` (`library_id`),
  CONSTRAINT `FK__state` FOREIGN KEY (`state_no`) REFERENCES `state` (`state_no`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8;

-- Dumping data for table library.book: ~5 rows (대략적)
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` (`book_code`, `library_id`, `state_no`, `genre_no`, `book_name`, `book_author`, `book_publisher`, `book_firstday`, `book_totalday`, `book_totalcount`) VALUES
	(5, '4', 2, 2, 'node.js', '1', '1', '2017-01-26 17:28:06', 0, 1),
	(6, '4', 2, 2, 'aaa', 'aa', 'aa', '2017-02-03 15:49:43', 0, 1),
	(7, '4', 1, 2, 'ff', 'ff', 'ff', NULL, 0, 0),
	(8, '4', 1, 4, 'gogo', 'nana', 'ju', NULL, 0, 0),
	(10, '1', 1, 1, 'umin', 'umin', 'umin', '2017-01-26 17:33:08', 7, 1);
/*!40000 ALTER TABLE `book` ENABLE KEYS */;


-- 이벤트 library의 구조를 덤프합니다. clone_evnet
DELIMITER //
CREATE DEFINER=`root`@`localhost` EVENT `clone_evnet` ON SCHEDULE EVERY 1 SECOND STARTS '2017-02-03 16:53:33' ON COMPLETION NOT PRESERVE ENABLE DO update rental
		set rental.book_code_clone = rental.book_code
		where rental.book_code is not null//
DELIMITER ;


-- 테이블 library의 구조를 덤프합니다. disposal
CREATE TABLE IF NOT EXISTS `disposal` (
  `disposal_no` int(10) NOT NULL AUTO_INCREMENT,
  `book_code` varchar(50) NOT NULL,
  `disposal_bookname` varchar(50) NOT NULL,
  `disposal_author` varchar(50) NOT NULL,
  `genre_no` int(11) NOT NULL,
  `disposal_publisher` varchar(50) NOT NULL,
  `disposal_registerday` datetime NOT NULL,
  PRIMARY KEY (`disposal_no`),
  KEY `FK_disposal_genre` (`genre_no`),
  CONSTRAINT `FK_disposal_genre` FOREIGN KEY (`genre_no`) REFERENCES `genre` (`genre_no`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8;

-- Dumping data for table library.disposal: ~10 rows (대략적)
/*!40000 ALTER TABLE `disposal` DISABLE KEYS */;
INSERT INTO `disposal` (`disposal_no`, `book_code`, `disposal_bookname`, `disposal_author`, `genre_no`, `disposal_publisher`, `disposal_registerday`) VALUES
	(15, '1', 'java basic', '박성환', 1, '스마트정보교육원', '2017-01-26 17:28:31'),
	(16, '9', '1', '1', 1, '1', '2017-02-03 15:42:11'),
	(17, '12', '1', '1', 1, '1', '2017-02-03 15:42:11'),
	(18, '13', '1', '1', 1, '1', '2017-02-03 15:42:11'),
	(19, '14', '1', '1', 1, '1', '2017-02-03 15:42:11'),
	(20, '15', '1', '1', 1, '1', '2017-02-03 15:42:11'),
	(22, '16', '1', '1', 1, '1', '2017-02-03 15:42:11'),
	(23, '17', '12', '12', 1, '12', '2017-02-03 15:54:46'),
	(24, '19', 'java basic', '박성환', 1, '스마트정보교육원', '2017-01-26 17:28:31'),
	(25, '4', 'node.js', '1', 2, '1', '2017-02-03 16:57:50');
/*!40000 ALTER TABLE `disposal` ENABLE KEYS */;


-- 프로시저 library의 구조를 덤프합니다. disposal_book
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `disposal_book`(IN _payment int(10), IN _rental_code VARCHAR(20), IN _book_code VARCHAR(20), OUT RESULT INT)
BEGIN
	/* 만약 SQL에러라면 ROLLBACK 처리한다. */
	DECLARE exit handler for SQLEXCEPTION
	BEGIN
		ROLLBACK;        
		SET RESULT = -1;  
	END;

	/* 트랜젝션 시작 */
	START TRANSACTION;
		update rental
		set rental_end=sysdate(), rental_payment=_payment,rentalstate_no=2 
		where rental_code=_rental_code; 


		update book 
		set book.state_no='1'
 		where book.book_code=_book_code; 


	/* 커밋 */
	COMMIT;
	SET RESULT = 0;
END//
DELIMITER ;


-- 이벤트 library의 구조를 덤프합니다. disposal_event
DELIMITER //
CREATE DEFINER=`root`@`localhost` EVENT `disposal_event` ON SCHEDULE EVERY 1 DAY STARTS '2017-02-03 16:31:01' ON COMPLETION NOT PRESERVE ENABLE DO delete book from book, disposal where book.book_code = disposal.book_code//
DELIMITER ;


-- 테이블 library의 구조를 덤프합니다. genre
CREATE TABLE IF NOT EXISTS `genre` (
  `genre_no` int(11) NOT NULL AUTO_INCREMENT,
  `genre_name` varchar(50) NOT NULL,
  PRIMARY KEY (`genre_no`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- Dumping data for table library.genre: ~4 rows (대략적)
/*!40000 ALTER TABLE `genre` DISABLE KEYS */;
INSERT INTO `genre` (`genre_no`, `genre_name`) VALUES
	(1, '문학'),
	(2, '소설'),
	(3, '수필'),
	(4, '참고서');
/*!40000 ALTER TABLE `genre` ENABLE KEYS */;


-- 테이블 library의 구조를 덤프합니다. library
CREATE TABLE IF NOT EXISTS `library` (
  `library_id` varchar(50) NOT NULL,
  `library_pw` varchar(50) NOT NULL,
  `local_no` int(10) NOT NULL,
  PRIMARY KEY (`library_id`),
  KEY `FK_library_local` (`local_no`),
  CONSTRAINT `FK_library_local` FOREIGN KEY (`local_no`) REFERENCES `local` (`local_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Dumping data for table library.library: ~6 rows (대략적)
/*!40000 ALTER TABLE `library` DISABLE KEYS */;
INSERT INTO `library` (`library_id`, `library_pw`, `local_no`) VALUES
	('1', '1', 1),
	('12', '12', 1),
	('123', '123', 1),
	('4', '4', 1),
	('l01', 'pw01', 2),
	('l02', 'pw02', 1);
/*!40000 ALTER TABLE `library` ENABLE KEYS */;


-- 테이블 library의 구조를 덤프합니다. local
CREATE TABLE IF NOT EXISTS `local` (
  `local_no` int(11) NOT NULL AUTO_INCREMENT,
  `local_name` varchar(50) NOT NULL,
  PRIMARY KEY (`local_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- Dumping data for table library.local: ~2 rows (대략적)
/*!40000 ALTER TABLE `local` DISABLE KEYS */;
INSERT INTO `local` (`local_no`, `local_name`) VALUES
	(1, '서울'),
	(2, '전주');
/*!40000 ALTER TABLE `local` ENABLE KEYS */;


-- 테이블 library의 구조를 덤프합니다. member
CREATE TABLE IF NOT EXISTS `member` (
  `member_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_name` varchar(50) NOT NULL,
  `member_phone` varchar(50) NOT NULL,
  `memberlevel_no` int(11) NOT NULL,
  PRIMARY KEY (`member_id`),
  KEY `FK_member_memberlevel` (`memberlevel_no`),
  CONSTRAINT `FK_member_memberlevel` FOREIGN KEY (`memberlevel_no`) REFERENCES `memberlevel` (`memberlevel_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

-- Dumping data for table library.member: ~6 rows (대략적)
/*!40000 ALTER TABLE `member` DISABLE KEYS */;
INSERT INTO `member` (`member_id`, `member_name`, `member_phone`, `memberlevel_no`) VALUES
	(1, 'kim', '01088882222', 2),
	(2, 'hong', '01011112222', 1),
	(3, 'park', '01011112222', 1),
	(4, '4', '4', 1),
	(5, 'kkekeki', '12908910', 2),
	(6, 'umin', '01101010', 2);
/*!40000 ALTER TABLE `member` ENABLE KEYS */;


-- 테이블 library의 구조를 덤프합니다. memberlevel
CREATE TABLE IF NOT EXISTS `memberlevel` (
  `memberlevel_no` int(10) NOT NULL AUTO_INCREMENT,
  `memberlevel_name` varchar(50) NOT NULL,
  `price` int(10) NOT NULL,
  PRIMARY KEY (`memberlevel_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- Dumping data for table library.memberlevel: ~2 rows (대략적)
/*!40000 ALTER TABLE `memberlevel` DISABLE KEYS */;
INSERT INTO `memberlevel` (`memberlevel_no`, `memberlevel_name`, `price`) VALUES
	(1, '무료회원', 500),
	(2, '유료회원', 300);
/*!40000 ALTER TABLE `memberlevel` ENABLE KEYS */;


-- 테이블 library의 구조를 덤프합니다. payment
CREATE TABLE IF NOT EXISTS `payment` (
  `payment_no` int(10) NOT NULL AUTO_INCREMENT,
  `payment_name` varchar(50) DEFAULT NULL,
  `payment_value` int(10) DEFAULT NULL,
  PRIMARY KEY (`payment_no`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

-- Dumping data for table library.payment: ~0 rows (대략적)
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;


-- 테이블 library의 구조를 덤프합니다. rental
CREATE TABLE IF NOT EXISTS `rental` (
  `rental_code` varchar(50) NOT NULL,
  `book_code` int(11) DEFAULT NULL,
  `book_code_clone` int(10) DEFAULT NULL,
  `rental_start` datetime NOT NULL,
  `rental_end` datetime DEFAULT NULL,
  `member_id` int(10) NOT NULL,
  `rental_payment` int(10) NOT NULL,
  `rentalstate_no` int(10) NOT NULL DEFAULT '1',
  `auto_num` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`rental_code`),
  KEY `FK_rental_member` (`member_id`),
  KEY `FK_rental_rentalstate` (`rentalstate_no`),
  KEY `FK_rental_book` (`book_code`),
  KEY `auto_num` (`auto_num`),
  CONSTRAINT `FK_rental_book_code` FOREIGN KEY (`book_code`) REFERENCES `book` (`book_code`) ON DELETE SET NULL,
  CONSTRAINT `FK_rental_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `FK_rental_rentalstate` FOREIGN KEY (`rentalstate_no`) REFERENCES `rentalstate` (`rentalstate_no`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8;

-- Dumping data for table library.rental: ~6 rows (대략적)
/*!40000 ALTER TABLE `rental` DISABLE KEYS */;
INSERT INTO `rental` (`rental_code`, `book_code`, `book_code_clone`, `rental_start`, `rental_end`, `member_id`, `rental_payment`, `rentalstate_no`, `auto_num`) VALUES
	('100029', NULL, 1, '2017-02-01 00:00:00', '2017-02-03 16:16:00', 1, 0, 2, 30),
	('12313', 10, 10, '2017-01-19 00:00:00', '2017-01-26 17:33:18', 1, 3500, 2, 29),
	('400005', 5, 5, '2017-01-04 00:00:00', '2017-01-26 14:28:30', 1, 11000, 1, 6),
	('400006', 6, 6, '2017-01-04 00:00:00', '2017-01-26 15:20:16', 1, 11000, 1, 11),
	('400012', 7, 7, '2017-01-26 00:00:00', '2017-01-26 15:30:40', 1, 0, 2, 13),
	('400027', NULL, 4, '2017-01-11 00:00:00', '2017-02-03 16:57:38', 1, 11500, 2, 28);
/*!40000 ALTER TABLE `rental` ENABLE KEYS */;


-- 테이블 library의 구조를 덤프합니다. rentalstate
CREATE TABLE IF NOT EXISTS `rentalstate` (
  `rentalstate_no` int(10) NOT NULL AUTO_INCREMENT,
  `rentalstate_name` varchar(50) NOT NULL,
  PRIMARY KEY (`rentalstate_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- Dumping data for table library.rentalstate: ~2 rows (대략적)
/*!40000 ALTER TABLE `rentalstate` DISABLE KEYS */;
INSERT INTO `rentalstate` (`rentalstate_no`, `rentalstate_name`) VALUES
	(1, '대여'),
	(2, '반납');
/*!40000 ALTER TABLE `rentalstate` ENABLE KEYS */;


-- 테이블 library의 구조를 덤프합니다. state
CREATE TABLE IF NOT EXISTS `state` (
  `state_no` int(10) NOT NULL AUTO_INCREMENT,
  `state_name` varchar(50) NOT NULL,
  PRIMARY KEY (`state_no`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- Dumping data for table library.state: ~3 rows (대략적)
/*!40000 ALTER TABLE `state` DISABLE KEYS */;
INSERT INTO `state` (`state_no`, `state_name`) VALUES
	(1, '대여가능'),
	(2, '대여불가'),
	(3, '폐기');
/*!40000 ALTER TABLE `state` ENABLE KEYS */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
