'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = versionTransform;

var _path2 = require('path');

var _path3 = _interopRequireDefault(_path2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var packagePath = _path3.default.resolve(process.cwd(), './package.json');

var _require = require(packagePath);

var version = _require.version;
function versionTransform() {
  return {
    visitor: {
      Identifier: function Identifier(path) {
        if (path.node.name === 'VERSION') {
          path.replaceWithSourceString('"' + version + '"');
        }
      }
    }
  };
};