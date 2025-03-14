/*
 * Gulp フリーなタスクランナーもどき
 *
 * usage: node ./builder.js [options]
 * options:
 * --config-file=<path>, -c <path>: コンフィグレーションファイルへのパス [default: ./config.json]
 * --src-root=<path>, -r <path>: ソースディレクトリへのパス (*1)
 * --ejs-src=<name>, -e <name>: EJS のソースディレクトリ名 (*1)
 * --ejs-inc=<name>, -i <name>: EJS のインクルードディレクトリ名 (*1)
 * --sass-src=<path>, -s <name>: style.scss へのパス (*1, *2)
 * --js-src=<name>, -j <name>: JS のソースディレクトリ名 (*1)
 * --dst-root=<path>, -d <path>: 成果物の出力先ディレクトリへのパス (*1)
 * --release -R: 指定されたとき本番ビルド (圧縮 ON、デバッグ機能 OFF) を行う (*1)
 * --query -Q: 指定されたとき CSS クエリを付ける (*1, *3)
 * --no-query -q: 指定されたとき CSS クエリを付けない (*1, *3)
 * (*1) 指定した場合、config.json の対応するプロパティの値を上書きする
 * (*2) ファイル名を含めてもよい。ただし拡張子は .scss に固定とする
 *      ファイル名が省略された場合のデフォルトは style.scss となる
 * (*3) -Q と -q が同時に指定されたら -q を優先する
 *
 * 使用上の注意:
 * - npm-scripts から実行する場合、上記のオプションは "--" の後に指定すること
 *   ex) npm run builder -- -q
 *
 * 使用前の準備:
 * - package.json の type プロパティの値を "module" に変更すること
 */

"use strict";

import { parseArgs } from "node:util";
import { promises as fs } from "fs";
import path from "path/posix";
import Conf from "./config.js";
import Site from "./site.js";
import Util from "./util.js";

import taskEjs from "./task_ejs.js";
import taskSass from "./task_sass.js";
import taskJs from "./task_js.js";
import taskSitemap from "./task_sitemap.js";
import { taskMakeDst, taskCopy } from "./task_etc.js";

/**
  * オプション処理
  * @returns {object} - コンフィグレーションが格納されたオブジェクト
  */
async function parseOptions() {
    const options = {
        "config-file": { type: "string", short: "c", default: undefined, },
        "src-root": { type: "string", short: "r", default: undefined, },
        "ejs-src": { type: "string", short: "e", default: undefined, },
        "ejs-inc": { type: "string", short: "i", default: undefined, },
        "sass-src": { type: "string", short: "s", default: undefined, },
        "js-src": { type: "string", short: "j", default: undefined, },
        "dst-root": { type: "string", short: "d", default: undefined, },
        "release": { type: "boolean", short: "R", default: undefined, },
        "query": { type: "boolean", short: "Q", default: undefined, },
        "no-query": { type: "boolean", short: "q", default: undefined, },
    };

    try {
        // コンフィグレーションファイル名を取得する
        const args = parseArgs({ options, allowPositionals: false });
        let v = args.values["config-file"];
        const fconf = v ? Util.posixPath(v) : "./config.json";

        // コンフィグレーションファイルを読み出す
        const json = await fs.readFile(fconf, "utf8");
        const conf = JSON.parse(json);

        // オプションで指定されたプロパティを上書きする
        if ((v = args.values["src-root"])) conf.srcRoot = v;
        if ((v = args.values["ejs-src"])) conf.task.ejs.root = v;
        if ((v = args.values["ejs-inc"])) conf.task.ejs.inc = v;
        if ((v = args.values["sass-src"])) {
            const pp = path.parse(Util.posixPath(v));
            if (pp.ext === ".scss") {
                conf.task.sass.src = pp.dir;
                conf.task.sass.patterns = [pp.base];
            } else {
                conf.task.sass.src = (pp.ext === "") ? v : pp.dir;
            }
        }
        if ((v = args.values["js-src"])) conf.task.js.src = v;
        if ((v = args.values["dst-root"])) conf.dstRoot = v;
        if (args.values["query"]) conf.cssQuery = true;
        if (args.values["no-query"]) conf.cssQuery = false;
        if ((v = args.values["release"])) conf.release = v;

        return Conf.create(conf).object();
    } catch (err) {
        console.error(err);
    }

    return undefined;
}

/**
  * Site クラスのインスタンスを生成して conf.site にぶら下げる
  */
function createSite(conf) {
    const site = new Site(
        conf.siteStructureFile.base,
        conf.siteStructureFile.categories,
        conf.siteStructureFile.articles,
        conf.siteStructureFile.paths
    );
    conf.site = site;
}

/**
  * ビルドする
  */
async function build(conf) {
    await taskMakeDst(conf);
    await taskEjs(conf);
    await taskSass(conf);
    await taskJs(conf);
    await taskSitemap(conf);
    await taskCopy(conf);
}

const conf = await parseOptions();
if (conf) {
    createSite(conf);
    //Util.printObject(conf);
    //conf.site.printObject();
    await build(conf);
}
