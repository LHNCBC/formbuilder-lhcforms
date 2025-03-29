/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
const {rmdir, unlink} = require('fs');
const {join} = require('path');

/**
 * Handle error from file system.
 *
 * @param err -Error object.
 * @param ignoreIfNotExist - Flag to ignore ENOENT error.
 * @param resolve - resolve call back
 * @param reject - reject call back
 * @returns {*} - Promise
 * @private
 */
function _handleFileError(err, ignoreIfNotExist, resolve, reject) {
  if(!err || (err.code === 'ENOENT' && ignoreIfNotExist)) {
    return resolve(null);
  }
  console.error(err);
  return reject(err);
}

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('task', {
    /**
     * Deletes a folder
     *
     * @param args<{folder, ignoreIfNotExist}> - An object consisting of the following entries:
     *   folder<string>: Name of the folder.
     *   ignoreIfNotExists<boolean>: A flag to ignore error on not finding the folder.
     * @returns {Promise}
     */
    deleteFolder(args) {
      return new Promise((resolve, reject) => {
        rmdir(args.folder, { maxRetries: 10, recursive: true }, (err) => {
          return _handleFileError(err, args.ignoreIfNotExist, resolve, reject);
        });
      });
    },

    /**
     * Deletes a file
     *
     * @param args<{filename, folder, ignoreIfNotExist}> - An object consisting of the following entries:
     *   filename<string>          : Name of the file. It could be a relative path with respect to 'folder'.
     *   folder<string>            : Name of the parent folder of the file. folder and filename are joined
     *                               with path.join() to get the full path name of the file.
     *   ignoreIfNotExists<boolean>: A flag to ignore error on not finding the file.
     * @returns {Promise}
     */
    deleteFile(args) {
      return new Promise((resolve, reject) => {
        const filePath = args.folder ? join(args.folder, args.filename) : args.filename;
        unlink(filePath, (err) => {
          return _handleFileError(err, args.ignoreIfNotExist, resolve, reject);
        });
      });
    },
  });
}
