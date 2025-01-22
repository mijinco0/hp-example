/*
 * EJS タスク
 */

"use strict";

import ejs from "ejs";
import { minify } from "html-minifier-terser";
import { promises as fs } from "node:fs";
import path from "path/posix";
import Util from "./util.js";

/**
 * パイプラインにかませるフィルタの定義
 */
const filters = {
    render: {    // EJS → HTML
        fn: async (text, data, options) => {
            return ejs.render(text, data, options);    // render() は同期的な関数のため await なし
        },
        data: undefined,
        options: undefined,
    },
    minify: {    // HTML 圧縮
        fn: async (text, release, options) => {
            return release ? minify(text, options) : text;
        },
        data: false,
        options: {
            collapseWhitespace: true,                         // true: タグ間の空白を削除
            ignoreCustomFragments: [/<pre[\s\S]*?\/pre>/],    // pre タグ内は処理しない
            includeAutoGeneratedTags: false,                  // true: 閉じタグに不備があったら補完する
            removeComments: true,                             // true: コメントを削除する
            removeTagWhitespace: false,                       // true にすると invalid な HTML になってしまうらしい
        },
    },
};

/**
 * EJS タスク
 */
async function taskEjs(conf) {
    const myconf = conf.task.ejs;
    const rd = new RenderData(conf);
    rd.init();

    const files = await Util.glob(myconf.patterns, myconf.src);
    for (const file of files) {
        rd.file(file);
        filters.render.data = {$: rd.data()};    // 各 EJS ファイル側から「$」で参照できるようにする
        filters.render.options = rd.options();
        filters.minify.data = conf.release;

        // EJS テンプレートファイルを読み込む
        let text = await fs.readFile(path.join(myconf.src, file), "utf8");

        // 読み込んだデータをパイプラインに流し込んで HTML 文字列を得る
        text = await Util.pipeline(text, filters);

        // カテゴリのディレクトリまで再帰的に作成し、そこに HTML ファイルを出力する
        let dst = path.join(myconf.dst, path.dirname(file));
        await fs.mkdir(dst, { recursive: true });
        dst = path.join(myconf.dst, Util.replaceExt(file, ".html"));
        await fs.writeFile(dst, text, "utf8");
    }
}

/**
 * EJS レンダリングに用いるデータを管理するクラス
 */
class RenderData {
    // 公開したいメソッドを、クラスフィールドで指定したアロー関数から呼び出す
    // 参考: https://jsprimer.net/basic/class/#this-in-class-fields
    data = () => { return this.#data(); };
    options = () => { return this.#options(); };
    init = async () => { await this.#init(); };
    file = async (fejs) => { await this.#file(fejs); };

    #conf = undefined;
    #dat = {};       // ejs.render() に渡すデータ
    #opt = {};    // ejs.render() に渡すオプション

    /**
     * コンストラクタ
     */
    constructor(conf) {
        this.#conf = conf;
    }

    /**
     * ejs.render() に渡すデータを返す
     */
    #data() {
        return this.#dat;
    }

    /**
     * ejs.render() に渡すオプションを返す
     */
    #options() {
        return this.#opt;
    }

    /**
     * this.#data を初期化する
     */
    #init() {
        const conf = this.#conf;
        if (!conf || !conf.site) return;
        this.#dat = {
            site: conf.site,
            newEntries: this.#makeNewEntries(),
            cssQuery: (conf.cssquery || conf.release) ? this.#makeCssQuery() : "",
            util: Util,
            path: {
                include: path.join(conf.task.ejs.inc, "/"),    // 末尾に「/」が付くことを保証する
            },

            // よく使う関数に別名をつける
            linkto: conf.site.linkto,
            join: Util.pathJoin,
            w3tojp: Util.w3dateToJpStyle,
        }
    }

    /**
     * this.#dat および this.#opt に個々の EJS ファイルから得られる情報を追加する
     */
    async #file(fejs) {
        const conf = this.#conf;
        const site = conf.site;
        if (!conf || !site) return;

        const dat = this.#dat;

        // HTML ファイルのルートディレクトリとの位置関係を求める
        const fhtml = Util.replaceExt(fejs, ".html");
        const a = site.articleByPath(fhtml);
        dat.article = a;
        dat.category = a ? a.category : undefined;
        dat.path.fromRoot = a ? site.pathFromRoot(a.category.key, a.key) : "/";
        dat.path.toRoot = a ? site.pathToRoot(a.category.key, a.key) : "";
        console.log(`${path.basename(fejs)}, fromRoot=${dat.path.fromRoot}, toRoot=${dat.path.toRoot}`);

        // render() に渡すオプションをセット
        this.#opt.filename = fejs;
    }

    /**
     * 新しめの記事一覧を作る
     * @param {number} n - 記事数の上限
     * @param {boolean} lmod - true とき、最終更新日でソートする
     */
    #makeNewEntries(n = 10, lmod = false) {
        const num = (art, lmod) => {
            const date = (lmod && art.lastmod !== "") ? art.lastmod : art.release;
            return Number(date.replaceAll("-", ""));
        };

        const site = this.#conf.site;
        if (!site) return undefined;

        const entries = [];
        for (const cat of site.categories()) {
            if (!cat.index) continue;
            for (const arts of site.articles(cat.key)) {
                entries.push(arts);
            }
        }
        entries.sort((a, b) => { return num(b, lmod) - num(a, lmod); });

        return entries.slice(0, n);
    }

    /**
     * CSS クエリ (現在日時とする) を返す
     */
    #makeCssQuery() {
        const d = new Date();
        return '?' + String(d.getFullYear()) +
               String(d.getMonth() + 1).padStart(2, '0') +
               String(d.getDate()).padStart(2, '0') +
               String(d.getHours()).padStart(2, '0') +
               String(d.getMinutes()).padStart(2, '0') +
               String(d.getSeconds()).padStart(2, '0');
    }
}

export default taskEjs;
