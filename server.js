// SERVER-SIDE JAVASCRIPT

//require express in our app
var express = require('express'),
    app = express(),
    appPort = process.env.PORT || 3000;

// serve static files from key folders
app.use('/styles', express.static('styles'));
app.use('/scripts', express.static('scripts'));
app.use('/lib', express.static('lib'));

/**********
 * ROUTES *
 **********/
app.get('/', function homepage (req, res) {
  res.sendFile(__dirname + '/index.html');
});

/**********
 * SERVER *
 **********/

// listen on port 3000
app.listen(appPort, function () {
  console.log('Express server is running on http://localhost:3000/');
});