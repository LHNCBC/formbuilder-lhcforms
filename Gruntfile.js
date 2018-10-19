// Generated on 2014-12-03 using generator-angular-fullstack 2.0.13
'use strict';

module.exports = function (grunt) {
  var envConfig = require('./formbuilder.conf.js');


  // Load grunt tasks automatically, when needed
  require('jit-grunt')(grunt, {
    express: 'grunt-express-server',
    useminPrepare: 'grunt-usemin',
    ngtemplates: 'grunt-angular-templates',
    protractor: 'grunt-protractor-runner',
    injector: 'grunt-asset-injector',
  });

  var serverFiles = [
    'package.json',
    'bashrc.formbuilder',
    'README_docker.md',
    'app.js',
    'formbuilder.conf.js',
    'server/**/*',
    'node_modules/**/*'
  ];

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    pkg: grunt.file.readJSON('package.json'),
    yeoman: {
      // configurable paths
      client: require('./bower.json').appPath || 'client',
      dist: 'dist',
      host: 'localhost'
    },
    express: {
      options: {
        port: envConfig.port
      },
      test: {
        options: {
          script: 'test/e2e/test-app.js'
        }
      },
      dev: {
        options: {
          script: 'app.js',
          args: ['-c', 'formbuilder.conf.js']
        }
      },
      prod: {
        options: {
          script: 'dist/app.js',
          args: ['-c', 'formbuilder.conf.js']
        }
      }
    },
    open: {
      server: {
        url: envConfig.https ? 'https://<%= yeoman.host %>:<%= express.options.port %>' : 'http://<%= yeoman.host %>:<%= express.options.port %>'
      }
    },

    watch: {
      injectJS: {
        files: [
          '<%= yeoman.client %>/{app,components}/**/*.js',
          '!<%= yeoman.client %>/{app,components}/**/*.spec.js',
          '!<%= yeoman.client %>/{app,components}/**/*.mock.js',
          '!<%= yeoman.client %>/app/app.js'],
        tasks: ['injector:scripts']
      },
      injectCss: {
        files: [
          '<%= yeoman.client %>/{app,components}/**/*.css'
        ],
        tasks: ['injector:css']
      },
      jsTest: {
        files: [
          '<%= yeoman.client %>/{app,components}/**/*.spec.js',
          '<%= yeoman.client %>/{app,components}/**/*.mock.js'
        ],
        tasks: ['newer:jshint:all', 'karma']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        files: [
          '{.tmp,<%= yeoman.client %>}/{app,components}/**/*.css',
          '{.tmp,<%= yeoman.client %>}/{app,components}/**/*.html',
          '{.tmp,<%= yeoman.client %>}/{app,components}/**/*.js',
          '!{.tmp,<%= yeoman.client %>}{app,components}/**/*.spec.js',
          '!{.tmp,<%= yeoman.client %>}/{app,components}/**/*.mock.js',
          '<%= yeoman.client %>/assets/images/{,*//*}*.{png,jpg,jpeg,gif,webp,svg}'
        ],
        options: {
          livereload: 1337
        }
      },
      express: {
        files: [
          'server/**/*.{js,json}'
        ],
        tasks: ['express:dev', 'wait'],
        options: {
          livereload: false, //true,
          nospawn: true //Without this option specified express won't be reloaded
        }
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '<%= yeoman.client %>/.jshintrc',
        reporter: require('jshint-stylish')
      },
      server: {
        options: {
          jshintrc: 'server/.jshintrc'
        },
        src: [
          'server/**/*.js',
          '!server/**/*.spec.js'
        ]
      },
      serverTest: {
        options: {
          jshintrc: 'server/.jshintrc-spec'
        },
        src: ['server/**/*.spec.js']
      },
      all: [
        '<%= yeoman.client %>/{app,components}/**/*.js',
        '!<%= yeoman.client %>/{app,components}/**/*.spec.js',
        '!<%= yeoman.client %>/{app,components}/**/*.mock.js'
      ],
      test: {
        src: [
          '<%= yeoman.client %>/{app,components}/**/*.spec.js',
          '<%= yeoman.client %>/{app,components}/**/*.mock.js'
        ]
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/*',
            '!<%= yeoman.dist %>/.git*',
            '!<%= yeoman.dist %>/.openshift',
            '!<%= yeoman.dist %>/Procfile'
          ]
        }]
      },
      server: '.tmp'
    },

    // Add vendor prefixed styles
    autoprefixer: {
      options: {
        browsers: ['last 1 version']
      },
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/',
          src: '{,*/}*.css',
          dest: '.tmp/'
        }]
      }
    },

    // Debugging with node inspector
    'node-inspector': {
      custom: {
        options: {
          'web-host': 'localhost'
        }
      }
    },

    // Use nodemon to run server in debug mode with an initial breakpoint
    nodemon: {
      debug: {
        script: 'app.js',
        options: {
          nodeArgs: ['--debug-brk'],
          env: {
            PORT: process.env.PORT || 9000
          },
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });

            // opens browser on initial server start
            nodemon.on('config:update', function () {
              setTimeout(function () {
                require('opn')('https://localhost:8080/debug?port=5858');
              }, 500);
            });
          }
        }
      }
    },

    // Automatically inject Bower components into the app
    wiredep: {
      target: {
        src: ['<%= yeoman.client %>/index.html', 'karma.conf.js'],
        fileTypes: {
          js: {
            block: /(([ \t]*)\/\*\s*bower:*(\S*)\s*\*\/)(\n|\r|.)*?(\/\*\s*endbower\s*\*\/)/gi,
            detect: {
              js: /['"](.+\.js)['"]/gi,
              css: /['"](.+\.css)['"]/gi
            },
            replace: {
              js: '"{{filePath}}",',
              css: '"{{filePath}}",'
            }
          }
        }
        //ignorePath: '<%= yeoman.client %>/',
        //exclude: [/bootstrap-sass-official/, /bootstrap.js/, '/json3/', '/es5-shim/']
      }
    },

    // Renames files for browser caching purposes
    rev: {
      dist: {
        files: {
          src: [
            '<%= yeoman.dist %>/public/{,*/}*.js',
            '<%= yeoman.dist %>/public/{,*/}*.css',
            '<%= yeoman.dist %>/public/assets/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
            '<%= yeoman.dist %>/public/assets/fonts/*',
            '!<%= yeoman.dist %>/public/bower_components/spin.js'
          ]
        }
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: ['<%= yeoman.client %>/index.html'],
      options: {
        dest: '<%= yeoman.dist %>/public',
        flow: {
          html: {
            steps: {
              js: ['concat', 'uglifyjs'],
              // no concat for css files. let cssmin do the concatenation,
              // where it can know the origin of the css files in order to do
              // the relative-path correction for referenced resources.
              css: ['cssmin']
            },
            post: {}
          }
        }
      }
    },

    cssmin: {
      options: {
        root: '<%= yeoman.client %>'
      }
    },

    // Performs rewrites based on rev and the useminPrepare configuration
    usemin: {
      html: ['<%= yeoman.dist %>/public/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/public/{,*/}*.css'],
      js: ['<%= yeoman.dist %>/public/{,*/}*.js', '!<%= yeoman.dist %>/public/bower_components/spin.js'],
      options: {
        assetsDirs: [
          '<%= yeoman.dist %>/public',
          '<%= yeoman.dist %>/public/assets/images'
        ],
        // This is so we update image references in our ng-templates
        patterns: {
          js: [
            [/(assets\/images\/.*?\.(?:gif|jpeg|jpg|png|webp|svg))/gm, 'Update the JS to reference our revved images']
          ]
        }
      }
    },

    // The following *-min tasks produce minified files in the dist folder
    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.client %>/assets/images',
          src: '{,*/}*.svg',
          dest: '<%= yeoman.dist %>/public/assets/images'
        }]
      }
    },

    // Allow the use of non-minsafe AngularJS files. Automatically makes it
    // minsafe compatible so Uglify does not destroy the ng references
    ngAnnotate: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat',
          src: '*/**.js',
          dest: '.tmp/concat'
        }]
      }
    },

    // Package all the html partials into a single javascript payload
    ngtemplates: {
      options: {
        // This should be the name of your apps angular module
        module: 'formBuilder',
        htmlmin: {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeEmptyAttributes: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true
        },
        usemin: 'app/app.js'
      },
      main: {
        cwd: '<%= yeoman.client %>',
        src: ['{app,components}/**/*.html'],
        dest: '.tmp/templates.js'
      },
      tmp: {
        cwd: '.tmp',
        src: ['{app,components}/**/*.html'],
        dest: '.tmp/tmp-templates.js'
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          timestamp: true,
          cwd: '<%= yeoman.client %>',
          dest: '<%= yeoman.dist %>/public',
          filter: function(src) {
            // Only font and image files are needed from the bower_components
            // directories.
            return !src.match(/bower_components/) || src.match(/\.(woff|png|jpg|gif)/);
          },
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            'bower_components/**/*',
            'assets/images/{,*/}*.{webp}',
            'assets/fonts/**/*',
            'index.html',
            'ga.js',   // user supplied google analytics code
            // Some non bower third party packages.
            'ngFhir.js'
          ]
        }, {
          expand: true,
          cwd: '.tmp/images',
          timestamp: true,
          dest: '<%= yeoman.dist %>/public/assets/images',
          src: ['generated/*']
        }, {
          expand: true,
          timestamp: true,
          dest: '<%= yeoman.dist %>',
          src: serverFiles
        }]
      },
      styles: {
        expand: true,
        cwd: '<%= yeoman.client %>',
        dest: '.tmp/',
        src: ['{app,components}/**/*.css']
      }
    },

    // Run some tasks in parallel to speed up the build process
    concurrent: {
      server: [
      ],
      test: [
      ],
      debug: {
        tasks: [
          'nodemon',
          'node-inspector'
        ],
        options: {
          logConcurrentOutput: true
        }
      },
      dist: [
        'svgmin'
      ]
    },

    // Test settings
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },

    protractor: {
      options: {
        configFile: 'protractor.conf.js'
      },
      all: {}
    },

    env: {
      test: {
        NODE_ENV: 'test'
      },
      prod: {
        NODE_ENV: 'production'
      }
    },

    injector: {
      options: {

      },
      // Inject application script files into index.html (doesn't include bower)
      scripts: {
        options: {
          transform: function(filePath) {
            filePath = filePath.replace('/client/', '');
            filePath = filePath.replace('/.tmp/', '');
            return '<script src="' + filePath + '"></script>';
          },
          starttag: '<!-- injector:js -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          '<%= yeoman.client %>/index.html': [
              ['{.tmp,<%= yeoman.client %>}/{app,components}/**/*.js',
               '!{.tmp,<%= yeoman.client %>}/app/app.js',
               '!{.tmp,<%= yeoman.client %>}/{app,components}/**/*.spec.js',
               '!{.tmp,<%= yeoman.client %>}/{app,components}/**/*.mock.js']
            ]
        }
      },

      // Inject component css into index.html
      css: {
        options: {
          transform: function(filePath) {
            filePath = filePath.replace('/client/', '');
            filePath = filePath.replace('/.tmp/', '');
            return '<link rel="stylesheet" href="' + filePath + '">';
          },
          starttag: '<!-- injector:css -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          '<%= yeoman.client %>/index.html': [
            '<%= yeoman.client %>/{app,components}/**/*.css'
          ]
        }
      }
    },
    // Create files from templates
    template: {
      client_auth: {
        options: {
          data: envConfig.firebaseClientConfig
        },
        src: '<%= yeoman.client %>/app/firebase/firebase-client-authorization.js.tpl',
        dest: '<%= yeoman.client %>/app/firebase/firebase-client-authorization.js',
        filter: function (src) {
          let destFile = grunt.task.current.data.dest;
          if(grunt.file.exists(destFile)) {
            grunt.file.delete(destFile);
            grunt.log.oklns('Deleted previous '+destFile);
          }
          let ret = grunt.task.current.data.options.data ? true : false;
          if(!ret) {
            grunt.log.oklns('No firebase client configuration detected. The authorization file will not be generated.');
          }

          return ret;
        }
      },
      index_html: {
        options: {
          data: envConfig
        },
        src: '<%= yeoman.client %>/index.html.tpl',
        dest: '<%= yeoman.client %>/index.html',
        filter: function (src) {
          let destFile = grunt.task.current.data.dest;
          if(grunt.file.exists(destFile)) {
            grunt.file.delete(destFile);
            grunt.log.oklns('Deleted previous '+destFile);
          }
          return true;
        }
      }
    }
  });
  
  grunt.registerTask('createDir', function (dir) {
    grunt.file.mkdir(dir);
  });

  grunt.registerTask('deleteDir', function (dir) {
    grunt.file.delete(dir);
  });

  // Used for delaying livereload until after server has restarted
  grunt.registerTask('wait', function () {
    grunt.log.ok('Waiting for server reload...');
    grunt.log.ok(grunt.config('open.server.url'));
    var done = this.async();

    setTimeout(function () {
      grunt.log.writeln('Done waiting!');
      done();
    }, 1500);
  });

  grunt.registerTask('express-keepalive', 'Keep grunt running', function() {
    this.async();
  });

  grunt.registerTask('open', function() {
    var opn = require('opn');
    var pageURL = grunt.config('open.server.url');
    opn(pageURL);
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'env:prod', 'express:prod',
        'wait', 'open', 'express-keepalive']);
    }

    if (target === 'debug') {
      return grunt.task.run([
        'clean:server',
        'concurrent:server',
        'injector',
        'wiredep',
        'autoprefixer',
        'concurrent:debug'
      ]);
    }

    // Add an option to run the server under test env.
    if (target === 'test') {
      return grunt.task.run([
        'clean:server',
        'env:test',
        'template',
        'concurrent:server',
        'injector',
        'wiredep',
        'autoprefixer',
        'express:dev',
        'wait',
        'open',
        'watch'
      ]);
    }

    // Run without opening the page.
    if(target === 'nopen') {
      grunt.task.run([
        'clean:server',
        'template',
        'concurrent:server',
        'injector',
        'wiredep',
        'autoprefixer',
        'express:dev',
        'wait',
        'watch'
      ]);
    }

    grunt.task.run([
      'clean:server',
      'template',
      'concurrent:server',
      'injector',
      'wiredep',
      'autoprefixer',
      'express:dev',
      'wait',
      'open',
      'watch'
    ]);
  });

  grunt.registerTask('server', function () {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve']);
  });

  grunt.registerTask('s', function () {
    grunt.task.run(['serve:nopen']);
  });

  grunt.registerTask('test', function(target) {
    if (target === 'client') {
      return grunt.task.run([
        'clean:server',
        'template',
        'concurrent:test',
        'injector',
        'wiredep',
        'autoprefixer',
        'karma'
      ]);
    }

    else if (target === 'e2e') {
      return grunt.task.run([
        'clean:server',
        'env:test',
        'template',
        'concurrent:test',
        'injector',
        'wiredep',
        'autoprefixer',
        'express:dev',
        'update_webdriver',
        'protractor'
      ]);
    }

    else grunt.task.run([
      'test:client',
      'test:e2e'
    ]);
  });

  grunt.registerTask('prune_modules', function() {
    grunt.log.ok('Prune the dev dependencies from dist');
    executeCmd('npm prune --production', {cwd: './dist'});
  });

  grunt.registerTask('update_webdriver', function() {
    grunt.log.ok('Update webdriver');
    executeCmd('./node_modules/.bin/webdriver-manager update  --versions.chrome=2.41');
  });

  grunt.registerTask('build', function(target) {

    grunt.task.run([
      'clean:dist',
      'concurrent:dist',
      'template',
      'injector',
      'wiredep',
      'useminPrepare',
      'autoprefixer',
      'ngtemplates',
      'concat',
      'ngAnnotate',
      'copy:dist',
      'cssmin',
      'uglify',
      'rev',
      'usemin',
      'prune_modules'
    ]);
  });

  grunt.registerTask('default', [
    'test',
    'build'
  ]);

  grunt.registerTask('createDockerImage', function(imageTag) {
    grunt.log.ok('Creating docker image');
    var tag = imageTag ? imageTag : grunt.config('pkg.version');
    executeCmd('docker build -t lhc/formbuilder:'+tag+' .');
  });

  grunt.registerTask('createFreshDockerImage', function (tag) {
    var tagStr = '';
    if(tag) {
      tagStr = ':'+tag;
    }

    return grunt.task.run([
      'build',
      'createDockerImage'+tagStr
    ]);
  });

  /**
   * Utility function to execute a command on command line.
   *
   * @param cmdStr - String formatted command.
   * @param execOpts - Options as specified in child_process.exec
   */
  function executeCmd(cmdStr, execOpts) {
    var opts = {cwd: './', stdio: 'inherit'};
    Object.assign(opts, execOpts);

    var child = require('child_process');
    child.execSync(cmdStr, opts);
  }
};
