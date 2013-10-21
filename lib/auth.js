var mongoose = require('mongoose')
  , util = require('util')
  , check = require('validator').check
  , crypto = require('crypto');

// model
function validatePresenceOf(value) {
  return value && value.length;
}

var UserSchema = new mongoose.Schema({
    email   : { type: String
              , validate: [validatePresenceOf, 'an email is required']
              , index: { unique: true } }
  , salt    : String
  , hash    : String
  , isAdmin : { type: Boolean, default: false }
});

UserSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.generateSalt();
    this.hash = this.hashPassword(password);
  })
  .get(function() { return this._password; });

UserSchema.pre('save', function(done) {
  if (!validatePresenceOf(this.password)) {
    done(new Error('Invalid password'));
  } else {
    done();
  }
});

// methods
UserSchema.methods.authenticate = function(password) {
  return this.hashPassword(password) === this.hash;
};

UserSchema.methods.generateSalt = function() {
  var bytes = 32;
  return crypto.randomBytes(bytes).toString('base64');
};

UserSchema.methods.hashPassword = function(password) {
  // compatible with authlogic crypted_password
  var iterations = 20;
  var algorithm = 'sha512';

  var blob = password + this.salt;
  for (var i = 0; i < iterations; i++) {
    blob = crypto.createHash('sha512').update(blob).digest("hex");
  }

  return blob;
};

User = mongoose.model('User', UserSchema);

// helpers
exports.register = function(req, res, done){
  var email = req.body.email;
  var password = req.body.password;
  var confirm = req.body.confirm;

  try {
    check(email, 'This doesn\'t look like an email address').len(5).isEmail();
    check(password, 'Password should be more than 6 characters long').len(6);
    check(password, 'Password doesn\'t match confirmation').equals(confirm);
   
    User.findOne({ email: email }, function(err, user) {
    if (user) {
      req.session.alert = 'You already have an account!';
      done();
    }
    else {
      var user = User({
        email: email, 
        password: password
      });
      user.save();

      req.session.email = email;
      done();
    }
  });
  }
  catch (e) {
    req.session.alert = e.message;
    done();
  }
}

exports.login = function(req, res, done){
  var email = req.body.email;
  var password = req.body.password;

  User.findOne({ email: email }, function(err, user) {
    if (user && user.authenticate(password)) {
      req.session.email = email;
    }
    else {
      req.session.alert = 'Invalid email or password';
    }
    done();
  });
}

exports.logout = function(req, res, done){
  delete req.session.email;
  done();
}

exports.middleware = function(req, res, done) {
  // get user
  res.locals.user = null;
  var email = req.session.email;
  if (email) {
    User.findOne({ email: email }, function(err, user) {
      if (user) {
        res.locals.user = user;
      }
      done();
    });
  }
  else {
    done();
  }
};
