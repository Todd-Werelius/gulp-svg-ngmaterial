/* global describe, it, before, after */

var username = process.env.SAUCE_USERNAME || 'SAUCE_USERNAME'
var accessKey = process.env.SAUCE_ACCESS_KEY || 'SAUCE_ACCESS_KEY'
var tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER
var port = process.env.PORT || 8888
var wd = require('wd')
var assert = require('assert')
var Q = wd.Q
var fs = require('fs')
var gm = require('gm')
var tmp = require('tmp')
var svgstore = require('./index')
var gutil = require('gulp-util')
var cheerio = require('cheerio')

tmp.setGracefulCleanup()

describe('gulp-svgstore unit test', function () {

  it('should not create empty svg file', function (done) {

    var stream = svgstore()
    var isEmpty = true

    stream.on('data', function () {
      isEmpty = false
    })

    stream.on('end', function () {
      assert.ok(isEmpty, 'Created empty svg')
      done()
    })

    stream.end()

  })

  it('should correctly merge svg files', function (done) {

    var stream = svgstore()

    stream.on('data', function (file) {
      var result = file.contents.toString()
      var target =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<symbol id="circle" viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></symbol>' +
      '<symbol id="square"><rect x="1" y="1" width="2" height="2"/></symbol>' +
      '</svg>'
      assert.equal( result, target )
      done()
    })

    stream.write(new gutil.File({
      contents: new Buffer('<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>')
    , path: 'circle.svg'
    }))

    stream.write(new gutil.File({
      contents: new Buffer('<svg><rect x="1" y="1" width="2" height="2"/></svg>')
    , path: 'square.svg'
    }))

    stream.end()

  })

  it('should not include null or invalid files', function (done) {

    var stream = svgstore({ inlineSvg: true })

    stream.on('data', function (file) {
      var result = file.contents.toString()
      var target =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<symbol id="circle" viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></symbol>' +
      '</svg>'
      assert.equal( result, target )
      done()
    })

    stream.write(new gutil.File({
      contents: new Buffer('<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>')
    , path: 'circle.svg'
    }))

    stream.write(new gutil.File({
      contents: null
    , path: 'square.svg'
    }))

    stream.write(new gutil.File({
      contents: new Buffer('not an svg')
    , path: 'square.svg'
    }))

    stream.end()

  })

  it('should use cached cheerio object instead of file contents', function (done) {

    var stream = svgstore({ inlineSvg: true })
    var file = new gutil.File({
      contents: new Buffer('<svg><rect x="1" y="1" width="2" height="2"/></svg>')
    , path: 'square.svg'
    })

    file.cheerio = cheerio.load('<svg><circle cx="2" cy="2" r="1"/></svg>', { xmlMode: true })

    stream.on('data', function (file) {
      var result = file.contents.toString()
      var target =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<symbol id="square"><circle cx="2" cy="2" r="1"/></symbol>' +
      '</svg>'
      assert.equal( result, target )
      done()
    })

    stream.write(file)
    stream.end()

  })

  it('should cache cheerio object for the result file', function (done) {

    var stream = svgstore()

    stream.on('data', function (file) {
      assert.ok(file.cheerio)
      assert.equal( file.contents.toString(), file.cheerio.xml() )
      done()
    })

    stream.write(new gutil.File({
      contents: new Buffer('<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>')
    , path: 'circle.svg'
    }))

    stream.end()

  })

  it('should emit error if files have the same name', function (done) {

      var stream = svgstore()

      stream.on('error', function (error) {
        assert.ok(error instanceof gutil.PluginError)
        assert.equal(error.message, 'File name should be unique: circle')
        done()
      })

      stream.write(new gutil.File({ contents: new Buffer('<svg></svg>'), path: 'circle.svg' }))
      stream.write(new gutil.File({ contents: new Buffer('<svg></svg>'), path: 'circle.svg' }))

      stream.end()

  })

  it('should generate result filename based on base path of the first file', function (done) {

      var stream = svgstore()

      stream.on('data', function (file) {
        assert.equal(file.relative, 'icons.svg')
        done()
      })

      stream.write(new gutil.File({
        contents: new Buffer('<svg/>')
      , path: 'src/icons/circle.svg'
      , base: 'src/icons'
      }))

      stream.write(new gutil.File({
        contents: new Buffer('<svg/>')
      , path: 'src2/icons2/square.svg'
      , base: 'src2/icons2'
      }))

      stream.end()

  })

  it('should generate svgstore.svg if base path of the 1st file is dot', function (done) {

      var stream = svgstore()

      stream.on('data', function (file) {
        assert.equal(file.relative, 'svgstore.svg')
        done()
      })

      stream.write(new gutil.File({
        contents: new Buffer('<svg/>')
      , path: 'circle.svg'
      , base: '.'
      }))

      stream.write(new gutil.File({
        contents: new Buffer('<svg/>')
      , path: 'src2/icons2/square.svg'
      , base: 'src2'
      }))

      stream.end()

  })

})
