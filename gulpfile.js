const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const glob = require('gulp-sass-glob');
const lec = require('gulp-line-ending-corrector');
const pcss = require('gulp-postcss');
const mqp = require('css-mqpacker');
const ejs = require('gulp-ejs');
const rename = require('gulp-rename');

const io_sass = {
    src: 'src/sass/**/*.scss',
    dest: 'public/css/',
}
const opt_sass = {
    outputStyle: 'expanded',
}
const opt_lec = {
    eolc: 'CRLF',        /* CRLF|CR|LF */
    encoding: 'utf8',    /* others are not tested */
}

/* Sass task */
function sass_task() {
    return gulp.src(io_sass.src)
        .pipe(glob())
        .pipe(sass(opt_sass))
        .pipe(lec(opt_lec))
        .pipe(pcss([mqp()]))
        .pipe(gulp.dest(io_sass.dest))
        ;
}

const io_ejs = {
    src: ['src/ejs/**/*.ejs', '!src/ejs/**/_*.ejs'],
    dest: 'public/',
}

/* EJS task */
function ejs_task() {
    return gulp.src(io_ejs.src)
        .pipe(ejs())
        .pipe(rename({extname: '.html'}))
        .pipe(gulp.dest(io_ejs.dest))
        ;
}

const io_css = {
    src: 'src/css/**/*.css',
    dest: 'public/css/',
}

/* css task */
function css_task() {
    return gulp.src(io_css.src)
        .pipe(gulp.dest(io_css.dest))
        ;
}

exports.default = gulp.series(
    sass_task,
    css_task,
    ejs_task,
);
