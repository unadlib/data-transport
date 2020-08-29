'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('../dist/index.cjs.js');
} else {
  module.exports = require('../dist/index.cjs.development.js');
}
