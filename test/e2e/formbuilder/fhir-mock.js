"use strict";

let nock = require('nock');
const dateformat = require('dateformat');
const fs = require('fs');
const resourceFilepath = '/tmp/tmp-questionnaire-resource';
const updateResp = require('./fixtures/update-response.json');
const deleteResp = require('./fixtures/delete-response.json');

let pathIdExp = /^\/baseDstu3\/Questionnaire\/([0-9]+)$/;
let searchExp = /^\/baseDstu3\/Questionnaire\?.*\b_id=([\w]+)\b.*$/;
let reqExp = /^\/baseDstu3\/Questionnaire.*$/;


/**
 * Parse id from the uri
 * @param uri - Request uri
 * @returns {*}
 */
function parseId(uri) {
  let match = searchExp.exec(uri);
  let id = null;
  if(match) {
    id = match[1];
  }
  
  if(!id) {
    id = pathIdExp.exec(uri)[1];
  }
  return id;
}


/**
 * Save the resource to the file
 * @param res - Resource object
 */
function saveResource(res) {
  let filename = resourceFilepath+res.id;
  fs.writeFileSync(filename, JSON.stringify(res, null, 2), 'utf-8');
}


/**
 * Read saved resource from the file.
 */
function readResource(id) {
  let ret = null;
  if(fs.existsSync(resourceFilepath+id)) {
    ret = JSON.parse(fs.readFileSync(resourceFilepath+id, 'utf-8'));
  }
  return ret;
}


/**
 * Handle general GET method
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function searchReply(uri, requestBody) {
  let id = parseId(uri);
  let entry = [];
  let res = readResource(id);
  if(res) {
    entry.push({
      fullUrl: this.basePath+this.req.path.replace(/\?.*$/, '/')+id,
      resource: res,
      search: {
        mode: "search"
      }
    });
  }
  
  return {
    resourceType: "Bundle",
    id: "589a6863-02d0-4353-b944-7787f40b5d28",
    meta: {
      lastUpdated: dateformat("UTC:yyyy-mm-d'T'HH:MM:ss'.'lo")
    },
    type: "searchset",
    total: entry.length,
    link: [
      {
        relation: "self",
        "url": this.basePath+this.req.path
      }
    ],
    entry: entry
  };
}


/**
 * Handle general GET method
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function stockReply(uri, requestBody) {
  console.log('Untrapped calls to '+this.req.host +': '+ uri);
  let ret = null;
  if(pathIdExp.exec(uri)) {
    ret = searchReply.call(this, uri, requestBody);
  }
  else {
    ret = readReply.call(this, uri, requestBody);
  }
  return ret;
}


/**
 * Handle FHIR create
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function createReply (uri, requestBody) {
  // Mock server changes and store it for later read.
  requestBody.id = "1";
  requestBody.meta.versionId = "1";
  requestBody.meta.lastUpdated = dateformat("UTC:yyyy-mm-d'T'HH:MM:ss'.'lo");
  
  if(fs.existsSync(resourceFilepath)) {
    fs.unlinkSync(resourceFilepath);
  }
  saveResource(requestBody);
  
  return [201, requestBody];
}


/**
 * Handle FHIR read
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function readReply (uri, requestBody) {
  // Check id, and send the created resource.
  let id = parseId(uri);
  let res = readResource(id);
  if(id === res.id) {
    return [200, res];
  }
  else {
    return [401, 'Resource not found'];
  }
}


/**
 * Handle update
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function updateReply (uri, requestBody) {
  // Not really updating anything. Check id, and send a positive reply.
  let id = parseId(uri);
  let res = readResource(id);
  if (id === res.id) {
  
    requestBody.meta.versionId = "2";
    requestBody.meta.lastUpdated = dateformat("UTC:yyyy-mm-d'T'HH:MM:ss'.'lo");
    saveResource(requestBody);
    return [200, updateResp];
  }
  else {
    return [400, 'Resource mismatch'];
  }
}


/**
 * Handle delete
 * @param uri - Request uri
 * @param requestBody - Request body
 * @returns {*[]} - Reply to user.
 */
function deleteReply (uri, requestBody) {
  
  let id = parseId(uri);
  let res = readResource(id);
  if (id === res.id) {
    fs.unlink(resourceFilepath);
    return [200, deleteResp];
  }
  else {
    return [400, 'Resource mismatch'];
  }
}


/**
 * Create nock for a given URL. Should only use origin part of the URL
 *
 * @param url - Web url
 * @returns {*}
 */
function fhirNock(url) {
  
  let ret = nock(url).defaultReplyHeaders({
    'Content-Type': 'application/json',
    'Content-Length': function (req, res, body) {
      return body.length;
    }
  });
  
  ret.get(pathIdExp).reply(readReply);
  ret.get(searchExp).reply(searchReply);
  
  ret.get(reqExp).reply(stockReply);
  
  ret.post(reqExp).reply(createReply);
  ret.put(reqExp).reply(updateReply);
  ret.delete(reqExp).reply(deleteReply);
  return ret;
}

module.exports = fhirNock;
