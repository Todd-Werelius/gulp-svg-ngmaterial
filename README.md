gulp-svg-ngmaterial 
=============

Combines svg files into an icon set ( single file containing all svg's ) compatible with the Angular Material frameworks $mdIconProvider service. Derived from [gulp-svgstore](https://github.com/w0rm/gulp-svgstore) and modified for use with Angular Material

This allows you to create custom sets of the icons you into a single file for performance and ease of use. 

SOURCES FOR Material Design Icons in SVG format can be found at ... 

[3rd Party - System+Xtra Material Design Icons](www.materialdesignicons.com)

[Google - System Only Material Design Icons - website](https://www.google.com/design/icons/) 

[Google - System Only Material Design Icons - github](https://github.com/google/material-design-icons) 

This module takes each individual svg file that it processes and ...  
* Strips all extraneous container information so that only viewBox, width and height attributes remain
* Moves `<svg>`elements or converts `<svg>` elements to `<g>` or `<symbol>` elements
* Place all converted elements into a `<defs>...</defs>` container wrapped within a `<svg>` parent.  

e.g if two files are fed into the module 

`menu.svg`
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path ...>
</svg>
```
`more-vert.svg`
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path...>
</svg>
```

The resulting file icons.svg would look something like this ( if not compressed ) ... 
```xml
<svg>
  <defs>
    <svg id="menu" viewBox="0 0 24.00 24.00" width="24" height="24">
      <path ..."/>
   </svg>
   <svg id="more-vert"  viewBox="0 0 24 24" width="24" height="24">
     <path ..."/>    
   </svg>
  </defs>
</svg>
```
Which could then be loaded in an AngularJS modules .config section like this 
```js
$mdIconProvider.defaultIconSet('icons.svg');
```
and used in the hmtl like this 
```html
<md-button class="md-icon-button" aria-label="Navigation">
  <md-icon md-svg-icon="menu"></md-icon>
</md-button>
```
Read more about using the $mdIconProvider service with icon sets in the [Angular Material Documentaion](https://material.angularjs.org/HEAD/#/api/material.components.icon/service/$mdIconProvider).

If your are looking for a more generic method of combining svg's you should look at the [gulp-svgstore](https://github.com/w0rm/gulp-svgstore) plugin that `gulp-svg-ngmaterial` was based on, which at the time I wrote this did not work properly for $mdIconProvider

NOTE: Tests are not functioning yet, I will get around to this shortly ( which may mean a week or a year ) 

### Options object:

```js
{ filename         : 'filename.svg', // ( string ) name of resulting icon set file 
  contentTransform : '<svg/>'        // ( string ) default --- OR use one of the names below  
                      //* `<g/>`      retains no attributes, not reccomended 
                      //* `<symbol/>` retains viewBox BUT Angular Material not currently supporting   
 }
```

```js
 ({ filename  : "somefilename.svg", contentTransform : `<svg/>` [default so not actually required]})
```

### Most Common Usage
* Minimize svg files using gulp-svgmin
* Strip fill= attribute using gulp-cheerio
* Combine all svg's into common file/icon set ( this module )
* Output icon set in raw and zipped format

```js
gulp.task('build-svg-iconset', function () {
  return gulp
    .src('assets/svg/**/*.svg')
    .pipe(svgMin())
    .pipe(cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(svgIconSet({ filename : "icons.svg"}))
    .pipe(gulp.dest('app/assets/svg'))
    .pipe(gzip({append: true,gzipOptions: { level: 9 }}))
    .pipe(gulp.dest('app/assets/svg'));
});
```

If you need to have nested directories that may have files with the same name
use `gulp-rename`. The following example will concatenate relative path with the
name of the file e.g. `src/svg/one/two/three/circle.svg` becomes `one-two-three-circle`.

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

### Other patterns used by [gulp-svgstore](https://github.com/w0rm/gulp-svgstore) also work

## Changelog
* cleaned up docs
* contentTransform option now supports `<svg>` output by default to the `<def>...</def>` container
* removeViewbox option deprecated, attributes are now stripped according to output type
* Added note about viewBox usage 

