/**
 * Main application routes
 */

'use strict';

var errorHandler = require('errorhandler');
var errors = require('./components/errors');
var firebaseFhir = require('lforms-firebase-fhir');


module.exports = function(app) {

  // Insert routes below

  var firebaseFhirOpts = {
    firebaseAdmin: app.locals.fireAdmin, // required
    defaultFhirUrl: 'http://hapi.fhir.org', // required
    mountPath: '/fhir-api',
    proxyPath: '/baseDstu3'
  };

  // All undefined asset or api routes should return a 404
  app.route('/:url(panel|api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  app.route('/notfound')
    .get(errors[404]);

  // Support 403 error. The client asks for redirect to this url
  app.route('/forbidden')
    .get(errors[403]);

  app.use(firebaseFhirOpts.mountPath, firebaseFhir(firebaseFhirOpts));

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendFile('index.html', {root: app.get('appPath')});
    });

  app.use(errorHandler()); // Error handler - has to be last
};
