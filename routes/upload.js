var express = require('express');
var router = express.Router();

/* CREATE or UPDATE movie from file */
router.post('/', function(req, res, next) {
    if (!req.files)
       res.status(400).send('No files were uploaded.');
    else {
      var file = req.files.file;
      console.log(file);
      
      file.mv('./uploaded/sample_movies.txt', function(err) {
        if (err) {
            console.log(err);
            return res.status(500).send('error');
        }
     
        res.status(200).send('ok');
      });
    }
  });

  module.exports = router;