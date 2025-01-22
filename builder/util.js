/*
 * ユーティリティ的な静的関数をまとめたクラス
 *
 * ※ クラスの静的メソッドにおける this は、そのクラス自身を参照する。
 * 参考: https://jsprimer.net/basic/class/#static-method
 */

"use strict";

import path from "path/posix";
import { openSync, closeSync, opendirSync } from "node:fs";
import { glob } from "glob";

export default class Util {
    /**
     * POSIX 形式のパスを返す
     */
    static posixPath(p) {
        return p.replaceAll("\\", "/");
    }

    /**
     * パスの連結
     */
    static pathJoin(...paths) {
        const sep = "/";
        let joined = "";
        for (const p of paths) {
            joined = `${joined}${(joined !== "" && !joined.endsWith(sep)) ? sep : ""}${p}`;
        }
        return joined;
    }

    /**
     * パスの解析 \
     * 先頭に "$HOME" または "$CWD" が含まれていたらそれぞれ process.env.HOME、process.cwd() に置換する
     */
    static pathExpand(p) {
        p = p.replace("$HOME", process.env.HOME);
        p = p.replace("$CWD", process.cwd());
        p = this.posixPath(p);
        return p;
    }

    /**
     * ファイルの存在確認 \
     * fs.stat() や fs.access() は使用せず、直接 fs.open() してエラーハンドリングせよとのこと \
     * https://nodejs.org/api/fs.html#fsaccesspath-mode-callback \
     * @param {string} p - 対象パス。末尾に "/" がついていたらディレクトリと見なす
     * @returns {boolean}
     */
    static pathExists(p) {
        // openSync() に存在するディレクトリを指定すると、true が返る。
        // なのでもしかすると、ディレクトリとファイルで場合分けせずとも
        // openSync() だけで行けるかもしれない。
        // でもプラットフォーム依存とかがあるかもしれない。
        if (p.endsWith("/")) {
            // ディレクトリの場合
            try {
                const dir = opendirSync(p);
                dir.closeSync();
            } catch {
                return false;
            }
        } else {
            // ファイルの場合
            try {
                const fd = openSync(p, 'r');
                if (fd) closeSync(fd);
            } catch {
                return false;
            }
        }

        return true;
    }

    /**
     * W3 Datetime 形式の日付 "YYYY-MM-DD" を "YYYY年MM月DD日" に変換する
     */
    static w3dateToJpStyle(w3date, prefix = "", suffix = "") {
        const date = w3date.split('-');
        if (date.length < 3) return "";
        const result = `${date[0]}年${Number(date[1])}月${Number(date[2])}日`;
        return `${prefix}${result}${suffix}`;
    }

    /**
     * file の拡張子を to に置換する
     */
    static replaceExt(file, to) {
        return this.posixPath(path.format({ ...path.parse(file), ext: to, base: undefined }).toString());
    }

    /**
     * npm の glob.glob() の拡張版 \
     * 拾うパターンと無視するパターンをまとめて配列で渡せる \
     * @param {string[]} patterns - パターンの配列。無視するパターンには先頭に "!" をつける
     * @param {string} cwd - グロブの起点となるディレクトリへのパス
     * @returns {string[]} files - グロブの結果 (パスの区切りは POSIX)
     */
    static async glob(patterns, cwd) {
        const pass = [];
        const option = {
            cwd: this.posixPath(cwd),    // npm の glob は POSIX 形式じゃないと受け付けてくれないらしい
            ignore: [],
        };

        for (const p of patterns) {
            if (p.startsWith("!")) {
                option.ignore.push(p.replace("!", ""));
            } else {
                pass.push(p);
            }
        }

        const files = await glob(pass, option);
        return files.map(val => this.posixPath(val));
    }

    /**
     * CSV 文字列を解析する \
     * - "#" で始まる行と空行は無視する \
     * - フィールドの値を囲むダブルクォーテーションは削除する \
     * - フィールドの値の前後の空白は削除する \
     * @param {string} text - CSV 文字列
     * @returns {string[string[]]} records
     */
    static parseCsv(text) {
        const br = text.includes("\r\n") ? "\r\n" : "\n";
        const lines = text.split(br);
        const records = [];

        for (const line of lines) {
            if (line.startsWith("#") || line === "") continue;
            const fields = line.split(",");
            records.push(fields.map((f) => f.trim().replaceAll("\"", "")));
        }

        return records;
    }

    /**
     * テキストを加工して返す
     * @param {string} text - 加工前のテキスト
     * @param {object} filters - Filter 型の連想配列
     * @returns {string} - 加工後のテキスト
     *
     * @typedef Filter
     * @property {function} fn - 加工処理が書かれた関数
     * @property {*} data - fn() に渡すユーザーデータ
     * @property {*} options - fn() から呼び出す API に渡すオプション
     */
    static async pipeline(text, filters = {}) {
        for (const f of Object.values(filters)) {
            text = await f.fn(text, f.data, f.options);
        }
        return text;
    }

    /**
     * 指定されたオブジェクトを表示する
     */
    static printObject(obj, indent = " ".repeat(4)) {
        console.log(JSON.stringify(obj, null, indent));
    }
}
