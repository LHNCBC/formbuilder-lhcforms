const JSON5 = require('json5');
module.exports = function (source) {
  const parsed = JSON5.parse(source);
  return `module.exports = ${JSON.stringify(parsed)};`;
};
