exports.index = function(req, res){
  Show.find().select('name').select('fanart').exists('updated').sort('name')
  .exec(function(err, shows){
    res.render('index', { shows: shows });
  });
};

exports.search = function(req, res){
  res.writeHead(200, {'Content-Type': 'application/json'});

  if (!req.query.query) return res.end();

  Show.find({ name: new RegExp(RegExp.escape(req.query.query), 'i') })
  .limit(8).select('name').sort('-updated')
  .exec(function(err, shows){
    var names = shows.map(function(item){ return item.name });
    res.end(JSON.stringify(names));
  });
};

exports.show = function(req, res){
  Show.findOne({ name: req.params.name }, function(err, show) {
    if (show) {
      res.render('show', { show: show });
    }
    else {
      res.redirect('/');
    }
  });
};

exports.add_show = function(req, res){
  Show.findOne({ name: req.body.show }, function(err, show) {
    if (show) {
      show.updateData(function(){});
    }
    else {
      req.session.message = req.body.show + ' doesn\'t exist.';
    }
    res.redirect('/');
  });
};

exports.account = function(req, res){
  res.render('account');
};
