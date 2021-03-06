/* eslint-env mocha */
/* eslint-disable no-console */
import * as assert from 'assert'
import addressbar from 'addressbar'
import Router from './'
import { makeTest, triggerUrlChange } from '../test/helper'
/*
  TODO: /:param urls FAIL
*/
describe('Router', () => {
  beforeEach(() => {
    console.warn.warnings = []
    addressbar.value = '/'
    addressbar.removeAllListeners('change')
  })

  it('should be able to define routes as config', () => {
    let count = 0
    makeTest(
      Router({
        routes: {
          '/': 'test',
        },
      }),
      {
        test: [
          () => {
            count++
          },
        ],
      }
    )
    assert.equal(count, 1)
  })

  /*
  it('should expose base router and accept custom mapper', () => {
    let count = 0
    Controller({
      router: Router({
        routes: {
          '/': 'test'
        }
      }),
      signals: {
        test: [() => { count++ }]
      }
    })
    assert.equal(count, 1)
  })
  */

  it('should not trigger if preventAutostart option was provided', () => {
    let count = 0
    makeTest(
      Router({
        preventAutostart: true,
        routes: {
          '/': 'test',
        },
      }),
      {
        test: [
          () => {
            count++
          },
        ],
      }
    )
    assert.equal(count, 0)
  })

  it('should support nested route definitions', () => {
    let count = 0
    makeTest(
      Router({
        routes: {
          '/': 'foo',
          '/bar': {
            '/': 'bar',
            '/baz': {
              '/': 'baz',
            },
          },
        },
      }),
      {
        foo: [
          () => {
            count++
          },
        ],
        bar: [
          () => {
            count++
          },
        ],
        baz: [
          () => {
            count++
          },
        ],
      }
    )
    triggerUrlChange('/bar')
    triggerUrlChange('/bar/baz')
    assert.equal(count, 3)
  })

  it('should throw on missing signal', () => {
    assert.throws(() => {
      makeTest(
        Router({
          routes: {
            '/': 'test',
          },
        }),
        {}
      )
    })
  })

  it('should throw on duplicate signal', () => {
    assert.throws(() => {
      makeTest(
        Router({
          routes: {
            '/': 'test',
            '/foo': 'test',
          },
        }),
        {
          test: [],
        }
      )
    })
  })

  it('should update addressbar for routable signal call', () => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: {
          '/': 'home',
          '/test': 'test',
        },
      }),
      {
        home: [],
        test: [],
      }
    )
    controller.getSignal('test')()

    assert.equal(addressbar.pathname, '/test')
  })

  /*
    TODO: Preserving URL should rather be done by "stringify", by checking if query
    option is on. If it is on it will of course stringify, but if not it should just keep
    the query "as is"
  it('should preserve addressbar value for signal triggered by route', () => {
    Controller({
      signals: {
        test: []
      },
      modules: {
        router: Router({
          '/test': 'test'
        }, {
          mapper: urlMapper(),
          preventAutostart: true
        })
      }
    })
    triggerUrlChange('/test?foo=bar')
    assert.equal(addressbar.value, addressbar.origin + '/test?query')
  })
  */

  it('should not update addressbar for regular signal call', () => {
    addressbar.value = addressbar.origin + '/test'
    let count = 0
    const controller = makeTest(
      Router({
        routes: {
          '/test': 'test',
        },
      }),
      {
        test: [],
        foo: [
          () => {
            count++
          },
        ],
      }
    )
    controller.getSignal('foo')()
    assert.equal(addressbar.pathname, '/test')
    assert.equal(count, 1)
  })

  it('should prevent navigation and warn when no signals was matched', () => {
    makeTest(
      Router({
        baseUrl: '/base',
        preventAutostart: true,
        routes: {
          '/': 'home',
        },
      }),
      {
        home: [],
      }
    )

    triggerUrlChange('/missing')
    assert.equal(console.warn.warnings.length, 0)

    triggerUrlChange('/base/missing')
    assert.equal(console.warn.warnings.length, 1)
  })

  it('should manage input of baseUrl without /', () => {
    makeTest(
      Router({
        baseUrl: 'base',
        preventAutostart: true,
        routes: {
          '/': 'home',
        },
      }),
      {
        home: [],
      }
    )

    triggerUrlChange('/missing')
    assert.equal(console.warn.warnings.length, 0)

    triggerUrlChange('/base/missing')
    assert.equal(console.warn.warnings.length, 1)
  })

  it('should not prevent navigation when no signals was matched if allowEscape option was provided', () => {
    makeTest(
      Router({
        baseUrl: '/base',
        allowEscape: true,
        preventAutostart: true,
        routes: {
          '/': 'home',
        },
      }),
      {
        home: [],
      }
    )

    triggerUrlChange('/missing')
    assert.equal(console.warn.warnings.length, 0)

    triggerUrlChange('/base/missing')
    assert.equal(console.warn.warnings.length, 0)
  })

  it('should expose getSignalUrl method on router instance', () => {
    const router = Router({
      baseUrl: '/base',
      allowEscape: true,
      preventAutostart: true,
      routes: {
        '/': 'home',
        '/items/:item': 'item',
      },
    })
    // Instantiate router
    makeTest(router)

    assert.equal(router.getSignalUrl('home'), '/base/')
    assert.equal(
      router.getSignalUrl('item', { item: 'foo' }),
      '/base/items/foo'
    )
  })
})
