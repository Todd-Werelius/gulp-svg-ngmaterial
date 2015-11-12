var cheerio = require('cheerio');
var path = require('path');
var gutil = require('gulp-util');
var Stream = require('stream');

module.exports = function (config) {

  var SYMBOL = '<symbol/>';
  var SVG    = '<svg/>';
  var G      = '<g/>';

  config = config || {};

  var isEmpty = true;
  var fileName = config.filename || undefined;
  var ids = {};
  var contentTransfrom   = config.contentTransform || SVG;
  var resultSvg          = "<svg><defs/></svg>";


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
    var widthAttr   = $svg.attr('width');
    var heightAttr  = $svg.attr('height');

    var $symbol = $(contentTransfrom);
    //var $symbol = $('<g/>');

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

    // Add in only basic attributes that are required dependent on content type
    // option selected by user, g cannot use viewBox or width/height, symbol cannot
    // use width height
    $symbol.attr('id', idAttr);
    if (viewBoxAttr && (contentTransfrom === SVG || contentTransfrom == SYMBOL)) {
      $symbol.attr('viewBox', viewBoxAttr)
    }
    if (widthAttr && contentTransfrom === SVG) {
      $symbol.attr('width', widthAttr);
    }
    if (heightAttr && contentTransfrom === SVG) {
      $symbol.attr('height', heightAttr);
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

