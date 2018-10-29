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
    if(config.https) {
      config.keySslFile || messages.push('keySslFile: Please specify required ssl key file.');
      config.certSslFile || messages.push('certSslFile: Please specify ssl certificate file.');
      config.caSslFile || messages.push('caSslFile: Please specify ssl certificate authority file.');
    }
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
  {name: "help", alias: 'h', type: Boolean, description: 'Print this usage guide.'},
  {name: 'config', alias: 'c', type: filePath, description: 'Provide configuration file. See {bold formbuilder.conf.js} for details and modify to suit your requirements.'},
  {name: 'env', alias: 'e', type: String, description: 'Set node environment. Default is {bold development}.'},
  
  {name: 'host', type: String, description: 'Host name or IP address to which the server binds the network interface. Default is "::", i.e binds to all local network interfaces.'},
  {name: 'port', alias: 'p', type: Number, defaultValue: 9020, description: 'Port number on which the server listens to.\n'},
  {name: 'https', alias: 's', type: Boolean, defaultValue: false, description: 'Use https protocol. Default is false. If true, must specify ssl settings\n'},

  // SSL options
  {name: 'keySslFile', alias: 'k', type: filePath, description: 'Provide SSL key file.'},
  {name: 'certSslFile', alias: 't', type: filePath, description: 'Provide SSL certificate file.'},
  {name: 'caSslFile', alias: 'a', type: filePath, description: 'Provide SSL certificate authority file.'},
  {name: 'honorCipherOrder', alias: 'r', type: Boolean, defaultValue: true, description: 'Set to to follow cipher order. The default is true.'},
];

const usage_sections = [
  {
    header: 'Usage',
    content: [
      '$ node app [options] ...',
    ]
  },
  {
    header: 'Synopsis',
    content: [
      'The options are typically set in formbuilder.conf.js file. You can override any of those options from the command line arguments. By default, the server looks for the configuration file in the directory where app.js is. You could also provide your own configuration file with -c option.',
    ]
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  },
  {
    header: 'Examples',
    content: [
      {
        example: '$ node app --config formbuilder.conf.js\n'
      },
      {
        example: '$ # An example to override configuration options from command line.'
      },
      {
        example: '$ node app --config formbuilder.conf.js --keySslFile ssl/ssl.key --certSslFile ssl/ssl.cert caSslFile ssl/ca.cert'
      }
    ]
  },
  {
    content: 'Project home: {underline https://github.com/lhncbc/formbuilder}'
  }
];


const commandLineArgs = require('command-line-args');
let options = null;
try {
  options = commandLineArgs(optionDefinitions);
  if(options.help) {
    console.log(require('command-line-usage')(usage_sections));
    process.exit(0);
  }
}
catch (e) {
  console.error(e.message);
  console.log(require('command-line-usage')(usage_sections));
  process.exit(1);
}

let initConfig = {};

if(options.config) {
  initConfig = require(options.config);
  delete options.config;
}
else if(fs.existsSync('./formbuilder.conf.js')) {
  initConfig = require('./formbuilder.conf.js');
}
let config = Object.assign({}, initConfig, options);

process.env.NODE_ENV = options.env || process.env.NODE_ENV || 'development';

verifyConfig(config);

let app = require('./server').createFormbuilder(config);
app.start();
// Expose app
exports = module.exports = app;
