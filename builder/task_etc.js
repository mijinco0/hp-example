/*
 * その他のタスク
 */

"use strict";

import fse from "fs-extra/esm";
import path from "path/posix";
import Util from "./util.js";

/**
 * 出力先のディレクトリを作成するタスク
 */
async function taskMakeDst(conf) {
    fse.emptyDir(conf.dstRoot);
}

/**
 * 指定されたディレクトリやファイルをコピーするだけのタスク
 */
async function taskCopy(conf) {
    const options = {
        preserveTimestamps: true,    // true のとき、コピー先のタイムスタンプはコピー元と同じになる
    };

    // conf.task.copy[] に定義されたコピーを 1 件ずつ実行する
    for (const cp of conf.task.copy) {
        // パターンの指定がない場合は Util.glob() で扱えるようにパターンを作る
        if (!cp.patterns) {
            cp.patterns = [path.basename(cp.from)];
            cp.from = path.dirname(cp.from);;
        }

        // グロブしてそれぞれコピーする
        const files = await Util.glob(cp.patterns, cp.from);
        for (const file of files) {
            const from = path.join(cp.from, file);
            const to = path.join(cp.to, file);
            await fse.copy(from, to, options);
        }
    }
}

export { taskMakeDst, taskCopy };
