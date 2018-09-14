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
  var arrToSend = [];

  return new Promise( ( resolve, reject ) => {
    con.query(sql, function ( err, result) {
      if ( err ) return reject( err );
      resolve( result );
    });
  })
  .then(result => JSON.parse(JSON.stringify(result)))
  .then(resultMovies => {
    resultMovies.forEach(movie => {
      let sql = "SELECT * FROM MovieStar WHERE MovieId = ?";
      con.query(sql, [movie.Id], function (err, result) {
        if (err) throw err;
        
        let movieIds = JSON.parse(JSON.stringify(result)); 
        movieIds.forEach(id => {
          var sql = "SELECT * FROM Star WHERE Id = ?";
          con.query(sql, [id.StarId], function (err, result) {
            if (err) throw err;
          
            var actors = {};
            let jsn = JSON.parse(JSON.stringify(result)); 
            actors.Stars = jsn[0].Name;
            let all4 = Object.assign(movie, actors);
            arrToSend.push(all4);
           // console.log(arrToSend); 
          });
        })
      });
    });
  //  return ???
  })
  .then(res.status(200).send(arrToSend));  // console.log('To send: ' + arrToSend)
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
router.delete('/:id', function(req, res, next) {

  var sql = "DELETE FROM Movie WHERE id = ?";
  con.query(sql, [req.params.id], function (err, result) {
    
    if (err) throw err;
    res.sendStatus(200);
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
