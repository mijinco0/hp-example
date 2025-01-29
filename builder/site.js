/*
 * サイト構造とインターフェースの定義
 */

"use strict";

import fs from "node:fs";
import path from "path/posix";
import Util from "./util.js"

/**
 * サイト構造を保持するオブジェクトを構築するためのクラス
 */
export default class Site {
    // 公開したいメソッドを、クラスフィールドで指定したアロー関数から呼び出す
    // 参考: https://jsprimer.net/basic/class/#this-in-class-fields
    name = () => { return this.#name(); };
    categories = () => { return this.#categories(); };
    category = (catkey) => { return this.#category(catkey); };
    articles = (catkey) => { return this.#articles(catkey); };
    articleByKey = (catkey, artkey) => { return this.#articleByKey(catkey, artkey); };
    articleByPath = (htmlpath) => { return this.#articleByPath(htmlpath); };
    paths = (key = undefined) => { return this.#paths(key); };
    pathFromRoot = (catkey, artkey) => { return this.#pathFromRoot(catkey, artkey); };
    pathToRoot = (catkey, artkey) => { return this.#pathToRoot(catkey, artkey); };
    linkto = (catkey, artkey, id = undefined) => { return this.#linkto(catkey, artkey, id); };
    print = (obj = this.#site, indent = " ".repeat(4)) => { return this.#print(obj, indent); };

    #site = {};

    // CSV ファイルの列番号定義
    #colnoCat = Object.freeze({key: 0, name: 1, dirname: 2, index: 3});
    #colnoArt = Object.freeze({key: 0, category: 1, title: 2, release: 3, lastmod: 4, fname: 5, sitemap: 6});
    #colnoPath = Object.freeze({key: 0, path: 1});

    /**
     * コンストラクタ
     * @param {string} base_json - ベースとなる JSON ファイル
     * @param {string} cat_csv - カテゴリー一覧の CSV ファイル
     * @param {string} art_csv - 記事一覧の CSV ファイル
     * @param {string} path_csv - サイト内パスの CSV ファイル
     */
    constructor(base_json, cat_csv, art_csv, path_csv) {
        const json = fs.readFileSync(base_json, "utf8");
        this.#site = JSON.parse(json);
        this.#readCategories(cat_csv);
        this.#readArticles(art_csv);
        this.#readPaths(path_csv);
    }

    /**
     * サイト名を返す
     */
    #name() {
        return this.#site.name;
    }

    /**
     * すべてのカテゴリーのメタ情報を配列にして返す
     */
    #categories() {
        return Object.values(this.#site.categories).map((c) => c.meta);
    }

    /**
     * 指定されたカテゴリーのメタ情報を返す
     */
    #category(catkey) {
        return this.#site.categories[catkey].meta;
    }

    /**
     * 指定されたカテゴリーにあるすべての記事のメタ情報を配列にして返す
     */
    #articles(catkey) {
        const c = this.#site.categories[catkey];
        const arts = Object.values(c.articles);
        return  arts.map((a) => { a.category = c.meta; return a; });
    }

    /**
     * 「カテゴリーキー + 記事キー」で指定された記事のメタ情報を返す \
     * category プロパティにはその記事が属するカテゴリーのメタ情報を格納する \
     */
    #articleByKey(catkey, artkey) {
        const c = this.#site.categories[catkey];
        if (!c || !Object.prototype.hasOwnProperty.call(c, "articles")) return undefined;

        const a = c.articles[artkey];
        if (!a) return undefined;
        a.category = c.meta;

        return a;
    }

    /**
     * HTML ファイルのパスで指定された記事のメタ情報を返す
     */
    #articleByPath(htmlpath) {
        const pp = path.parse(htmlpath)
        const catkey = path.basename(pp.dir);
        const htmlname = pp.base;

        const c = this.#site.categories[catkey];
        if (!c || !Object.prototype.hasOwnProperty.call(c, "articles")) return undefined;

        const articles = Object.values(c.articles);
        const a = articles.find(({ fname }) => { return fname === htmlname });
        if (!a) return undefined;
        a.category = c.meta;

        return a;
    }

    /**
     * ルートから記事の HTML ファイルへのパスを返す
     */
    #pathFromRoot(catkey, artkey) {
        let ret = "/";
        const a = this.articleByKey(catkey, artkey);
        if (a) {
            ret = path.join(ret, a.category.dirname, a.fname);
        }
        return ret;
    }

    /**
     * 記事が属するカテゴリーのディレクトリからルートへのパスを返す \
     * カテゴリーが 1 階層しかない前提での簡易的な実装
     */
    #pathToRoot(catkey, artkey) {
        let ret = "";
        const a = this.articleByKey(catkey, artkey);
        if (a) {
            ret = "../";
        }
        return ret;
    }

    /**
     * アセット等へのパスを返す
     * @param {string} key
     */
    #paths(key = undefined) {
        const p = this.#site.paths
        return key ? p[key] : p;
    }

    /**
     * 他記事へのリンク情報 (タイトルと URL) を返す
     * @param {string} catkey - カテゴリー名 (キー文字列)
     * @param {string} artkey - 記事名 (キー文字列)
     * @param {string} id - ID 属性 (もしあれば)
     */
    #linkto(catkey, artkey, id = undefined) {
        const ret = { title: "", url: "" };
        const a = this.articleByKey(catkey, artkey);
        if (a) {
            ret.title = a.title;
            const toroot = this.pathToRoot(catkey, artkey);
            ret.url = Util.pathJoin(toroot, a.category.dirname, a.fname) + (id ? '#' + id : '');
        }
        return ret;
    }

    /**
     * this.#site 以下の指定されたオブジェクトを表示する (デバッグ用)
     */
    #print(obj = this.#site, indent = " ".repeat(4)) {
        Util.printObject(obj, indent);
    }

    /**
     * CSV ファイルからカテゴリーデータを読み出して this.#site に組み込む \
     * #readArticles() より先に呼ぶこと \
     */
    #readCategories(fcsv) {
        const csv = fs.readFileSync(fcsv, "utf8");

        const categories = [];
        for (const cat of Util.parseCsv(csv)) {
            const key = cat[this.#colnoCat.key];

            const meta = [
                ["key", key],    // 見出しの ID 属性等に利用する
                ["name", cat[this.#colnoCat.name]],
                ["dirname", cat[this.#colnoCat.dirname]],
                ["index", cat[this.#colnoCat.index].toLowerCase() !== "false"],
            ];

            const values = [
                ["meta", Object.fromEntries(meta)],
                ["articles", {}],
            ];
            const valobj = Object.fromEntries(values);

            categories.push([key, valobj]);
        }

        this.#site.categories = Object.fromEntries(categories);
    }

    /**
     * CSV ファイルから記事データを読み出して this.#site に組み込む \
     * #readCategories() の後に呼ぶこと \
     */
    #readArticles(fcsv) {
        const csv = fs.readFileSync(fcsv, "utf8");

        for (const art of Util.parseCsv(csv)) {
            const key = art[this.#colnoArt.key];
            const category = art[this.#colnoArt.category];
            const values = [
                ["key", key],
                ["title", art[this.#colnoArt.title]],
                ["category", art[this.#colnoArt.category]],
                ["release", art[this.#colnoArt.release]],
                ["lastmod", art[this.#colnoArt.lastmod]],
                ["fname", art[this.#colnoArt.fname]],
                ["sitemap", art[this.#colnoArt.sitemap].toLowerCase() !== "false"],
            ];
            const valobj = Object.fromEntries(values);
            this.#site.categories[category].articles[key] = valobj;
        }
    }

    /**
     * CSV ファイルからサイト内パス情報を読み出して this.#site に組み込む
     */
    #readPaths(fcsv) {
        const csv = fs.readFileSync(fcsv, "utf8");

        const paths = [];
        for (const p of Util.parseCsv(csv)) {
            const key = p[this.#colnoPath.key];
            const val = p[this.#colnoPath.path];
            paths.push([key, val]);
        }

        this.#site.paths = Object.fromEntries(paths);
    }
}
