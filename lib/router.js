'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cerebral = require('cerebral');

var _internal = require('cerebral/internal');

var _utils = require('./utils');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Router = function () {
  function Router(controller, addressbar, mapper, options) {
    var _this = this;

    _classCallCheck(this, Router);

    this.controller = controller;
    this.addressbar = addressbar;
    this.mapper = mapper;
    this.options = (0, _utils.verifyOptions)(options);
    this.activeRoute = {};
    this.stateGetter = this.controller.getState.bind(this.controller);

    this.providers = {
      router: (0, _cerebral.Provider)({
        getUrl: this.getUrl.bind(this),
        getPath: this.getPath.bind(this),
        getValues: this.getValues.bind(this),
        getOrigin: this.getOrigin.bind(this),
        setUrl: this.setUrl.bind(this),
        goTo: this.goTo.bind(this),
        redirect: this.redirect.bind(this),
        redirectToSignal: this.redirectToSignal.bind(this),
        reload: this.reload.bind(this)
      })
    };

    if (!this.options.baseUrl && options.onlyHash) {
      // autodetect baseUrl
      this.options.baseUrl = addressbar.pathname;
    }
    this.options.baseUrl = this.options.baseUrl + (this.options.onlyHash ? '#' : '');

    controller.on('initialized', function () {
      _this.routesConfig = (0, _utils.flattenConfig)(options.routes);
      _this.routesBySignal = (0, _utils.getRoutesBySignal)(_this.routesConfig);

      addressbar.on('change', _this.onUrlChange.bind(_this));
      controller.on('start', _this.onSignalStart.bind(_this));
      controller.on('flush', _this.onFlush.bind(_this));

      if (!options.preventAutostart) {
        _this.onUrlChange();
      }
    });
  }

  _createClass(Router, [{
    key: 'addRoutes',
    value: function addRoutes(routes) {
      this.options.routes = [].concat(_toConsumableArray(routes), _toConsumableArray(this.options.routes));
      this.routesConfig = (0, _utils.flattenConfig)(this.options.routes);
      this.routesBySignal = (0, _utils.getRoutesBySignal)(this.routesConfig, this.controller);
    }
  }, {
    key: 'getRoutablePart',
    value: function getRoutablePart(url) {
      var path = url.replace(this.addressbar.origin, '');
      if (path[0] !== '/') {
        path = '/' + path;
      }
      if (this.options.onlyHash && !~path.indexOf('#')) {
        // treat hash absense as root route
        path = path + '#/';
      }
      return path.indexOf(this.options.baseUrl) === 0 ? path.replace(this.options.baseUrl, '') : null;
    }
  }, {
    key: 'onUrlChange',
    value: function onUrlChange(event) {
      var _this2 = this;

      var url = this.getRoutablePart(event ? event.target.value : this.addressbar.value);
      if (url === null) return;

      var match = void 0,
          route = void 0,
          values = void 0;
      try {
        var mapped = this.mapper.map(url, this.routesConfig) || {};
        match = mapped.match;
        route = mapped.route;
        values = mapped.values;
      } catch (err) {
        throw new Error('Could not parse url (' + err + ').');
      }

      if (!match) {
        if (this.options.allowEscape) return;

        event && event.preventDefault();
        console.warn('Cerebral router - No route matched ' + url + ', navigation was prevented. Please verify url or catch unmatched routes with a "/*" route.'); // eslint-disable-line no-console
        return;
      }

      event && event.preventDefault();
      var _match = match,
          computedRMapping = _match.computedRMapping,
          map = _match.map,
          propsMapping = _match.propsMapping,
          signal = _match.signal,
          stateMapping = _match.stateMapping;

      // remove undefined values from payload
      // TODO: can be replaced with next line when fixed in url-mapper
      // let payload = values

      var payload = Object.keys(values).reduce(function (cleanedPayload, key) {
        if (values[key] !== undefined) {
          cleanedPayload[key] = values[key];
        }
        return cleanedPayload;
      }, {});

      var getters = { props: payload, state: this.stateGetter };

      if (stateMapping || computedRMapping) {
        this.controller.runSignal('router.routed', [function (_ref) {
          var state = _ref.state,
              resolve = _ref.resolve;

          if (stateMapping) {
            stateMapping.forEach(function (key) {
              var value = values[key] || state.get(resolve.path(map[key]));
              state.set(resolve.path(map[key]), value === undefined ? null : value);
            });
          }
          if (computedRMapping) {
            Object.keys(computedRMapping).forEach(function (path) {
              var tracker = computedRMapping[path].tracker;

              tracker.run(_this2.stateGetter, values);

              var value = tracker.value;
              state.set(path, value === undefined ? null : value);
            });
          }
        }]);
      }

      if (propsMapping) {
        payload = propsMapping.reduce(function (mappedPayload, key) {
          mappedPayload[map[key].getPath(getters)] = values[key] || null;
          return mappedPayload;
        }, {});
      }

      var prevSignal = (this.routesConfig[this.activeRoute.route] || {}).signal;
      if (signal && (prevSignal !== signal || (0, _internal.getChangedProps)(payload || {}, this.activeRoute.payload || {}))) {
        this.controller.getSignal(signal)(payload);
      }

      this.activeRoute = { route: route, payload: payload };
    }
  }, {
    key: 'onSignalStart',
    value: function onSignalStart(execution, payload) {
      var _this3 = this;

      var route = this.routesBySignal[execution.name];
      if (!route) return;

      var map = this.routesConfig[route].map;

      var getters = { props: payload, state: this.stateGetter

        // resolve mappings on current props and state
      };var url = this.mapper.stringify(route, map ? Object.keys(map || {}).reduce(function (resolved, key) {
        var value = map[key].getValue(getters);

        if (_this3.options.filterFalsy && !value) {
          return resolved;
        }

        resolved[key] = value;
        return resolved;
      }, {}) : payload);

      this.setUrl(url);

      this.activeRoute = { route: route, payload: payload };
    }
  }, {
    key: 'onFlush',
    value: function onFlush(changed) {
      var _this4 = this;

      var _activeRoute = this.activeRoute,
          route = _activeRoute.route,
          payload = _activeRoute.payload;

      var _ref2 = this.routesConfig[route] || {},
          map = _ref2.map,
          stateMapping = _ref2.stateMapping,
          computedMapping = _ref2.computedMapping;

      if (!stateMapping && !computedMapping) return;
      var getters = { props: payload, state: this.stateGetter };
      var shouldUpdate = false;

      var resolvedMap = Object.keys(map || {}).reduce(function (resolved, key) {
        var value = void 0;

        if (computedMapping && computedMapping[key]) {
          var trackerHandle = computedMapping[key];
          var needsInit = trackerHandle.needsInit,
              tracker = trackerHandle.tracker;


          if (needsInit || (0, _utils.computeShouldChange)(tracker, changed)) {
            trackerHandle.needsInit = false;
            tracker.run(_this4.stateGetter, payload);
            shouldUpdate = true;
          }

          value = tracker.value;
        } else {
          var path = map[key].getPath(getters);
          value = map[key].getValue(getters);

          shouldUpdate = shouldUpdate || stateMapping.indexOf(key) >= 0 && (0, _utils.hasChangedPath)(changed, path);
        }

        if (!_this4.options.filterFalsy || value) {
          // Cerebral state only supports null and url-mapper only supports
          // undefined: so we map from one to the other here.
          resolved[key] = value === null ? undefined : value;
        }

        return resolved;
      }, {});

      if (shouldUpdate) {
        this.setUrl(this.mapper.stringify(route, Object.assign({}, resolvedMap)));
      }
    }
  }, {
    key: 'setUrl',
    value: function setUrl(url) {
      this.addressbar.value = this.options.baseUrl + url || '/';
    }
  }, {
    key: 'getUrl',
    value: function getUrl() {
      return this.addressbar.value;
    }
  }, {
    key: 'getPath',
    value: function getPath() {
      return this.addressbar.value.replace(this.addressbar.origin + this.options.baseUrl, '').split('?')[0];
    }
  }, {
    key: 'getValues',
    value: function getValues() {
      var url = this.getRoutablePart(this.addressbar.value);
      var mapped = this.mapper.map(url, this.routesConfig) || {};

      return mapped.values;
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.addressbar.origin;
    }
  }, {
    key: 'goTo',
    value: function goTo(url) {
      this.addressbar.value = this.options.baseUrl + url;
      this.onUrlChange();
    }
  }, {
    key: 'redirect',
    value: function redirect(url) {
      this.addressbar.value = {
        value: this.options.baseUrl + url,
        replace: true
      };

      this.onUrlChange();
    }
  }, {
    key: 'redirectToSignal',
    value: function redirectToSignal(signalName, payload) {
      var route = this.routesBySignal[signalName];
      if (!route) {
        console.warn('redirectToSignal: signal \'' + signalName + '\' not bound to route.');
      }
      this.controller.getSignal(signalName)(payload);
    }
  }, {
    key: 'reload',
    value: function reload() {
      this.redirect(this.getUrl());
    }
  }]);

  return Router;
}();

exports.default = Router;
//# sourceMappingURL=router.js.map