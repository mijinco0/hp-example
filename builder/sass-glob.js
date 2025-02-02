/*
 * 自家製 gulp-sass-glob
 * dependencies: glob
 */

"use strict";

import { glob } from "glob";
import path from "path";
import Util from "./util.js";

/**
 * 簡易的な gulp-sass-glob \
 * 行ごとに「@import "component/**"; 」のようなパターンを展開して個々のファイルの @import 文に置換する \
 * それ以外の行はただそのまま出力する
 * @param {string} text - Scss 文字列
 * @param {object} option - glob.glob() に渡すオプション
 * @returns {string} - グロブ処理後の Scss 文字列
 */
async function sassGlob(text, option = { cwd: "." }) {
    const br = text.includes("\r\n") ? "\r\n" : "\n";
    const lines = text.split(br);
    text = "";

    for (const line of lines) {
        const m = line.match(/^@import\s+"(.+\/\*\*)";$/);
        if (m !== null) {
            let pattern = path.join(m[1], "*.scss");
            pattern = Util.posixPath(pattern);    // glob は POSIX 形式じゃないと受け付けてくれないらしい
            const files = await glob(pattern, option);
            files.sort();
            for (const file of files) {
                const fimport = Util.posixPath(file).replace(".scss", "");
                text += `@import "${fimport}";${br}`;
            }
        } else {
            text += `${line}${br}`;
        }
    }

    return text;
}

export default sassGlob;
