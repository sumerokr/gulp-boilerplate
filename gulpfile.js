var gulp = require('gulp');
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var lazypipe = require('lazypipe');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var imagemin = require('gulp-imagemin');
var changed = require('gulp-changed');
var del = require('del');
// var nunjucksRender = require('gulp-nunjucks-render');
var prettify = require('gulp-prettify');
// var fs = require('fs');
var data = require('gulp-data');
var path = require('path');
var swig = require('gulp-swig');

var statuses = {
    isRelease: false,
    isWatch: false
};

var paths = {
    appData: './app/data/',
    appViews: './app/views/',
    appStatic: './app/static/',
    dist: './dist/',
    distStatic: './dist/static/'
};

gulp.task('html', function () {
    gulp.src(paths.appViews + 'index.html')
        .pipe(data(function (file, callback) {
            var fileName = path.basename(file.path).slice(0, -5);
            try {
                var jsonData = require('./app/data/' + fileName + '.json');
                return callback(undefined, jsonData);
            } catch(e) {
                return callback();
            }
        }))
        .pipe(swig())
        .pipe(prettify({ indent_size: 4 }))
        .pipe(gulp.dest(paths.dist))
        .pipe(gulpif(statuses.isWatch, reload({ stream: true })));
});

gulp.task('fonts', function () {
    return gulp.src(paths.appStatic + 'fonts/**/*.*')
        .pipe(changed(paths.distStatic + 'fonts/'))
        .pipe(gulp.dest(paths.distStatic + 'fonts/'));
});

gulp.task('images', function () {
    var devPipe = lazypipe()
        .pipe(changed, paths.distStatic + 'images/')
        .pipe(gulp.dest, paths.distStatic + 'images/')
        .pipe(function () {
            return gulpif(statuses.isWatch, reload({ stream: true }));
        });

    var releasePipe = lazypipe()
        .pipe(imagemin, { optimizationLevel: 3, progressive: true, interlaced: true })
        .pipe(gulp.dest, paths.distStatic + 'images/');

    return gulp.src(paths.appStatic + 'images/**/*.*')
        .pipe(gulpif(statuses.isRelease, releasePipe(), devPipe()));        
});

gulp.task('scripts', function () {
    var devPipe = lazypipe()
        .pipe(function () {
            return gulpif(statuses.isWatch, reload({ stream: true }));
        });

    var releasePipe = lazypipe()
        .pipe(streamify, uglify())
        .pipe(rename, { suffix: '.min' })
        .pipe(gulp.dest, paths.distStatic + 'scripts/');

    return browserify(paths.appStatic + 'scripts/main.js')
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest(paths.distStatic + 'scripts/'))
        .pipe(gulpif(statuses.isRelease, releasePipe(), devPipe()));
});

gulp.task('styles', function () {
    var devPipe = lazypipe()
        .pipe(function () {
            return gulpif(statuses.isWatch, reload({ stream: true }));
        });

    var releasePipe = lazypipe()
        .pipe(minifyCSS)
        .pipe(rename, { suffix: '.min' })
        .pipe(gulp.dest, paths.distStatic + 'styles/');

    return gulp.src(paths.appStatic + 'styles/main.less')
        .pipe(less())
        // опция отключения каскадного форматирования не работает в версии 0.0.8
        // issue - https://github.com/Metrime/gulp-autoprefixer/issues/25
        .pipe(autoprefixer({ cascade: false }))
        .pipe(gulp.dest(paths.distStatic + 'styles/'))
        .pipe(gulpif(statuses.isRelease, releasePipe(), devPipe()));
});

gulp.task('videos', function () {
    return gulp.src(paths.appStatic + 'videos/**/*.*')
        .pipe(changed(paths.distStatic + 'videos/'))
        .pipe(gulp.dest(paths.distStatic + 'videos/'));
});

gulp.task('clean', function () {
    del.sync([paths.dist]);
});

gulp.task('watch', ['default', 'browser-sync'], function () {
    gulp.watch(paths.appViews + '**/*.html', ['html']);
    gulp.watch(paths.appStatic + 'styles/**/*.less', ['styles']);
    gulp.watch(paths.appStatic + 'scripts/**/*.js', ['scripts']);
    gulp.watch(paths.appStatic + 'images/**/*.*', ['images']);
});

gulp.task('browser-sync', ['default'], function () {
    browserSync({ server: { baseDir: paths.dist } });
    statuses.isWatch = true;
});

gulp.task('set-release-state', function () {
    statuses.isRelease = true;
});

gulp.task('default', ['html', 'fonts', 'images', 'scripts', 'styles', 'videos']);

gulp.task('release', ['set-release-state', 'clean', 'default']);
