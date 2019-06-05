'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (!options.mapper || typeof options.mapper.map !== 'function') {
    throw new Error('Cerebral router - mapper option must be provided.');
  }

  var router = void 0;

  var routerModule = (0, _cerebral.Module)(function (_ref) {
    var controller = _ref.controller;

    return router = new _router2.default(controller, addressbar, options.mapper, options);
  });

  routerModule.getSignalUrl = function getSignalUrl(signalPath, payload) {
    return options.baseUrl + options.mapper.stringify(router.routesBySignal[signalPath], payload || {});
  };

  routerModule.addRoutes = function addRoutes(routes) {
    return router.addRoutes(routes);
  };

  return routerModule;
};

var _cerebral = require('cerebral');

var _router = require('./router');

var _router2 = _interopRequireDefault(_router);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var addressbar = void 0;
try {
  addressbar = require('addressbar');
} catch (e) {
  addressbar = {
    pathname: '/',
    value: '',
    origin: '',
    on: function on() {},
    removeListener: function removeListener() {}
  };
}
//# sourceMappingURL=base.js.map