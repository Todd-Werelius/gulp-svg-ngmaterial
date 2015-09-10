var cheerio = require('cheerio');
var path = require('path');
var gutil = require('gulp-util');
var Stream = require('stream');

module.exports = function (config) {

  config = config || {};

  var isEmpty = true;
  var fileName = config.filename || undefined;
  var ids = {};
  var removeViewBox = config.removeViewBox || false;
  var resultSvg = "<svg><defs/></svg>";


  var $ = cheerio.load(resultSvg, { xmlMode: true });
  var $combinedDefs = $('defs');
  var stream = new Stream.Transform({ objectMode: true });

  stream._transform = function transform (file, encoding, cb) {

    if (file.isStream()) {
      return cb(new gutil.PluginError('gulp-svgstore', 'Streams are not supported!'))
    }

    if (file.isNull()) return cb();

    if (!file.cheerio) {
      file.cheerio = cheerio.load(file.contents.toString(), { xmlMode: true })
    }

    var $svg = file.cheerio('svg');

    if ($svg.length === 0) return cb();

    // The id will equal the file name we are adding in
    var idAttr = path.basename(file.relative, path.extname(file.relative));
    var viewBoxAttr = $svg.attr('viewBox');
    var $symbol = $('<g/>');

    // We cant allow duplicate ID's
    if (idAttr in ids) {
      return cb(new gutil.PluginError('gulp-svgstore', 'File name should be unique: ' + idAttr))
    }

    // Keep a copy of the ID so we can avoid collision
    ids[idAttr] = true;

    // Output filename
    if (!fileName) {
      fileName = path.basename(file.base);
      if (fileName === '.' || !fileName) {
        fileName = 'iconset.svg'
      } else {
        fileName = fileName.split(path.sep).shift() + '.svg'
      }
    }

    if (file && isEmpty) {
      isEmpty = false
    }

    $symbol.attr('id', idAttr);
    if (viewBoxAttr && !removeViewBox) {
      $symbol.attr('viewBox', viewBoxAttr)
    }

    $symbol.append($svg.contents());
    $combinedDefs.append($symbol);
    cb()
  };

  stream._flush = function flush (cb) {
    if (isEmpty) return cb();
    if ($combinedDefs.contents().length === 0) {
      $combinedDefs.remove()
    }
    var file = new gutil.File({ path: fileName, contents: new Buffer($.xml()) });
    file.cheerio = $;
    this.push(file);
    cb()
  };

  return stream;
};
