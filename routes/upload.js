var express = require('express');
var router = express.Router();
var fs = require("fs");
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
      const file = req.files.file;

      return new Promise( ( resolve, reject ) => {
        file.mv('./views/sample_movies.txt', function(err) {
          if (err) return res.status(500).send('error');
          resolve();
        });
      })
      .then(() => {
        fs.readFile('./views/sample_movies.txt', 'utf8', function (error, data) {
          if (error) throw error;
       
          const str = data.toString();
          const arr = str.split('\n\n').map(el => el.split('\n'));
          
          const actions = arr.map(handleMovie);
          Promise.all(actions)
          .then(() => res.sendStatus(200))
          .catch(error => console.log(error.message));
        }); 
      });
    }
  });
  
  const handleMovie = function(m) {
    let movie =  m.map(el => el.split(': '));
      if (movie[0] === undefined) {
        return;
      }
      // first, check if the movie already exists in DB
      return new Promise( ( resolve, reject ) => {
        getMovieByTitle(movie[0][1], (result) => resolve(result));
      })
      .then((result) => {
        // if no - create 
        if (result[0] === undefined) {
          updOrCreateMovie(movie, 'POST');
        }
        // if there is one, update
        else {
          updOrCreateMovie(movie, 'PUT', result[0].Id);
        }
      })
      .catch(error => console.log(error.message));
  };

  // adds an actor to the DB or returns actor's id
  let postActor = function (el) { 
    return new Promise((resolve, reject) => {
      return new Promise( ( resolve, reject ) => {
        getActorByName(el, (result) => resolve(result) );
      })
      .then((result) => {
         console.log(result);
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
        if (method === 'POST') {
          createMovie(movie[0][1], movie[1][1], movie[2][1], idArr, function (result) {
            console.log("Added movie: " + result);
          });
        }
        else {  // PUT
          updateMovie(movie[0][1], movie[1][1], movie[2][1], id, idArr, function (result) {
            console.log("Updated movie: " + result);
          });
        } 
      })
      .catch(error => console.log(error.message));
  }  

  module.exports = router;