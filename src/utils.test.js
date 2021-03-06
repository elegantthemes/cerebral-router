/* eslint-env mocha */
/* eslint-disable no-console */
import * as assert from 'assert'
// Cannot use require here or instanceof will not work.
import { Compute } from 'cerebral'
import { DependencyTracker } from 'cerebral/internal'
import { state, props } from 'cerebral/tags'
import { computeShouldChange, flattenConfig } from './utils'

describe('flattenConfig', () => {
  it('should handle object config', () => {
    const config = {
      '/some/url': 'some.signal',
      '/other/url': 'other.signal',
    }
    assert.deepEqual(flattenConfig(config), {
      '/some/url': {
        signal: 'some.signal',
      },
      '/other/url': {
        signal: 'other.signal',
      },
    })
  })

  it('should handle nested object config', () => {
    const config = {
      '/': 'base.signal',
      '/foo': {
        '/': 'foo.signal',
        '/baz': {
          '/': 'baz.signal',
        },
      },
    }
    assert.deepEqual(flattenConfig(config), {
      '/': {
        signal: 'base.signal',
      },
      '/foo/': {
        signal: 'foo.signal',
      },
      '/foo/baz/': {
        signal: 'baz.signal',
      },
    })
  })

  it('should handle array config', () => {
    const config = [
      { path: '/some/url', signal: 'some.signal' },
      { path: '/other/url', signal: 'other.signal' },
    ]
    assert.deepEqual(flattenConfig(config), {
      '/some/url': {
        signal: 'some.signal',
      },
      '/other/url': {
        signal: 'other.signal',
      },
    })
  })

  it('should handle nested array config', () => {
    const config = [
      {
        path: '/foo',
        signal: 'foo.signal',
        routes: {
          '/bing': 'bing.signal',
          '/bar': {
            '/': 'bar.signal',
            '/baz': 'baz.signal',
          },
        },
      },
      { path: '/other/url', signal: 'other.signal' },
    ]
    assert.deepEqual(flattenConfig(config), {
      '/foo': {
        signal: 'foo.signal',
      },
      '/foo/bing': {
        signal: 'bing.signal',
      },
      '/foo/bar/': {
        signal: 'bar.signal',
      },
      '/foo/bar/baz': {
        signal: 'baz.signal',
      },
      '/other/url': {
        signal: 'other.signal',
      },
    })
  })

  it('should parse map and rmap parameters', () => {
    const config = flattenConfig([
      {
        path: '/settings/:tab',
        // the 'focus' parameter is expected in the query
        map: { tab: props`tab`, focus: props`focus` },
        signal: 'some.signal',
      },
      {
        path: '/view/:view',
        map: { view: state`app.view` },
        signal: 'app.viewRouted',
      },
      {
        path: '/other/url',
        signal: 'other.signal',
      },
      {
        path: '/Compute/map',
        map: { view: Compute(() => true) },
        signal: 'other.signal',
      },
      {
        path: '/:foo',
        rmap: { 'some.path': Compute(props`foo`, (foo) => foo + 'x') },
      },
    ])
    Object.keys(config).forEach((key) => {
      config[key] = Object.keys(config[key])
    })

    assert.deepEqual(config, {
      '/settings/:tab': ['signal', 'map', 'propsMapping'],
      '/view/:view': ['signal', 'map', 'stateMapping'],
      '/other/url': ['signal'],
      '/Compute/map': ['signal', 'map', 'computedMapping'],
      '/:foo': ['signal', 'rmap', 'computedRMapping'],
    })
  })
})

describe('computeShouldChange', () => {
  it('should compare changes with Compute state track map', () => {
    const tracker = new DependencyTracker(Compute(state`foo.bar`, () => ''))
    tracker.run(() => '', {})
    assert.deepEqual(
      [
        [{ path: ['foo', 'bar'] }, { path: ['bar'] }],
        [{ path: ['foo'] }, { path: ['bar'] }],
        [{ path: ['foo.bing'] }],
      ].map(
        (changed, idx) => idx + '-' + computeShouldChange(tracker, changed)
      ),
      ['0-true', '1-true', '2-false']
    )
  })
  it('should compare changes with ** in state path', () => {
    const tracker = new DependencyTracker(Compute(state`foo.**`, () => ''))
    tracker.run(() => '', {})
    assert.deepEqual(
      [
        [{ path: ['foo', 'bar'] }, { path: ['bar'] }],
        [{ path: ['foo'] }, { path: ['bar'] }],
        [{ path: ['bong'] }],
      ].map(
        (changed, idx) => idx + '-' + computeShouldChange(tracker, changed)
      ),
      ['0-true', '1-true', '2-false']
    )
  })
})
