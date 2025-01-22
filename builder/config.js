"use strict";

import path from "path/posix";
import Util from "./util.js";

export default class Config {
    // 公開したいメソッドを、クラスフィールドで指定したアロー関数から呼び出す
    // 参考: https://jsprimer.net/basic/class/#this-in-class-fields
    object = () => { return this.#object(); };

    #conf = undefined;

    /**
     * コンストラクタ
     */
    constructor(conf) {
        this.#conf = conf;
    }

    /**
     * コンフィグレーションを this.#conf が期待する形に加工してコンストラクタを呼ぶ \
     * 必要ならコンフィグレーションのチェック (ソースファイルの存在確認など) もここで行う \
     * ※ クラスの静的メソッドにおける this はそのクラス自身 (ここでは Config) を参照する \
     * 参考: https://jsprimer.net/basic/class/#static-method
     * @returns {object} this
     */
    static create(conf) {
        this.#joinRoot(conf);
        return new Config(conf);
    }

    /**
     * this.#conf を返す
     */
    #object() {
        return this.#conf;
    }

    /**
     * 各パスを srcRoot や dstRoot からのパスに書き換える \
     * - *Root に書かれた $HOME や $CWD は、それぞれ process.env.HOME、process.cwd() に展開する \
     * - JavaScript では、オブジェクトは参照渡しとなるので、conf の各パスが更新される \
     * @param {object} conf
     */
    static #joinRoot(conf) {
        conf.srcRoot = Util.pathExpand(conf.srcRoot);
        conf.dstRoot = Util.pathExpand(conf.dstRoot);

        const o = conf.siteStructureFile;
        o.base = path.join(conf.srcRoot, o.base);
        o.category = path.join(conf.srcRoot, o.category);
        o.article = path.join(conf.srcRoot, o.article);

        for (const o of Object.values(conf.task)) {
            if (Array.isArray(o)) continue;
            if (Object.prototype.hasOwnProperty.call(o, "src")) o.src = path.join(conf.srcRoot, o.src);
            if (Object.prototype.hasOwnProperty.call(o, "inc")) o.inc = path.join(conf.srcRoot, o.inc);
            if (Object.prototype.hasOwnProperty.call(o, "dst")) o.dst = path.join(conf.dstRoot, o.dst);
        }

        for (const o of conf.task.copy) {
            o.from = path.join(conf.srcRoot, o.from);
            o.to = path.join(conf.dstRoot, o.to);
        }
    }
}
