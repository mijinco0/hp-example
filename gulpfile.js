const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const glob = require('gulp-sass-glob');
const lec = require('gulp-line-ending-corrector');
const pcss = require('gulp-postcss');
const mqp = require('css-mqpacker');

const io_sass = {
    src: 'sass/**/*.scss',
    dest: 'css',
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

exports.default = gulp.series(
    sass_task
);
