/**
 * Express configuration
 */

'use strict';

let express = require('express');
let favicon = require('serve-favicon');
let compression = require('compression');
let bodyParser = require('body-parser');
let methodOverride = require('method-override');
let cookieParser = require('cookie-parser');
let path = require('path');
let csp = require('helmet-csp');

module.exports = function(app) {
  let env = app.get('env');

  app.set('views', app.locals.config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());

  if(app.locals.config.https) {
    let hsts = require('hsts');
    app.use(hsts({
      // 31536000000 = One year in millis
      maxAge: 31536000000
    }));
  }

  // Set CSP header
  app.use(csp({
    // Specify directives as normal.
    directives: {
     // defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://www.gstatic.com', 'https://www.google-analytics.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https://www.google-analytics.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com']
    },

    // This module will detect common mistakes in your directives and throw errors
    // if it finds any. To disable this, enable "loose mode".
    loose: false,

    // Set to true if you want to disable CSP on Android where it can be buggy.
    disableAndroid: false,
  }));

  if ('production' === env) {
    // basic HTTP authentication in production mode
    app.use(favicon(path.join(app.locals.config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(app.locals.config.root, 'public')));
    app.set('appPath', app.locals.config.root + '/public');
  }

  if ('development' === env || 'test' === env) {
//    app.use(require('connect-livereload')());
    app.use(express.static(path.join(app.locals.config.root, '.tmp')));
    app.use(express.static(path.join(app.locals.config.root, 'client')));
    app.set('appPath', 'client');
  }
};
