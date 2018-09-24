/**
 * Main application file
 */

'use strict';

// Set default node environment to development

const path = require('path');
const fs = require('fs');


function verifyConfig(config) {
  console.log(JSON.stringify(config, null, 2));
  let messages = [];
  if(config) {
    config.firebaseAuthFile || messages.push('firebaseAuthFile: Please specify required firebase service authorization file.');
    config.keySslFile || messages.push('keySslFile: Please specify required ssl key file.');
    config.certSslFile || messages.push('certSslFile: Please specify ssl certificate file.');
    config.caSslFile || messages.push('caSslFile: Please specify ssl certificate authority file.');
  }
  else {
    messages.push('Missing configuration options');
  }
  
  if(messages.length > 0) {
    console.log(messages.join('\n'));
    process.exit(1);
  }
}


function filePath(filename) {
  
  const filepath = path.join(__dirname, filename);
  if(fs.existsSync(filepath)) {
    return filepath;
  }
  else {
    console.log(filepath + ' does not exist.');
    process.exit(1);
  }
}

const optionDefinitions = [
  // Master config file. See formbuilder.conf.js for example of the format
  // Any options set on the command line will override config.
  {name: 'config', alias: 'c', type: filePath},
  {name: 'env', alias: 'e', type: String},
  
  {name: 'host', alias: 'h', type: String},
  {name: 'port', alias: 'p', type: Number, defaultValue: 9020},
  
  // SSL options
  {name: 'keySslFile', alias: 'k', type: filePath},
  {name: 'certSslFile', alias: 't', type: filePath},
  {name: 'caSslFile', alias: 'a', type: filePath},
  {name: 'honorCipherOrder', alias: 'r', type: Boolean, defaultValue: true},

  // Firebase options
  {name: 'firebaseAuthFile', alias: 'f', type: filePath},
  {name: 'firebaseURL', alias: 'u', type: String},
  {name: 'databaseAuthVariableOverrideUid', alias: 'o', type: String}
];

const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);
let initConfig = {};

if(options.config) {
  initConfig = require(options.config);
  delete options.config;
}

let config = Object.assign({}, initConfig, options);

process.env.NODE_ENV = options.env || process.env.NODE_ENV || 'development';

verifyConfig(config);

let app = require('./server')(config);
app.start();
// Expose app
exports = module.exports = app;
