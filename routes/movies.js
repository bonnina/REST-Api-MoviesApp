var express = require('express');
var router = express.Router();
var con = require('../services/database service');
const getMovieByTitle = require('../methods/getMovieByTitle');
const getAllMovies = require('../methods/getAllMovies');
const createMovie =  require('../methods/createMovie');
const updateMovie = require('../methods/updateMovie');
const deleteMovie = require('../methods/deleteMovie');
const deleteAllMovies = require('../methods/deleteAllMovies');

/* GET all movies. */
router.get('/', function(req, res, next) {

  getAllMovies(function (result) {
    res.status(200).send(result);
  });
});

/* GET movie by title. */
router.get('/:title', function(req, res, next) {

  getMovieByTitle(req.params.title, function (result) {
    res.status(200).send(result);
  });
});
/*
router.get('/:title', function(req, res, next) {
  console.log("Connected!");
  var sql = "SELECT * FROM Movie WHERE lower(Title) LIKE lower(?)";
  con.query(sql, [`%${req.params.title.toLowerCase()}%`], function (err, result) {
    if (err) throw err;
    console.log( JSON.parse(JSON.stringify(result)) );

    res.status(200).send(result);
  });
});
*/

/* CREATE movie. */
router.post('/', function(req, res, next) {
  createMovie(req.body.title, req.body.year, req.body.format, req.body.stars, function (result) {
    res.status(201).send(result);
  });
});

/* UPDATE movie */
router.put('/', function(req, res, next) {
  updateMovie(req.body.title, req.body.year, req.body.format, req.body.id, req.body.stars, function (result) {
    res.status(201).send(result);
  });
});

/* DELETE movie */
router.delete('/:id', function(req, res, next) {
  deleteMovie(req.params.id, function (result) {
    res.sendStatus(200);
  //  res.status(200).send(result);  
  });
});

// DELETE all movies
router.delete('/', function(req, res, next) {
  deleteAllMovies(function (result) {
    res.sendStatus(200);
    //  res.status(200).send(result); 
  });
});

module.exports = router;
