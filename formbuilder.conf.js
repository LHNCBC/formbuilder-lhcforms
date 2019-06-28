'use strict';

// const path = require('path');

// All configurations will extend these options
// ============================================
let all = {
  env: process.env.NODE_ENV || 'development',
  
  // Root path of server
  root: __dirname,
  // Tracking ID for google analytics.
  gtag: '',
  
  host: '::',
  port: 9030,
  
  https: false, // To enable https, set this to true and specify the ssl files below.
  // keySslFile: path.join(__dirname, '../ssl/server.key'),
  // certSslFile: path.join(__dirname, '../ssl/server.crt'),
  // caSslFile: path.join(__dirname, '../ssl/ca.crt'),
  // honorCipherOrder: true
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = all || {};
