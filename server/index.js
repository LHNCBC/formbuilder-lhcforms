const fs = require('fs');

/**
 * Create a formbuilder express object and configure it, to preserve earlier behavior
 *
 * @param formbuilderConf - Form builder configuration (i.e. formbuilder.conf.js)
 * @returns {*}
 */
function createFormbuilder(formbuilderConf) {
  return configFormbuilder(require('express')(), formbuilderConf);
}

/**
 * Configure the given express object.
 *
 * This is useful to do formbuilder configuration on an already created and customized object
 *
 * @param app - Express app to be added with form builder configurations.
 * @param formbuilderConf - Form builder configuration (i.e. formbuilder.conf.js)
 *
 *
 */

function configFormbuilder(app, formbuilderConf) {
  // Remove x-powered-by:express default express header
  app.disable('x-powered-by');
  app.locals.config = formbuilderConf;
  
  if(formbuilderConf.firebaseAuthFile) {
    let fireAdmin = require("firebase-admin");
    // connect to google firebase with a service account
    let fireServiceAccount = require(formbuilderConf.firebaseAuthFile);

    let fireApp = fireAdmin.initializeApp({
      credential: fireAdmin.credential.cert(fireServiceAccount),
      databaseURL: formbuilderConf.firebaseClientConfig.databaseURL,
      databaseAuthVariableOverride: {
        uid: formbuilderConf.databaseAuthVariableOverrideUid
      }
    });

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
}

module.exports = {
  createFormbuilder: createFormbuilder,
  configFormbuilder: configFormbuilder
};
