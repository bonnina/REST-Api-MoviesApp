var express = require('express');
var router = express.Router();
var con = require('../services/database service');

/* GET all movies. */
router.get('/', function(req, res, next) {

  console.log("Connected!");
  var sql = "SELECT * FROM Movie ORDER BY title"; 

  return new Promise( ( resolve, reject ) => {
    con.query(sql, function ( err, result) {
      if ( err ) return reject( err );
      resolve( JSON.parse(JSON.stringify(result)) );
    });
  })
  .then(resultMovies => {
    var getStars = function (movie) { 

      return new Promise((resolve, reject) => {
        let sql = "SELECT MovieStar.StarId, Star.Name as StarName FROM MovieStar JOIN Star ON MovieStar.StarId = Star.Id WHERE MovieStar.MovieId = ?";
        con.query(sql, [movie.Id], function (err, result) {

          if (err) reject(err);
          movie.Stars = JSON.parse(JSON.stringify(result));
          resolve(movie);
        });
      });
    };

    var actions = resultMovies.map(getStars);
    Promise.all(actions)
      .then(data => res.status(200).send(data))
      .catch(error => console.log(error.message));
  })
  .catch(error => console.log(error.message));
});

/* GET movie by title. */
router.get('/:title', function(req, res, next) {
  console.log("Connected!");
  var sql = "SELECT * FROM Movie WHERE lower(Title) LIKE lower(?)";
  con.query(sql, [`%${req.params.title.toLowerCase()}%`], function (err, result) {
    if (err) throw err;
    console.log( JSON.parse(JSON.stringify(result)) );

    res.status(200).send(result);
  });
});

/* CREATE movie. */
router.post('/', function(req, res, next) {

    var sql = "INSERT INTO Movie (Title, Year, Format) VALUES (?, ?, ?)";
    con.query(sql, [req.body.title, req.body.year, req.body.format], function (err, result) {
      
      if (err) throw err;

      var movieId = result.insertId; 
      console.log(movieId);

      req.body.stars.forEach(star => {
        var sql = "INSERT INTO MovieStar (MovieId, StarId) VALUES (?, ?)";

        con.query(sql, [movieId, star], function (err, result) {
      
          if (err) throw err;
        })
      });

      res.status(201).send({movieId: movieId});
    });
  });

/* UPDATE movie */
router.put('/', function(req, res, next) {
  var movieId = req.body.id;
  var sql = "UPDATE Movie SET Title = ?, Year = ?, Format = ? WHERE id = ?";
  con.query(sql, [req.body.title, req.body.year, req.body.format, req.body.id], function (err, result) {
    
    if (err) throw err;
    
    var sql = "DELETE FROM MovieStar WHERE MovieId = ?";
    con.query(sql, [movieId], function (err, result) {
      if (err) throw err;
    });

    req.body.stars.forEach(star => {
      var sql = "INSERT INTO MovieStar (MovieId, StarId) VALUES (?, ?)";
      con.query(sql, [movieId, star], function (err, result) {
    
        if (err) throw err;
      })
    });
    
    res.status(201).send(result);  // {movieId: movieId}
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


module.exports = router;
