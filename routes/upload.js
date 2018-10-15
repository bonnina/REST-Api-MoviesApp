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
      console.log(file);
      return new Promise( ( resolve, reject ) => {
        file.mv('./uploaded/sample_movies.txt', function(err) {
          if (err) {
            console.log(err);
            return res.status(500).send('error');
          }
          res.status(200).send('ok');
          resolve();
        });
      })
      .then(() => {
        fs.readFile('./uploaded/sample_movies.txt', 'utf8', function (error, data) {
          if (error) throw error;
       
          var str = data.toString();
          let arr = str.split('\n\n').map(el => el.split('\n'));

          arr.forEach((m) => {
            return new Promise( ( resolve, reject ) => {
              var movie =  m.map(el => el.split(': '));
              resolve(movie);
            })
            .then((movie) => {
             // console.log("Movie: " + movie);
              if (movie[0] === undefined) {
                return;
              }
              // first, check if the movie already exists in DB
              let title = JSON.stringify(movie[0][1]);
              var sql = "SELECT * FROM Movie WHERE lower(Title) LIKE lower(?)";
              return new Promise( ( resolve, reject ) => {
                con.query(sql, [`%${title.toLowerCase()}%`], function (err, result) {
                  if (err) throw err; 
                  resolve(result);
                });
              })
              .then((result) => {
                // if there's no such movie in DB, create one
                if (result[0] === undefined) {
                  updOrCreate('POST');
                }
                // if there is one, update movie details
                else {
                  updOrCreate('PUT', result[0].Id);
                }
              })
              .catch(error => console.log(error.message));

            // creates or updates a movie 
            function updOrCreate(method, id) {
              let stars = movie[3][1].split(', ');

              var postActor = function (el) { 
                return new Promise((resolve, reject) => {
                  // check if this actor already exists in a DB
                  var sql = "SELECT * FROM Star WHERE lower(Name) LIKE lower(?)";
                  return new Promise( ( resolve, reject ) => {
                    con.query(sql, [`%${el.toLowerCase()}%`], function (err, result) {
                      if (err) throw err;
                      resolve(result);
                    })
                  })
                  .then((result) => {
                      console.log("Result: " + JSON.parse(JSON.stringify(result)) );
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
                .then(data => {
                  let idArr = data.map(el => el.Id);

                  if (method === 'POST') {
                    var sql = "INSERT INTO Movie (Title, Year, Format) VALUES (?, ?, ?)";
                    con.query(sql, [movie[0][1], movie[1][1], movie[2][1]], function (err, result) {
                      if (err) throw err;
                      var movieId = result.insertId;

                      idArr.forEach(star => {
                        var sql = "INSERT INTO MovieStar (MovieId, StarId) VALUES (?, ?)";
                        con.query(sql, [movieId, star], function (err, result) {
                         if (err) throw err;
                        })
                      });
                    });
                  } // end if post
                  else {
                    var movieId = id;
                    var sql = "UPDATE Movie SET Title = ?, Year = ?, Format = ? WHERE id = ?";
                    con.query(sql, [req.body.title, req.body.year, req.body.format, req.body.id], function (err, result) {
                      if (err) throw err;
    
                       var sql = "DELETE FROM MovieStar WHERE MovieId = ?";
                       con.query(sql, [movieId], function (err, result) {
                        if (err) throw err;
                       });

                       idArr.forEach(star => {
                         var sql = "INSERT INTO MovieStar (MovieId, StarId) VALUES (?, ?)";
                         con.query(sql, [movieId, star], function (err, result) {
                           if (err) throw err;
                         })
                       });
                      
                   }); 
                  } // end else (put)
                })
                .catch(error => console.log(error.message));
            } // end updOrCreate

            });  // end then(movie)
          }) // end arr.forEach()
        }); // end fs
      });

    }
      
  });

  module.exports = router;