'use strict';

const path = require('path');
const fs = require('fs');
// Read http option. The default is to use https.
// For docker use case, user could opt for http using USE_HTTP env variable.

// All configurations will extend these options
// ============================================
let all = {
  env: process.env.NODE_ENV || 'development',
  
  // Root path of server
  root: __dirname,
  gtag: 'UA-XXXXXXXX-X',
  
  host: '::',
  port: 9020,
  
  https: true,
  // https certificate
  keySslFile: path.join(__dirname, '../ssl/server.key'),
  certSslFile: path.join(__dirname, '../ssl/server.crt'),
  caSslFile: path.join(__dirname, '../ssl/ca.crt'),
  // Disable use of RC4
  honorCipherOrder: true
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = all || {};
