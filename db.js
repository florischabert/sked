var mongoose = require('mongoose')
  , request = require('request')
  , async = require('async');

var EpisodeSchema = new mongoose.Schema({
    tvdbID    : { type: String, index: { unique: true } }
  , imdbID    : String
  , name      : String
  , directors : [ String ]
  , writers   : [ String ] 
  , overview  : String
  , season    : Number
  , episode   : Number
  , absolute  : String
  , rating    : Number
  , air       : String
});
Episode = mongoose.model('Episode', EpisodeSchema);

var ShowSchema = new mongoose.Schema({
    tvdbID   : { type: String, index: { unique: true } }
  , name     : String
  , imdbID   : String
  , network  : String
  , genres   : [ String ]
  , actors   : [ String ] 
  , overview : String
  , status   : String
  , runtime  : String
  , airtime  : String
  , rating   : Number
  , updated  : String
  , poster   : String
  , fanart   : String
  , Episodes : [ Episode ]
});

ShowSchema.methods.updateData = function(done) {
  var url = 'http://www.thetvdb.com';

  var showUrl = url+'/api/'+key+'/series/'+this.tvdbID+'/all/en.xml';
  var show = this;

  request(showUrl, function (err, res, body) {
    if (err || res.statusCode != 200) {
      throw Error('Can\'t get '+url+' ('+res.statusCode+')');
    }
    
    var data = etree.parse(body);

    show.name = data.findtext('Series/SeriesName');
    show.imdbID = data.findtext('Series/IMDB_ID');
    show.network = data.findtext('Series/Network');
    show.genres = data.findtext('Series/Genre').slice(1, -1).split('|');
    show.actors = data.findtext('Series/Actors').slice(1, -1).split('|');
    show.overview = data.findtext('Series/Overview');
    show.status = data.findtext('Series/Status');
    show.runtime = data.findtext('Series/Runtime');
    show.poster = url+'/banners/'+data.findtext('Series/poster');
    show.fanart = url+'/banners/'+data.findtext('Series/fanart');
    show.airtime = data.findtext('Series/Airs_Time');
    var rating_raw = parseFloat(data.findtext('Series/Rating'));

    show.updated = data.findtext('Series/lastupdated');

    show.save(function(err) {
      done();
    });
  });
};

ShowSchema.statics.updateAllData = function(done) {
  Show.find().exists('updated').exec(function(err, shows) {
    shows.map(function(show) {
      show.updateData();
    });
    done();
  });
};

ShowSchema.statics.fetchAll = function(done) {
  var url = 'http://www.thetvdb.com';
  
  var listUrl = url+'?string=&searchseriesid=&tab=listseries&function=Search';
  request(listUrl, function (err, res, body) {
    if (err || res.statusCode != 200) {
      throw Error('Can\'t get '+url+' ('+res.statusCode+')');
    }

    var regex = /<tr>.*<\/a>.*English.*<td.*<\/td><\/tr>/g
    var lines = body.match(regex);

    regex = /<tr>.*<a .*>(.*)\<\/a>.*English.*<td .*>(.*)<\/td><\/tr>/

    async.forEach(lines, function(line, cb){
      var data = line.match(regex);
      var name = data[1];
      var tvdbID = data[2];
       
      Show.findOne({ tvdbID: tvdbID }, function(err, show){
        if (!show) {
          show = new Show({
              name: name
            , tvdbID: tvdbID
          });
          show.save();
        }
      });
      cb();

    }, function(err) {
      done();
    });
  });
};

ShowSchema.statics.fetchWithID = function(tvdbID, done) {
  Show.findOne({ tvdbID: tvdbID }, function(err, show){
    if (!show) {
      show = new Show({ tvdbID: tvdbID });
      show.save();
    }
    show.updateData(done);
  });
};

Show = mongoose.model('Show', ShowSchema);
