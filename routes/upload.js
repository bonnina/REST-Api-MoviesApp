var express = require('express');
var router = express.Router();
var fs = require("fs");
var con = require('../services/database service');
const getMovieByTitle = require('../methods/getMovieByTitle');
const createMovie =  require('../methods/createMovie');
const updateMovie = require('../methods/updateMovie');
const getActorByName = require('../methods/getActorByName');
const createActor = require('../methods/createActor');

/* CREATE or UPDATE movie from file */
router.post('/', function(req, res, next) {
    if (!req.files)
       res.status(400).send('No files were uploaded.');
    else {
      var file = req.files.file;

      return new Promise( ( resolve, reject ) => {
        file.mv('./sample_movies.txt', function(err) {
          if (err) return res.status(500).send('error');
          resolve();
        });
      })
      .then(() => {
        fs.readFile('./sample_movies.txt', 'utf8', function (error, data) {
          if (error) throw error;
       
          var str = data.toString();
          let arr = str.split('\n\n').map(el => el.split('\n'));

          var handleMovie = function(m) {
            return new Promise( ( resolve, reject ) => {
                var movie =  m.map(el => el.split(': '));
                resolve(movie);
              })
              .then((movie) => {
                if (movie[0] === undefined) {
                  return;
                }

                // first, check if the movie already exists in DB
                return new Promise( ( resolve, reject ) => {
                  getMovieByTitle(movie[0][1], (result) => resolve(result));
                })
                .then((result) => {
                  // if there's no such movie in DB, create one
                  if (result[0] === undefined) {
                    updOrCreateMovie(movie, 'POST');
                  }
                  // if there is one, update movie details
                  else {
                    updOrCreateMovie(movie, 'PUT', result[0].Id);
                  }
                })
                .catch(error => console.log(error.message));
              });  // end then(movie)
          };
          var actions = arr.map(handleMovie);
          Promise.all(actions)
          .then(data => res.sendStatus(200))
          .catch(error => console.log(error.message));
        }); // end fs
      });
    }
  });

  // adds an actor to the DB (if there isn't one) or returns actor's id
  let postActor = function (el) { 
    return new Promise((resolve, reject) => {
      return new Promise( ( resolve, reject ) => {
        getActorByName(el, (result) => resolve(result) );
      })
      .then((result) => {
         // console.log("Result: " + JSON.parse(JSON.stringify(result)) );
        if (result[0] === undefined) {
          console.log("No such actor");
          createActor(el, (result) => resolve(result) );
        }
        else {
          console.log("match");
          resolve({Id: result[0].Id});
        }
      });
    })
    .catch(error => console.log(error.message)); 
  } 

  // creates or updates a movie 
  function updOrCreateMovie(movie, method, id) {
    let stars = movie[3][1].split(', ');
    
    let actions = stars.map(postActor);
    Promise.all(actions)
      .then(data => data.map(el => el.Id))
      .then(idArr => {
      /*   
        // adds an array of star IDs to the DB
        function postStarsArray(movieId) {
          var addStar = function(star) {
              return new Promise( ( resolve, reject ) => {
                var sql = "INSERT INTO MovieStar (MovieId, StarId) VALUES (?, ?)";
                con.query(sql, [movieId, star], function (err, result) {
                  if (err) throw err;
                  resolve(result);
                })
             });
            };
            var actions = idArr.map(addStar);
            Promise.all(actions)
            .then((data) => {
                //console.log(data)
            })
            .catch(error => console.log(error.message));
        }
      */
        if (method === 'POST') {
          createMovie(movie[0][1], movie[1][1], movie[2][1], idArr, function (result) {
            console.log("Added movie: " + result);
          });
        /*
          return new Promise( ( resolve, reject ) => {
          var sql = "INSERT INTO Movie (Title, Year, Format) VALUES (?, ?, ?)";
          con.query(sql, [movie[0][1], movie[1][1], movie[2][1]], function (err, result) {
            if (err) return reject(err);
            resolve(result.insertId);
          });
          })
          .then((movieId) => {
              postStarsArray(movieId);
          })
          .catch(error => console.log(error.message));
        */
        }
        else {
          updateMovie(movie[0][1], movie[1][1], movie[2][1], id, idArr, function (result) {
            console.log("Updated movie: " + result);
          });
        } 
      })
      .catch(error => console.log(error.message));
  }  

  module.exports = router;