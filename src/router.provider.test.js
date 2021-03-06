/* eslint-env mocha */
/* eslint-disable no-console */
import * as assert from 'assert'
import addressbar from 'addressbar'
import Router from './'
import { makeTest, triggerUrlChange } from '../test/helper'

describe('provider', () => {
  beforeEach(() => {
    console.warn.warnings = []
    addressbar.value = '/'
    addressbar.removeAllListeners('change')
  })

  it('should expose `getUrl`', () => {
    addressbar.value = addressbar.origin + '/test'
    const controller = makeTest(
      Router({
        baseUrl: '/test',
        onlyHash: true,
        preventAutostart: true,
        routes: {
          '/': 'test',
        },
      }),
      {
        test: [
          function action({ router }) {
            assert.equal(
              addressbar.value,
              'http://localhost:3000/test#/?param=something'
            )
            assert.equal(
              router.getUrl(),
              'http://localhost:3000/test#/?param=something'
            )
          },
        ],
      }
    )
    controller.getSignal('test')({ param: 'something' })
  })

  it('should expose `getPath`', () => {
    addressbar.value = addressbar.origin + '/test'
    const controller = makeTest(
      Router({
        baseUrl: '/test',
        onlyHash: true,
        preventAutostart: true,
        routes: {
          '/': 'test',
        },
      }),
      {
        test: [
          function action({ router }) {
            assert.equal(
              addressbar.value,
              'http://localhost:3000/test#/?param=something'
            )
            assert.equal(router.getPath(), '/')
          },
        ],
      }
    )
    controller.getSignal('test')({ param: 'something' })
  })

  it('should expose `getOrigin`', () => {
    addressbar.value = addressbar.origin + '/test'
    const controller = makeTest(
      Router({
        baseUrl: '/test',
        onlyHash: true,
        preventAutostart: true,
        routes: {
          '/': 'test',
        },
      }),
      {
        test: [
          function action({ router }) {
            assert.equal(
              addressbar.value,
              'http://localhost:3000/test#/?param=something'
            )
            assert.equal(router.getOrigin(), 'http://localhost:3000')
          },
        ],
      }
    )
    controller.getSignal('test')({ param: 'something' })
  })

  it('should expose `getValues`', () => {
    addressbar.value = addressbar.origin + '/test'
    const controller = makeTest(
      Router({
        baseUrl: '/test',
        onlyHash: true,
        preventAutostart: true,
        routes: [
          {
            path: '/:page',
            signal: 'test',
          },
        ],
      }),
      {
        test: [
          function action({ router }) {
            assert.equal(
              addressbar.value,
              'http://localhost:3000/test#/foo?param=something'
            )
            assert.deepEqual(router.getValues(), {
              page: 'foo',
              param: 'something',
            })
          },
        ],
      }
    )
    controller.getSignal('test')({ page: 'foo', param: 'something' })
  })

  it('should expose `redirect`', (done) => {
    makeTest(
      Router({
        routes: {
          '/': 'doRedirect',
          '/existing/:string/:bool/:num': 'existing',
        },
      }),
      {
        doRedirect: [
          ({ router }) => router.redirect('/existing/foo/%3Atrue/%3A42'),
        ],
        existing: [
          ({ props }) => {
            assert.equal(props.string, 'foo')
            assert.equal(props.bool, true)
            assert.equal(props.num, 42)
            assert.equal(addressbar.pathname, '/existing/foo/%3Atrue/%3A42')
            done()
          },
        ],
      }
    )
  })

  it('should replaceState on `redirect` by default', () => {
    makeTest(
      Router({
        preventAutostart: true,
        routes: {
          '/foo': 'doRedirect',
          '/existing': 'existing',
        },
      }),
      {
        doRedirect: [({ router }) => router.redirect('/existing')],
        existing: [
          ({ props }) => {
            assert.equal(props.string, 'foo')
            assert.equal(props.bool, true)
            assert.equal(props.num, 42)
            assert.equal(addressbar.pathname, '/existing/foo/%3Atrue/%3A42')
          },
        ],
      }
    )
  })

  it('should expose `goTo`', (done) => {
    makeTest(
      Router({
        preventAutostart: true,
        routes: {
          '/foo': 'doRedirect',
          '/existing': 'existing',
        },
      }),
      {
        doRedirect: [({ router }) => router.goTo('/existing')],
        existing: [
          () => {
            assert.equal(addressbar.pathname, '/existing')
            assert.equal(window.location.lastChangedWith, 'pushState')
            done()
          },
        ],
      }
    )
    triggerUrlChange('/foo')
  })

  it('should expose `redirectToSignal`', (done) => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: {
          '/': 'home',
          '/foo/:id': 'detail',
        },
      }),
      {
        home: [],
        createClicked: [
          function createEntity({ router }) {
            const entityId = 42
            router.redirectToSignal('detail', { id: entityId })
          },
        ],
        detail: [
          function checkAction({ props }) {
            assert.equal(props.id, 42)
            assert.equal(addressbar.pathname, '/foo/%3A42')
            done()
          },
        ],
      }
    )

    controller.getSignal('createClicked')()
  })

  it('should expose `reload`', () => {
    let called = 0
    const controller = makeTest(
      Router({
        routes: {
          '/': 'home',
        },
      }),
      {
        home: [
          () => {
            called++
          },
        ],
        reload: [({ router }) => router.reload()],
      }
    )
    controller.getSignal('reload')()
    assert.equal(called, 2)
  })

  it('should warn if trying `redirectToSignal` to signal not bound to route', () => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: {
          '/': 'home',
        },
      }),
      {
        home: [],
        createClicked: [
          function createEntity({ router }) {
            const entityId = 42
            router.redirectToSignal('detail', { id: entityId })
          },
        ],
        detail: [],
      }
    )

    controller.getSignal('createClicked')()
    assert.equal(console.warn.warnings.length, 1)
  })
})
