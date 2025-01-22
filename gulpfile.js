const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const glob = require('gulp-sass-glob');
const lec = require('gulp-line-ending-corrector');
const pcss = require('gulp-postcss');
const mqp = require('css-mqpacker');
const ejs = require('gulp-ejs');
const rename = require('gulp-rename');
const data = require('gulp-data');
const fs = require('fs');
const path = require('path/posix');
const Site = require('./builder/site');
const Util = require('./builder/util');

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
    path: 'src/ejs/',
    src: ['src/ejs/**/*.ejs', '!src/ejs/**/_*.ejs'],
    dest: 'public/',
}

/* EJS task */
function ejs_task() {
    /* CSS のキャッシュをクリアするため、CSS の読み込みタグにクエリを付加する
       参考: https://do.gt-gt.org/avoid-cache/
       クエリはタイムスタンプ (?YYYYMMDDhhmmss) とする */
    const d = new Date();
    let cssquery = '?' + String(d.getFullYear()) +
              String(d.getMonth() + 1).padStart(2, '0') +
              String(d.getDate()).padStart(2, '0') +
              String(d.getHours()).padStart(2, '0') +
              String(d.getMinutes()).padStart(2, '0') +
              String(d.getSeconds()).padStart(2, '0');
    cssquery = ""    // CSS クエリをつけたい場合はここをコメントアウト
    console.log(`css query: ${cssquery}`);

    const site = new Site(
        'src/site/base.json',
        'src/site/category.csv',
        'src/site/article.csv',
    );

    const ejsdata = {
        site: site,
        cssQuery: cssquery,

        // よく使う関数に別名をつける
        join: Util.pathJoin,
    };

    return gulp.src(io_ejs.src)
        .pipe(data(function(ejsfile) {
            const fpath = ejsfile.path.replace(/\\/g, '/');
            const htmlpath = Util.replaceExt(fpath, '.html');
            const a = ejsdata.site.articleByPath(htmlpath);
            const fromrt = a ? ejsdata.site.pathFromRoot(a.category.key, a.key) : '/';
            const tort = a ? ejsdata.site.pathToRoot(a.category.key, a.key) : '';
            const inc = path.join(tort, "_parts/");    // 末尾に「/」が付くことを保証する
            console.log(`ejsfile=${path.basename(fpath)}, fromRoot=${fromrt}, toRoot=${tort}, inc=${inc}`);

            ejsdata.article = a;
            ejsdata.category = a ? a.category : undefined;
            ejsdata.path = {
                fromRoot: fromrt,
                toRoot: tort,
                include: inc,
            };
        }))
        .pipe(ejs({$: ejsdata}))
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
