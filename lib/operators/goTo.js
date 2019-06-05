"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = goToFactory;
function goToFactory(url) {
  function goTo(_ref) {
    var router = _ref.router,
        resolve = _ref.resolve;

    router.goTo(resolve.value(url));
  }

  return goTo;
}
//# sourceMappingURL=goTo.js.map