var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , stylus = require('stylus')
  , mongoose = require('mongoose')
  , auth = require('./lib/auth')
  , mongoStore = require('connect-mongodb')
  , shows = require('./db');

var db = mongoose.connect('mongodb://' + process.env.MONGO_SERVER);

var app = express();
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: process.env.EXPRESS_SECRET, 
                            store: mongoStore({ dbname: db.connections[0].name,
                                                  host: db.connections[0].host,
                                                  port: db.connections[0].port })}));
  app.use(auth.middleware);
  app.use(function(req, res, done){
    res.locals.message = req.session.message || null;
    delete req.session.message;
    res.locals.alert = req.session.alert || null;
    delete req.session.alert;
    done();
  });
  app.use(app.router);
  app.use(stylus.middleware({ src: __dirname + '/public' }));
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

// utils
RegExp.escape = function( value ) {
  return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
};

// routes
app.get('/', routes.index);
app.get('/search', routes.search);

app.post('/show', routes.add_show);

app.get('/show/:name', routes.show);

app.get('/account', routes.account);

app.get('/logout', auth.logout, function(req, res){
  res.redirect('back');
});
app.post('/login', auth.login, function(req, res) {
  res.redirect('back');
});
app.post('/register', auth.register, function(req, res) {
  res.redirect('back');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("sked ready on " + app.get('port'));
});
