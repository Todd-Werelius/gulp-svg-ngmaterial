gulp-svg-ngmaterial 
=============

Combines Angular Material svg files into an icon set compatible with the Angular Material frameworks $mdIconProvider service. Derived from [gulp-svgmin](https://github.com/w0rm/gulp-svgstore) and modified for use speficially with Angular Material

This primarily means for each svg file ...  
* Stripping all extraneous container information so that only viewBox, width and height attributes remain
* Moves `<svg>`elements or converts to `<g>` or `<symbol>` elements
* Place all converted elements into a `<defs>...</defs>` container wrapped within a `<svg>` parent.  

NOTE: `<svg>` elements are the default since they are the most flexible, `<symbol>` is not yet supported by $mdIconProvider, `<g>` is what you will see in the Angular Material icon sets on github but are the least flexible since they do not support viewBox

Read more about using the $mdIconProvider service with icon sets in the [Angular Material Documentaion](https://material.angularjs.org/HEAD/#/api/material.components.icon/service/$mdIconProvider).

If your are looking for a more generic method of combining svg's you should look at the [gulp-svgmin](https://github.com/w0rm/gulp-svgstore) plugin that `gulp-svg-ngmaterial` was based on, but at the time I wrote this it did not work properly with $mdIconProvider

NOTE: Tests are not functioning yet, I will get around to this shortly ( which may mean a week or a year ) 

### Options:

* filename - name of resulting icon set file, if undefined the name of base directory of the first file found
* contentTransform   
*   `<svg/>` ( default if nothing is specified ) retains viewBox and height width attriabutes
*   `<g/>` retains no attributes
*   `<symbol/>` retains viewBox attriabutes BUT will not curently work with Angular Material  


```js
    ({ filename  : string (defaults to undefined ), contentTransform : `<svg/>` (default so not actually required)})
```

## Usage

The following script will combine all svg sources into a icon set file with `<svg>` elements moved within the `<defs> </defs>` container after all attributes EXCEPT the viewBox, width, and height attributes IF present, and an id element will be added. 

The `id` attribute of the `<svg>` element is set to the name of containing file, duplicate file names are therefore not allowed unless you take special steps to avoid id collision 

The name of the resulting icon set file will be the base directory name of the first file. A `.svg` suffix will be added e.g if the first file was contained within the /somedir/src directory then the file would be name `src.svg`, this can be overriden using options

If you have id collisions you can pass the svg files through [gulp-svgmin](https://github.com/ben-eb/gulp-svgmin)
to minify the svg and ensure unique ids.

```js
var gulp = require('gulp');
var svgng = require('gulp-svg-ngmaterial');
var svgmin = require('gulp-svgmin');
var path = require('path');

gulp.task('svgstore', function () {
    return gulp
        .src('test/src/*.svg')
        .pipe(svgmin(function (file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: true
                    }
                }]
            }
        }))
        .pipe(svgng())
        .pipe(gulp.dest('test/dest'));
});
```

### Renaming the output file to icons.svg

```js

var gulp = require('gulp');
var svgng = require('gulp-svg-ngmaterial');
var svgmin = require('gulp-svgmin');
var path = require('path');

gulp.task('svgng', function () {
    return gulp
        .src('test/src/*.svg')
        .pipe(svgmin(function (file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: true
                    }
                }]
            }
        }))
        .pipe(svgng({filename:"icons.svg"))
        .pipe(gulp.dest('test/dest'));
});
```

### Generating id attributes

Id of each `<svg>` ( or containing ) element is calculated from the file name. Therefore you cannot pass files with the same name,because the id's must be unique.

If you need to add a prefix to each id, please use `gulp-rename`:

```js
var gulp = require('gulp');
var rename = require('gulp-rename');
var svgng = require('gulp-svg-ngmaterial');

gulp.task('default', function () {
    return gulp
        .src('src/svg/**/*.svg', { base: 'src/svg' })
        .pipe(rename({prefix: 'icon-'}))
        .pipe(svgng())
        .pipe(gulp.dest('dest'));
});
```

If you need to have nested directories that may have files with the same name, please
use `gulp-rename`. The following example will concatenate relative path with the name of the file,
e.g. `src/svg/one/two/three/circle.svg` becomes `one-two-three-circle`.


```js
var gulp = require('gulp');
var rename = require('gulp-rename');
var svgng = require('gulp-svg-ngmaterial');

gulp.task('default', function () {
    return gulp
        .src('src/svg/**/*.svg', { base: 'src/svg' })
        .pipe(rename(function (path) {
            var name = path.dirname.split(path.sep);
            name.push(path.basename);
            path.basename = name.join('-');
        }))
        .pipe(svgng())
        .pipe(gulp.dest('dest'));
});
```

## Transform svg sources or combined svg

To transform either svg sources or combined svg you may pipe your files through
[gulp-cheerio](https://github.com/KenPowers/gulp-cheerio).

### Transform svg sources

An example below removes all fill attributes from svg sources before combining them.
Please note that you have to set `xmlMode: true` to parse svgs as xml file.

```js
var gulp = require('gulp');
var svgng = require('gulp-svg-ngmaterial');
var cheerio = require('gulp-cheerio');

gulp.task('svgng', function () {
    return gulp
        .src('test/src/*.svg')
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
            },
            parserOptions: { xmlMode: true }
        }))
        .pipe(svgng()
        .pipe(gulp.dest('test/dest'));
});
```

### Transform combined svg

The following example sets `style="display:none"` on the combined svg:
(beware if you use gradients and masks, display:none breaks those and just show
nothing, best method is to use the [method show above](#inlining-svgstore-result-into-html-body) )


```js
var gulp = require('gulp');
var svgng = require('gulp-svg-ngmaterial');
var cheerio = require('gulp-cheerio');

gulp.task('svgstore', function () {
    return gulp
        .src('test/src/*.svg')
        .pipe(svgng())
        .pipe(cheerio(function ($) {
            $('svg').attr('style',  'display:none');
        }))
        .pipe(gulp.dest('test/dest'));
});
```

## Extracting metadata from combined svg

Since gulp-svg-ngmaterial and gulp-cheerio plugins cache cheerio in gulp file object,
you may use it in your pipeline to extract metadata from svg sources or combined svg.
The following example extracts viewBox and id from each symbol in combined svg.

```js
var gulp = require('gulp');
var gutil = require('gulp-util');
var svgng = require('gulp-svg-ngmaterial');
var through2 = require('through2');

gulp.task('metadata', function () {
    return gulp
        .src('test/src/*.svg')
        .pipe(svgstore())
        .pipe(through2.obj(function (file, encoding, cb) {
            var $ = file.cheerio;
            var data = $('svg > symbol').map(function () {
                return {
                    name: $(this).attr('id'),
                    viewBox: $(this).attr('viewBox')
                };
            }).get();
            var jsonFile = new gutil.File({
                path: 'metadata.json',
                contents: new Buffer(JSON.stringify(data))
            });
            this.push(jsonFile);
            this.push(file);
            cb();
        }))
        .pipe(gulp.dest('test/dest'));
});
```

## Changelog
Added note about viewBox usage 
removeViewbox option deprecated, attributes are now stripped according to output type
contentTransform option now supports '<svg>' output by default to the '<def>...</def>' container

