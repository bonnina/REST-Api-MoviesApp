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

/* GET all actors */
router.get('/', function(req, res, next) {
  console.log("Connected!");
  var sql = "SELECT * FROM Star ORDER BY name";  //WHERE lower(Name) LIKE lower('%?%')
  return new Promise( ( resolve, reject ) => {
    con.query(sql, function ( err, result) {   // [name],
      if ( err ) return reject( err );
      resolve( JSON.parse(JSON.stringify(result)) );
    });
  })
  .then(result => res.status(200).send(result))
  .catch(error => console.log(error.message));
});

/* GET actor by name. */
router.get('/:name', function(req, res, next) {
  console.log("Connected!");
  var sql = "SELECT * FROM Star WHERE lower(Name) LIKE lower(?)";
  con.query(sql, [`%${req.params.name.toLowerCase()}%`], function (err, result) {
    if (err) throw err;
    console.log( JSON.parse(JSON.stringify(result)) );

    res.status(200).send(result);
  });
});

/* Create actor */
router.post('/', function(req, res, next) {

    var sql = "INSERT INTO Star (Name) VALUES (?)";
    con.query(sql, [req.body.name], function (err, result) {
      
      if (err) throw err;

      console.log(result.insertId);

      res.status(201).send({Id: result.insertId});
    });
  });


module.exports = router;