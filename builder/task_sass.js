/*
 * Sass タスク
 */

"use strict";

import * as sass from "sass";
import postcss from "postcss";
import sortmq from "postcss-sort-media-queries";
import cssnano from "cssnano";
import { promises as fs } from "node:fs";
import path from "path/posix";
import sassglob from "./sass-glob.js";
import Util from "./util.js";

/**
 * パイプラインにかませるフィルタの定義
 */
const filters = {
    glob: {    // Scss ファイルの import 文のグロブを展開
        fn: async (text, data, options) => {
            return await sassglob(text, options);
        },
        data: undefined,
        options: {
            cwd: undefined,
        },
    },
    compile: {    // Sass から CSS にコンパイルするフィルタ
        fn: async (text, data, options) => {
            return await sass.compileString(text, options).css;
        },
        data: undefined,
        options: {
            loadPaths: undefined,
            OutputStyle: "expanded",
        },
    },
    crlf: {    // 改行コードを CRLF に置換するためのフィルタ
        fn: async (text, data, options) => {
            return await text.replaceAll("\n", "\r\n");
        },
        data: undefined,
        options: undefined,
    },
    postcss: {    // PostCSS のプラグインを実行するためのフィルタ
        fn: execPostcss,
        data: false,
        options: {
            from: "",                  // ソースマップの生成やエラーメッセージ出力のために必須らしい
            to: "",                    // 〃
            map: { inline: false },    // ソースマップを別ファイルに出力
        },
    },
};

/**
 * Sass タスク
 */
async function taskSass(conf) {
    const myconf = conf.task.sass;

    filters.glob.options.cwd = myconf.src;
    filters.compile.options.loadPaths = [myconf.src];
    filters.postcss.data = conf.release;
    filters.postcss.options.from = myconf.src;
    filters.postcss.options.to = myconf.dst;

    // style.scss を読み込む
    const src = Util.posixPath(path.join(myconf.src, myconf.patterns[0]));
    let text = await fs.readFile(src, "utf8");

    // 出力先のディレクトリを作成する
    // (postcss がソースマップを出力するので、パイプラインの実行前に)
    await fs.mkdir(path.dirname(myconf.dst), { recursive: true });

    // 読み込んだデータをパイプラインに流し込んで CSS 文字列を得る
    text = await Util.pipeline(text, filters);

    // CSS 文字列をファイルに出力する
    await fs.writeFile(myconf.dst, text, "utf8");
}

/**
 * PostCSS を実行する
 * @param {string} text - 入力 CSS データ
 * @param {boolean} release - 本番ビルドのとき true
 * @param {object} options - postcss.process() に渡すオプション
 * @returns {string} result - プラグインで処理済みの CSS データ
 */
async function execPostcss(text, release = false, options) {
    try {
        const plugins = [sortmq({ sort: "mobile-first" })];
        if (release) {
            plugins.push(cssnano);
        }

        const result = await postcss(plugins).process(text, options);
        if (!release && result.map) {
            await fs.writeFile(`${options.to}.map`, result.map.toString());
        }

        return result.css;
    } catch (err) {
        console.error(err);
    }
}

export default taskSass;
