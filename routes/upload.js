var express = require('express');
var router = express.Router();
var fs = require("fs");
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "35.192.76.250",
  user: "root",
  password: "5131",
  database: "dbo"
});

con.connect(function(err) {
  if (err) throw err;
});

/* CREATE or UPDATE movie from file */
router.post('/', function(req, res, next) {
    if (!req.files)
       res.status(400).send('No files were uploaded.');
    else {
      var file = req.files.file;

      return new Promise( ( resolve, reject ) => {
        file.mv('./sample_movies.txt', function(err) {
          if (err) return res.status(500).send('error');
        //  res.status(200).send('ok');
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
                let title = movie[0][1];
                var sql = "SELECT * FROM Movie WHERE lower(Title) LIKE lower(?)";
                return new Promise( ( resolve, reject ) => {
                  con.query(sql, [`${title.toLowerCase()}`], function (err, result) {
                    if (err) return reject(err); 
                    resolve(result);
                  });
                })
                .then((result) => {
                  // if there's no such movie in DB, create one
                  if (result[0] === undefined) {
                    updOrCreateMovie('POST');
                  }
                  // if there is one, update movie details
                  else {
                    updOrCreateMovie('PUT', result[0].Id);
                  }
                })
                .catch(error => console.log(error.message));
  
              // creates or updates a movie 
              function updOrCreateMovie(method, id) {
                let stars = movie[3][1].split(', ');
  
                var postActor = function (el) { 
                  return new Promise((resolve, reject) => {
                    // check if this actor already exists in a DB
                    var sql = "SELECT * FROM Star WHERE lower(Name) LIKE lower(?)";
                    return new Promise( ( resolve, reject ) => {
                      con.query(sql, [`${el.toLowerCase()}`], function (err, result) {
                        if (err) return reject(err);
                        resolve(result);
                      })
                    })
                    .then((result) => {
                       // console.log("Result: " + JSON.parse(JSON.stringify(result)) );
                      if (result[0] === undefined) {
                          console.log("No such actor");
    
                          var sql = "INSERT INTO Star (Name) VALUES (?)";
                          con.query(sql, [el], function (err, result) {
                            if (err) throw err;
                           // console.log(result.insertId);
                            resolve({Id: result.insertId});
                          });
                      }
                      else {
                          console.log("match");
                          resolve({Id: result[0].Id});
                      }
                    });
                  })
                  .catch(error => console.log(error.message)); // end promise
                } // end postActor func
  
                let actions = stars.map(postActor);
                Promise.all(actions)
                  .then(data => data.map(el => el.Id))
                  .then(idArr => {
                    
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
  
                    if (method === 'POST') {
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
                    } // end if post
                    else {
                      var movieId = id;
                      return new Promise( ( resolve, reject ) => {
                        var sql = "UPDATE Movie SET Title = ?, Year = ?, Format = ? WHERE id = ?";
                        con.query(sql, [movie[0][1], movie[1][1], movie[2][1],  movieId], function (err, result) {
                          if (err) throw err;
                          resolve(result);
                        });
                      })
                      .then(r => {
                         var sql = "DELETE FROM MovieStar WHERE MovieId = ?";
                         con.query(sql, [movieId], function (err, result) {
                          if (err) throw err;
                          return result;
                         });
                      })
                      .then(r => {
                          postStarsArray(movieId);
                      }); 
                    } // end else (put)
                  })
                  .catch(error => console.log(error.message));
              } // end updOrCreate
  
              });  // end then(movie)
          };
          var actions = arr.map(handleMovie);
          Promise.all(actions)
          .then(data => res.status(200).send('OK'))
          .catch(error => console.log(error.message));
        }); // end fs
      });

    }
      
  });

  module.exports = router;