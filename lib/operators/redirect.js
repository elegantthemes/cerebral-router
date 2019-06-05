"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = redirectFactory;
function redirectFactory(url) {
  function redirect(_ref) {
    var router = _ref.router,
        resolve = _ref.resolve;

    router.redirect(resolve.value(url));
  }

  return redirect;
}
//# sourceMappingURL=redirect.js.map