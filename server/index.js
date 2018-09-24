const fs = require('fs');

// Expose app
module.exports = function(config) {
  let express = require('express');

// Setup server
  let app = express();
// Remove x-powered-by:express default express header
  app.disable('x-powered-by');
  app.locals.config = config;
  
  if(config.firebaseAuthFile) {
    let fireAdmin = require("firebase-admin");
    // connect to google firebase with a service account
    let fireServiceAccount = require(config.firebaseAuthFile);

    let fireApp = fireAdmin.initializeApp({
      credential: fireAdmin.credential.cert(fireServiceAccount),
      databaseURL: config.firebaseClientConfig.databaseURL,
      databaseAuthVariableOverride: {
        uid: config.databaseAuthVariableOverrideUid
      }
    });

    console.log(fireApp.name);  // "[DEFAULT]"

    app.locals.fireAdmin = fireAdmin;
  }

// Setup server
  require('./express')(app);
  require('./routes')(app);
  
  app.start = function() {
    let server;
    if (app.locals.config.https) {
      const sslOptions = {
        key: fs.readFileSync(app.locals.config.keySslFile),
        cert: fs.readFileSync(app.locals.config.certSslFile),
        ca: fs.readFileSync(app.locals.config.caSslFile),
        honorCipherOrder: app.locals.config.honorCipherOrder
      };
      server = require('https').createServer(sslOptions, app);
    }
    else {
      server = require('http').createServer(app);
    }
    server.listen(app.locals.config.port || 9020, app.locals.config.host || 'localhost');
  };
  
  return app;
};
