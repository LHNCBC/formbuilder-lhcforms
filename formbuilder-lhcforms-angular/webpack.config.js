const path = require('path');
require('json5/lib/register');

module.exports = {
  // ...
  module: {
    rules: [
      // ...
      {
        test: /\.json5$/,
        use: [
          {
            loader: path.resolve(__dirname, 'json5-loader.js'),
          },
        ],
      },
    ],
  },
  // ...
};
