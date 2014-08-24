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
var debug = require('gulp-debug');
var del = require('del');

var statuses = {
    isRelease: false,
    isWatch: false
};

var paths = {
    layout: './layout/',
    src: './layout/static/_src/',
    dest: './layout/static/'
};

gulp.task('fonts', function () {
    return gulp.src(paths.src + 'fonts/**/*.*')
        .pipe(changed(paths.dest + 'fonts/'))
        .pipe(gulp.dest(paths.dest + 'fonts/'));
});

gulp.task('images', function () {
    var devPipe = lazypipe()
        .pipe(changed, paths.dest + 'images/')
        .pipe(gulp.dest, paths.dest + 'images/')
        .pipe(function () {
            return gulpif(statuses.isWatch, reload({ stream: true }));
        });

    var releasePipe = lazypipe()
        .pipe(imagemin, { optimizationLevel: 3, progressive: true, interlaced: true })
        .pipe(gulp.dest, paths.dest + 'images/');

    return gulp.src(paths.src + 'images/**/*.*')
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
        .pipe(gulp.dest, paths.dest + 'scripts/');

    return browserify(paths.src + 'scripts/main.js')
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest(paths.dest + 'scripts/'))
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
        .pipe(gulp.dest, paths.dest + 'styles/');

    return gulp.src(paths.src + 'styles/main.less')
        .pipe(less())
        // опция отключения каскадного форматирования не работает в версии 0.0.8
        // issue - https://github.com/Metrime/gulp-autoprefixer/issues/25
        .pipe(autoprefixer({ cascade: false }))
        .pipe(gulp.dest(paths.dest + 'styles/'))
        .pipe(gulpif(statuses.isRelease, releasePipe(), devPipe()));
});

gulp.task('videos', function () {
    return gulp.src(paths.src + 'videos/**/*.*')
        .pipe(changed(paths.dest + 'videos/'))
        .pipe(gulp.dest(paths.dest + 'videos/'));
});

gulp.task('clean', function () {
    del.sync([
        paths.dest + 'fonts/',
        paths.dest + 'images/',
        paths.dest + 'scripts/',
        paths.dest + 'styles/',
        paths.dest + 'videos/'
    ]);
});

gulp.task('watch', ['default', 'browser-sync'], function () {
    gulp.watch(paths.layout + '**/*.html', reload);
    gulp.watch(paths.src + 'styles/**/*.less', ['styles']);
    gulp.watch(paths.src + 'scripts/**/*.js', ['scripts']);
    gulp.watch(paths.src + 'images/**/*.*', ['images']);
});

gulp.task('browser-sync', ['default'], function () {
    browserSync({ server: { baseDir: paths.layout } });
    statuses.isWatch = true;
});

gulp.task('set-release-state', function () {
    statuses.isRelease = true;
});

gulp.task('default', ['styles', 'scripts', 'images', 'fonts', 'videos']);

gulp.task('release', ['set-release-state', 'clean', 'default']);
