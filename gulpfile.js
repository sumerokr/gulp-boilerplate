var gulp = require('gulp');
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var browserSync = require('browser-sync');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var lazypipe = require('lazypipe');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var changed = require('gulp-changed');
var del = require('del');
var data = require('gulp-data');
var path = require('path');
var swig = require('gulp-swig');
var sourcemaps = require('gulp-sourcemaps');
var gulpFilter = require('gulp-filter');
var concat = require('gulp-concat');

var statuses = {
    isRelease: false,
    isWatch: false
};

var paths = {
    appData: './app/data/',
    appLayouts: './app/layouts/',
    appPartials: './app/partials/',
    appViews: './app/views/',
    appStatic: './app/static/',
    dist: './dist/',
    distStatic: './dist/static/'
};

function getJsonData(file, next) {
    var fileNameFull = path.basename(file.path);
    var fileExt = path.extname(file.path);
    var fileName = fileNameFull.slice(0, -fileExt.length);
    try {
        var jsonData = require('./app/data/' + fileName + '.json');
        return next(undefined, jsonData);
    } catch(e) {
        return next();
    }
}

gulp.task('html', function () {
    gulp.src(paths.appViews + '**/*.html')
        .pipe(data(getJsonData))
        .pipe(swig({ defaults: { cache: false } }))
        .pipe(gulp.dest(paths.dist));
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
            return gulpif(statuses.isWatch, browserSync.reload({ stream: true }));
        });

    var releasePipe = lazypipe()
        .pipe(imagemin, { optimizationLevel: 3, progressive: true, interlaced: true })
        .pipe(gulp.dest, paths.distStatic + 'images/');

    return gulp.src(paths.appStatic + 'images/**/*.*')
        .pipe(gulpif(statuses.isRelease, releasePipe(), devPipe()));        
});

gulp.task('scripts', function () {
    var releasePipe = lazypipe()
        .pipe(uglify)
        .pipe(rename, { suffix: '.min' })
        .pipe(gulp.dest, paths.distStatic + 'scripts/');

    return gulp.src([
            paths.appStatic + 'scripts/vendor/jquery.js'
            , paths.appStatic + 'scripts/main.js'
        ])
        .pipe(sourcemaps.init())
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.distStatic + 'scripts/'))
        .pipe(gulpFilter('**/*.js'))
        .pipe(gulpif(statuses.isRelease, releasePipe()));
});

gulp.task('styles', function () {
    var devPipe = lazypipe()
        .pipe(function () {
            return gulpif(statuses.isWatch, browserSync.reload({ stream: true }));
        });

    var releasePipe = lazypipe()
        .pipe(minifyCSS)
        .pipe(rename, { suffix: '.min' })
        .pipe(gulp.dest, paths.distStatic + 'styles/');

    return gulp.src(paths.appStatic + 'styles/main.less')
        // https://github.com/sindresorhus/gulp-autoprefixer/issues/2
        // .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(autoprefixer({ cascade: false }))
        // // https://github.com/sindresorhus/gulp-autoprefixer/issues/2
        // .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.distStatic + 'styles/'))
        .pipe(gulpFilter('**/*.css'))
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

gulp.task('watch', ['browser-sync'], function () {
    gulp.watch([
        paths.appViews + '**/*.html',
        paths.appLayouts + '**/*.html',
        paths.appPartials + '**/*.html'
    ], ['html', browserSync.reload]);
    gulp.watch(paths.appStatic + 'styles/**/*.{less,css}', ['styles']);
    gulp.watch(paths.appStatic + 'scripts/**/*.js', ['scripts', browserSync.reload]);
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
