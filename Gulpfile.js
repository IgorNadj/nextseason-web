'use strict';
 
var gulp = require('gulp');
var sass = require('gulp-sass');
 
gulp.task('sass', function () {
  gulp.src('./theme/scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./theme/css'));
});
 
gulp.task('sass:watch', function () {
  gulp.watch('./theme/scss/**.scss', ['sass']);
});
