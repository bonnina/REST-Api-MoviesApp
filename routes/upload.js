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

/* CREATE or UPDATE movie from file */
router.post('/', function(req, res, next) {
    if (!req.files)
       res.status(400).send('No files were uploaded.');
    else {
      var f = req.files.movies;
      console.log(f);
    }
  });