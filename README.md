### Installation 
1. Install **node** and __pm2__ package globally on your system.
1. Install required node packages: 

        npm ci
        
1. Install required bower packages:
           
        bower install
           
1. Edit formbuilder.conf.js to configure for your setup.
    1. Specify your ssl key, certificate and authority files.
    1. Specify firebase account information for client and server configuration.
    1. Specify server's host name (or IP) and port number.
    1. Specify Google Analytics gtag tracking id.
              
1. Start formbuilder server.

        grunt serve
        
