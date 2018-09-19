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

/* GET actors */
router.get('/', function(req, res, next) {
  console.log("Connected!");
  var sql = "SELECT * FROM Star";  //WHERE lower(Name) LIKE lower('%?%')
  return new Promise( ( resolve, reject ) => {
    con.query(sql, function ( err, result) {   // [name],
      if ( err ) return reject( err );
      resolve( JSON.parse(JSON.stringify(result)) );
    });
  })
  .then(result => res.status(200).send(result))
  .catch(error => console.log(error.message));

});


module.exports = router;