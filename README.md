### Installation 
1. Install **nodejs** package globally on your system.
1. Clone git repository of lforms-formbuilder.

        $ git clone https://github.com/lhncbc/formbuilder-lhcforms.git

1. Change to formbuilder directory and setup environment. Edit bashrc.formbuilder file to setup necessary 
environment. You can make a similar rc file to suit your shell. Please make sure that ./node_modules/.bin is in your 
path for the rest of the installation. 

        $ cd formbuilder-lhcforms
        $ npm ci
        $ source bashrc.formbuilder
        
1. Install required bower packages:
           
        $ bower install
           
1. Edit formbuilder.conf.js to configure the application for your setup. 
 
    1. If choosing https option, specify your ssl key, certificate and authority files.
    1. Specify server's host name (or IP) and port number.
    1. Specify Google Analytics gtag tracking id.
              
1. Run grunt task to generate index.html from template.
           
        $ grunt template
           
1. Start formbuilder server for development.

        $ grunt serve
        
1. Build the package for production and run.

        $ grunt build
        $ cd dist
        $ node app -env production
        

        
