var express = require('express');
var router = express.Router();

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "35.192.76.250",
  user: "root",
  password: "5131",
  database: "dbo"
});

con.connect(function(err) {

  if (err) throw err;
  console.log("Connected!");
});

/* GET all movies. */
router.get('/', function(req, res, next) {

  console.log("Connected!");
  var sql = "SELECT * FROM Movie ORDER BY title";
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.status(200).send(result);
  });
});

/* Create movie. */
router.post('/', function(req, res, next) {

    var sql = "INSERT INTO Movie (Title, Year, Format) VALUES (?, ?, ?)";
    con.query(sql, [req.body.title, req.body.year, req.body.format], function (err, result) {
      
      if (err) throw err;

      var movieId = result.insertId; 

      req.body.stars.forEach(star => {
        var sql = "INSERT INTO MovieStar (MovieId, StarId) VALUES (?, ?)";

        con.query(sql, [movieId, star], function (err, result) {
      
          if (err) throw err;
        })
      });

      res.status(201).send({movieId: movieId});
    });
  });

/* DELETE movie */
router.delete('/', function(req, res, next) {

  var sql = "DELETE FROM Movie WHERE id = ?";
  con.query(sql, [req.body.id], function (err, result) {
    
    if (err) throw err;
    res.status(200).send(result.affectedRows);
  });
});

/*
router.get('/', function(req, res, next) {
    console.log("Connected!");
    var sql = "SELECT * FROM Star WHERE Id = ?";
    con.query(sql, [req.body.id], function (err, result) {
      if (err) throw err;
      res.status(200).send(result);
    });
});
*/

module.exports = router;
