"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = redirectToSignalFactory;
function redirectToSignalFactory(signal, payload) {
  function redirectToSignal(_ref) {
    var router = _ref.router,
        resolve = _ref.resolve;

    router.redirectToSignal(resolve.value(signal), resolve.value(payload));
  }

  return redirectToSignal;
}
//# sourceMappingURL=redirectToSignal.js.map