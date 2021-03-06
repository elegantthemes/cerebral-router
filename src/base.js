import { Module } from 'cerebral'
import Router from './router'

let addressbar
try {
  addressbar = require('addressbar')
} catch (e) {
  addressbar = {
    pathname: '/',
    value: '',
    origin: '',
    on() {},
    removeListener() {},
  }
}

export default function(options = {}) {
  if (!options.mapper || typeof options.mapper.map !== 'function') {
    throw new Error('Cerebral router - mapper option must be provided.')
  }

  let router

  const routerModule = Module(({ controller }) => {
    return (router = new Router(
      controller,
      addressbar,
      options.mapper,
      options
    ))
  })

  routerModule.getSignalUrl = function getSignalUrl(signalPath, payload) {
    return (
      options.baseUrl +
      options.mapper.stringify(router.routesBySignal[signalPath], payload || {})
    )
  }

  routerModule.addRoutes = function addRoutes(routes) {
    return router.addRoutes(routes)
  }

  return routerModule
}
