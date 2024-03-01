### Installation 
1. Install **nodejs** package globally on your system.

2. Clone git repository of formbuilder-lhcforms.

        $ git clone https://github.com/lhncbc/formbuilder-lhcforms.git

3. Build the project.
   * To build the project, change to formbuilder-lhcforms directory. Edit bashrc.formbuilder file to suit your development environment. Make sure that ./node_modules/.bin is in your path for the rest of the installation.

          $ cd formbuilder-lhcforms
          $ source bashrc.formbuilder
          $ npm ci && npm run build
          $ npm test ## Optional

### Running the application
* To deploy on a production webserver:

        $ cp dist/formbuilder-lhcforms {webserver docs location}

* To start dev server locally:

        $ npm start
  Point the browser at http://localhost:9030
        
        

        
