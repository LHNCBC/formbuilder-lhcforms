/**
 * This script starts dev server binding to network so that the server
 * is accessible from other machines in the internal network such as
 * other PCs in the network.
 */
const hostName = require('os').hostname();
const { spawn } = require('child_process');
const packageJson = require('dotenv').config({path: ['.env.local', '.env']});
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// Port 9030 for form builder.
const port = process.env.BASE_PORT || '9030';

let command = npx;
let args;

// Serve the production build output from dist folder.
if (process.argv[2] && process.argv[2] === '--dist') {
  args = [
    'angular-http-server',
    '--silent',
    '--path',
    './dist/formbuilder-lhcforms',
    '-p',
    port,
    '--host',
    hostName
  ];
}
else {
  args = ['ng', 'serve', '--port', port, '--host', hostName, '-c', 'development'];
}

spawn(command, args, {
  stdio: 'inherit'
});
