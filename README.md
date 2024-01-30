### Installation 
1. Install **nodejs** package globally on your system.
2. Clone git repository of formbuilder.

        $ git clone https://github.com/lhncbc/formbuilder-lhcforms.git

3. Build the project.
   * To build the project, change to formbuilder directory. Edit bashrc.formbuilder file to suit your development environment. Make sure that ./node_modules/.bin is in your path for the rest of the installation.

         $ cd formbuilder-lhcforms
         $ source bashrc.formbuilder
         $ npm ci && npm run build
         $ npm test ## Optional

5. Deploy production bundle to a web server.

        $ cp dist/formbuilder-lhcforms {webserver docs location}

6. Start dev server locally.

        $ npm start
        
        

        
