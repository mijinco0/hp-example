/*
 * ユーティリティ的な静的関数をまとめたクラス
 *
 * ※ クラスの静的メソッドにおける this は、そのクラス自身を参照する。
 * 参考: https://jsprimer.net/basic/class/#static-method
 */

"use strict";

//import { openSync, closeSync, opendirSync } from "node:fs";
const fs = require("node:fs");
const path = require("path/posix");

module.exports = class Util {
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
                const dir = fs.opendirSync(p);
                dir.closeSync();
            } catch {
                return false;
            }
        } else {
            // ファイルの場合
            try {
                const fd = fs.openSync(p, 'r');
                if (fd) fs.closeSync(fd);
            } catch {
                return false;
            }
        }

        return true;
    }

    /**
     * file の拡張子を to に置換する
     */
    static replaceExt(file, to) {
        return this.posixPath(path.format({ ...path.parse(file), ext: to, base: undefined }).toString());
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
     * 指定されたオブジェクトを表示する
     */
    static printObject(obj, indent = " ".repeat(4)) {
        console.log(JSON.stringify(obj, null, indent));
    }
}
