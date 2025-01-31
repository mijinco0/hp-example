/*
 * JS タスク
 * dependencies: uglify-js
 */

"use strict";

import { minify } from "terser";
import { promises as fs } from "node:fs";
import path from "path/posix";
import Util from "./util.js";

/**
 * パイプラインにかませるフィルタの定義
 */
const filters = {
    minify: {    // JS 圧縮
        fn: async (text, enabled, options) => {
            if (enabled) {
                const result = await minify(text, options);
                text = result.code;
            }
            return text;
        },
        data: false,
        options: {
            mangle: {
                toplevel: true,
            },
            toplevel: true,
        },
    },
};

/**
 * JS タスク
 */
async function taskJs(conf) {
    const myconf = conf.task.js;
    filters.minify.data = myconf.minify;

    const files = await Util.glob(myconf.patterns, myconf.src);
    for (const file of files) {
        // JavaScript ソースファイルを読み込む
        let text = await fs.readFile(path.join(myconf.src, file), "utf8");

        // 読み込んだデータをパイプラインに流し込んでフィルタに通す
        text = await Util.pipeline(text, filters);

        // 出力先のディレクトリ作成し、そこに JS ソースファイルを出力する
        const dst = path.join(myconf.dst, path.dirname(file));
        await fs.mkdir(dst, { recursive: true });
        await fs.writeFile(path.join(myconf.dst, file), text, "utf8");
    }
}

export default taskJs;
