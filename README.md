### Installation 
1. Install **nodejs** package globally on your system.
1. Clone git repository of lforms-formbuilder.

        $ git clone https://github.com/lhncbc/formbuilder-lhcforms.git

1. Change to formbuilder directory and setup environment. Edit bashrc.formbuilder file to setup necessary 
environment. You can make a similar rc file to suit your shell. Please make sure that ./node_modules/.bin is in your 
path for the rest of the installation. 

        $ cd formbuilder-lhcforms
        $ npm ci && npm run create-version-file
        $ source bashrc.formbuilder
        
1. Start formbuilder server for development.

        $ npm start
        
1. Build the package for production.

        $ npm run build
        $ cp dist/formbuilder-lhcforms {webserver docs location}
        

        
