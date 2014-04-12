var gulp = require('gulp');
var less = require('gulp-less');
var clean = require('gulp-clean');
var imagemin = require('gulp-imagemin');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var rename = require('gulp-rename');
var livereload = require('gulp-livereload');
var changed = require('gulp-changed');


// флаг для livereload. Принимает true при запуске watch задачи
var isWatch = false;

// исходники и целевая папка dev-а
var dev_src = './layout/dev/staticfiles/_src/';
var dev_staticfiles = './layout/dev/staticfiles/';

// исходники и целевая папка проекта
var project_src = './project/staticfiles/_src/';
var project_staticfiles = './project/staticfiles/';

// js файлы для минификации при релизе проекта
var jsFiles = [
    project_src + 'js/vendor/jquery-1.11.0.js',
    project_src + 'js/main.js'
];


// очистка целевых файлов dev-а
gulp.task('layout-dev-clean', function() {
    gulp.src([
            './layout/dev/staticfiles/**/*.*',
            '!./layout/dev/staticfiles/_src/**/*.*'
        ], {read: false})
        .pipe(clean());
});

// очистка целевых файлов проекта
gulp.task('project-dev-clean', function() {
    gulp.src([
            './project/staticfiles/**/*.*',
            '!./project/staticfiles/_src/**/*.*'
        ], {read: false})
        .pipe(clean());
});

// копирование исходных файлов dev-а в проект
gulp.task('staticfiles-migrate', function() {
    gulp.src('./layout/dev/staticfiles/_src/**')
        .pipe(gulp.dest(project_src));
});


// layoutDev start
gulp.task('layout-dev-fonts', function() {
    gulp.src(dev_src + 'fonts/**/*.{ttf,woff,eot}')
        .pipe(gulp.dest(dev_staticfiles + 'fonts/'));
});

gulp.task('layout-dev-img', function() {
    gulp.src(dev_src + 'img/**/*.{jpg,png,gif}')
        .pipe(changed(dev_staticfiles + 'img/')) // отсеивает неизмененные файлы
        .pipe(gulp.dest(dev_staticfiles + 'img/'));
});

gulp.task('layout-dev-js', function() {
    var _res = gulp.src(dev_src + 'js/**/*.js')
        .pipe(changed(dev_staticfiles + 'js/')) // отсеивает неизмененные файлы
        .pipe(gulp.dest(dev_staticfiles + 'js/'));

    if (isWatch) _res.pipe(livereload());
});

gulp.task('layout-dev-less', function() {
    var _res = gulp.src(dev_src + 'less/main.less')
        .pipe(less())
        .pipe(gulp.dest(dev_staticfiles + 'css/'));

    if (isWatch) _res.pipe(livereload());
});

gulp.task('layout-dev-video', function() {
    gulp.src(dev_src + 'video/**/*.{mp4,webm,ogg}')
        .pipe(gulp.dest(dev_staticfiles + 'video/'));
});
// layoutDev end


// projectDev start
gulp.task('project-dev-fonts', function() {
    gulp.src(project_src + 'fonts/**/*.{ttf,woff,eot}')
        .pipe(gulp.dest(project_staticfiles + 'fonts/'));
});

gulp.task('project-dev-img', function() {
    gulp.src(project_src + 'img/**/*.{jpg,png,gif}')
        .pipe(changed(project_staticfiles + 'img/')) // отсеивает неизмененные файлы
        .pipe(gulp.dest(project_staticfiles + 'img/'));
});

gulp.task('project-dev-js', function() {
    var _res = gulp.src(project_src + 'js/**/*.js')
        .pipe(changed(project_staticfiles + 'js/')) // отсеивает неизмененные файлы
        .pipe(gulp.dest(project_staticfiles + 'js/'));

    if (isWatch) _res.pipe(livereload());
});

gulp.task('project-dev-less', function() {
    var _res = gulp.src(project_src + 'less/main.less')
        .pipe(less())
        .pipe(gulp.dest(project_staticfiles + 'css/'));

    if (isWatch) _res.pipe(livereload());
});

gulp.task('project-dev-video', function() {
    gulp.src(project_src + 'video/**/*.{mp4,webm,ogg}')
        .pipe(gulp.dest(project_staticfiles + 'video/'));
});
// projectDev end


// projectRelease start
gulp.task('project-release-fonts', function() {
    gulp.src(project_src + 'fonts/**/*.{ttf,woff,eot}')
        .pipe(gulp.dest(project_staticfiles + 'fonts/'));
});

gulp.task('project-release-img', function() {
    gulp.src(project_src + 'img/**/*.{jpg,png,gif}')
        .pipe(imagemin({optimizationLevel: 2, interlaced: true, /*pngquant: true, */progressive: true}))
        .pipe(gulp.dest(project_staticfiles + 'img/'));
});

gulp.task('project-release-js', function() {
    gulp.src(jsFiles)
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(project_staticfiles + 'js/'));
});

gulp.task('project-release-less', function() {
    gulp.src(project_src + 'less/main.less')
        .pipe(less())
        .pipe(minifyCSS({keepSpecialComments: 0}))
        .pipe(rename('main.min.css'))
        .pipe(gulp.dest(project_staticfiles + 'css/'));
});

gulp.task('project-release-video', function() {
    gulp.src(project_src + 'video/**/*.{mp4,webm,ogg}')
        .pipe(gulp.dest(project_staticfiles + 'video/'));
});
// projectRelease end


gulp.task('layout-build', [
    'layout-dev-fonts',
    'layout-dev-img',
    'layout-dev-js',
    'layout-dev-less',
    'layout-dev-video'
]);

gulp.task('layout-watch', function() {
    isWatch = true;
    livereload();

    gulp.watch(dev_src + 'fonts/**/*.{ttf,woff,eot}', ['layout-dev-fonts']);
    gulp.watch(dev_src + 'img/**/*.{jpg,png,gif}', ['layout-dev-img']);
    gulp.watch(dev_src + 'js/**/*.js', ['layout-dev-js']);
    gulp.watch(dev_src + 'less/*.less', ['layout-dev-less']);
    gulp.watch(dev_src + 'video/**/*.{mp4,webm,ogg}', ['layout-dev-video']);
});


gulp.task('project-build', [
    'project-dev-fonts',
    'project-dev-img',
    'project-dev-js',
    'project-dev-less',
    'project-dev-video'
]);

gulp.task('project-release', [
    'project-release-fonts',
    'project-release-img',
    'project-release-js',
    'project-release-less',
    'project-release-video'
]);

gulp.task('project-watch', function() {
    isWatch = true;
    livereload();

    gulp.watch(project_src + 'fonts/**/*.{ttf,woff,eot}', ['project-dev-fonts']);
    gulp.watch(project_src + 'img/**/*.{jpg,png,gif}', ['project-dev-img']);
    gulp.watch(project_src + 'js/**/*.js', ['project-dev-js']);
    gulp.watch(project_src + 'less/main.less', ['project-dev-less']);
    gulp.watch(project_src + 'video/**/*.{mp4,webm,ogg}', ['project-dev-video']);
});
