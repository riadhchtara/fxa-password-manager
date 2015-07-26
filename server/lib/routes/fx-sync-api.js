var FxSync = require('fx-sync');

module.exports = function () {
  var route = {};

  route.method = 'get';
  route.path = '/fx-sync-api';

  route.process = function (req, res) {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'X-Requested-With'
    });

    var prod = {
      syncAuthUrl: 'https://token.services.mozilla.com',
      fxaServerUrl: 'https://api.accounts.firefox.com/v1'
    };

    if (! ('email' in req.query) || ! ('password' in req.query)) {
      res.json({error: 'missing login'});
    }
    var sync = new FxSync({
      email: req.query['email'],
      password: req.query['password'],
    }, prod);

    function fetchData(type) {
      sync.fetch(type)
        .then(function (data) {
          res.json(data);
          console.log(JSON.stringify(data, null, 2));
        })
        .done();
    }

    fetchData('passwords');
  };
  return route;
};

