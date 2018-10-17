/**
 * Error responses
 */

'use strict';

module.exports[404] = function pageNotFound(req, res) {
  error(404, req, res);
};

module.exports[403] = function forbidden(req, res) {
  error(403, req, res);
};

function error(error_code, req, res) {
  var viewFilePath = error_code.toString();
  var statusCode = error_code;
  var result = {
    status: statusCode
  };

  res.status(result.status);
  res.render(viewFilePath, function (err, html) {
    if (err) { return res.status(result.status).json(result); }

    res.send(html);
  });
};
