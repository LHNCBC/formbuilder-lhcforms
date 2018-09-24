### Pre-requisites
This application uses Firebase authentication 

### Installation 
1. Install **node** package globally on your system.
1. Clone git repository of formbuilder.

        $ git clone https://github.com/lhncbc/formbuilder.git

1. Change to formbuilder directory and setup environment. Edit bashrc.formbuilder file to setup necessary 
environment. You can make a similar rc file to suit your shell. Please make sure that ./node_modules/.bin is in your 
path for the rest of the installation. 

        $ cd formbuilder
        $ source bashrc.formbuilder
        $ npm ci
        
1. Install required bower packages:
           
        $ bower install
           
1. Edit formbuilder.conf.js to configure for your setup. This is where you specify valid SSL files and Firebase service 
account details to run the application.
    1. Specify your ssl key, certificate and authority files.
    1. Specify firebase account information for client and server configuration.
    1. Specify server's host name (or IP) and port number.
    1. Specify Google Analytics gtag tracking id.
              
1. Compile templates.
           
        $ bower template
           
1. Start formbuilder server for development.

        $ grunt serve
        
1. Build the package for production and run.

        $ grunt build
        $ cd dist
        $ node app -env production
        

        
