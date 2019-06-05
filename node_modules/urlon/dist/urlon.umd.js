(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.urlon = f()}})(function(){var define,module,exports;module={exports:(exports={})};
/* eslint-disable no-labels */
'use strict'

var keyStringifyRegexp = /([=:@$/])/g
var valueStringifyRegexp = /([&;/])/g
var keyParseRegexp = /[=:@$]/
var valueParseRegexp = /[&;]/

function encodeString (str, regexp) {
  return encodeURI(str.replace(regexp, '/$1'))
}

function trim (res) {
  return typeof res === 'string' ? res.replace(/;+$/g, '') : res
}

function stringify (input, recursive) {
  if (!recursive) {
    return trim(stringify(input, true))
  }
  // Number, Boolean or Null
  if (
    typeof input === 'number' ||
    input === true ||
    input === false ||
    input === null
  ) {
    return ':' + input
  }
  var res = []
  // Array
  if (input instanceof Array) {
    for (var i = 0; i < input.length; ++i) {
      typeof input[i] === 'undefined'
        ? res.push(':null')
        : res.push(stringify(input[i], true))
    }
    return '@' + res.join('&') + ';'
  }
  // Object
  if (typeof input === 'object') {
    for (var key in input) {
      var val = stringify(input[key], true)
      if (val) {
        res.push(encodeString(key, keyStringifyRegexp) + val)
      }
    }
    return '$' + res.join('&') + ';'
  }
  // undefined
  if (typeof input === 'undefined') {
    return
  }
  // String
  return '=' + encodeString(input.toString(), valueStringifyRegexp)
}

function parse (str) {
  var pos = 0
  str = decodeURI(str)

  function readToken (regexp) {
    var token = ''
    for (; pos !== str.length; ++pos) {
      if (str.charAt(pos) === '/') {
        pos += 1
        if (pos === str.length) {
          token += ';'
          break
        }
      } else if (str.charAt(pos).match(regexp)) {
        break
      }
      token += str.charAt(pos)
    }
    return token
  }

  function parseToken () {
    var type = str.charAt(pos++)
    // String
    if (type === '=') {
      return readToken(valueParseRegexp)
    }
    // Number, Boolean or Null
    if (type === ':') {
      var value = readToken(valueParseRegexp)
      if (value === 'true') {
        return true
      }
      if (value === 'false') {
        return false
      }
      value = parseFloat(value)
      return isNaN(value) ? null : value
    }
    var res
    // Array
    if (type === '@') {
      res = []
      loop: {
        // empty array
        if (pos >= str.length || str.charAt(pos) === ';') {
          break loop
        }
        // parse array items
        while (1) {
          res.push(parseToken())
          if (pos >= str.length || str.charAt(pos) === ';') {
            break loop
          }
          pos += 1
        }
      }
      pos += 1
      return res
    }
    // Object
    if (type === '$') {
      res = {}
      loop: {
        if (pos >= str.length || str.charAt(pos) === ';') {
          break loop
        }
        while (1) {
          var name = readToken(keyParseRegexp)
          res[name] = parseToken()
          if (pos >= str.length || str.charAt(pos) === ';') {
            break loop
          }
          pos += 1
        }
      }
      pos += 1
      return res
    }
    // Error
    throw new Error('Unexpected char ' + type)
  }

  return parseToken()
}

module.exports = {
  stringify: stringify,
  parse: parse
}

return module.exports;});
