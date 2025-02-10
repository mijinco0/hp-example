"use strict";

/*
 * CSV 文字列をレコードまたはレコードの配列にして返すクラス
 *
 * - 複数行にわたる CSV はレコードの配列 (string[][]) にして返す
 * - 1 行の CSV はレコード (string[]) にして返す
 * - フィールドの前後の空白は除去する
 * - 空行と「#」で始まる行は無視する
 * - 行の末尾が「,」だった場合は、返却するレコードの末尾に空のフィールド ('') を追加する
 * - 「,」が連続して現れた場合は、返却するレコードの当該位置に空のフィールド ('') を挿入する
 * - フィールドは「"」で囲まれていてもよい
 * - フィールドが「"」で囲まれてた場合、フィールドを囲んでいる「"」は除去する
 * - 同 その中に現れる「,」は普通の文字として扱う
 * - 同 「"」が連続して現れた場合は「"」のエスケープとして扱う
 */
export default class Csv {
    /**
     * CSV 文字列をレコードまたはレコードの配列にして返す
     */
    static parse(text) {
        const br = text.includes("\r\n") ? "\r\n" : "\n";
        const lines = text.split(br);
        const records = [];

        for (const line of lines) {
            const fields = this.#parseline(line);
            if (fields) {
                records.push(fields);
            }
        }

        return (records.length > 1) ? records : records.flat();
    }

    /**
     * 1 行分の CSV をレコードにして返す
     */
    static #parseline(line) {
        line = line.trim();
        if (line === "" || line.startsWith("#")) return undefined;

        line += "\n";

        const parser = new CsvParser;
        parser.init();

        for (const ch of line) {
            parser.input(ch);
        }

        return parser.fields();
    }
}

/*
 * CSV パーサ
 */
class CsvParser {
    // 公開したいメソッドを、クラスフィールドで指定したアロー関数から呼び出す
    // 参考: https://jsprimer.net/basic/class/#this-in-class-fields
    init = () => { return this.#init(); };
    input = (ch) => { return this.#input(ch); };
    fields = () => { return this.#fields.map((f) => f.trim()); };

    // 特別待遇な文字の定義
    #ch = Object.freeze({comma: ",", dq: "\"", eos: "\n"});

    // イベントの定義
    #ev = Object.freeze({comma: "comma", dq: "dq", eos: "eos", others: "others"});

    #state = undefined;     // 現在の状態を保持する
    #fields = undefined;    // フィールドを格納する配列

    // フィールド文字列の作成を支援するオブジェクト
    // - string: 作成中のフィールド文字列を保持する
    // - init(): string を初期化する
    // - append(): 指定された文字を string に追加する
    // - fix(): string を fields[] に追加する
    #field = {
        string: "",
        init: () => { this.#field.string = ""; },
        append: (ch) => { this.#field.string += ch; },
        fix: () => { this.#fields.push(this.#field.string), this.#field.init(); },
    };

    // 状態の定義
    #states = {
        normal: {    // 通常状態
            key: "normal",
            entry: (ch) => { this.#field.init(); },
            do: (ch) => { (ch === this.#ch.comma) ? this.#field.fix() : this.#field.append(ch); },
            exit: (ch) => {},
        },
        indq: {    // ダブルクォート内を処理中
            key: "indq",
            entry: (ch) => {},
            do: (ch) => { this.#field.append(ch); },
            exit: (ch) => {},
        },
        escape: {    // エスケープの有無を見極め中
            key: "escape",
            entry: (ch) => {},
            do: (ch) => {},
            exit: (ch) => { (ch === this.#ch.comma) ? this.#field.fix() : this.#field.append(ch); },
        },
    };

    // 状態遷移表
    #table = {
        normal: {
            comma: this.#states.normal,
            dq: this.#states.indq,
            eos: undefined,
            others: this.#states.normal,
        },
        indq: {
            comma: this.#states.indq,
            dq: this.#states.escape,
            eos: undefined,
            others: this.#states.indq,
        },
        escape: {
            comma: this.#states.normal,
            dq: this.#states.indq,
            eos: undefined,
            others: this.#states.normal,
        },
    };

    /**
     * ステートマシンの初期化
     */
    #init() {
        this.#state = this.#states.normal;
        this.#state.entry();
        this.#fields = [];
    }

    /**
     * ステートマシンに 1 文字入力する
     * @param {string} - ch: 入力文字
     * @returns {boolean} - true: 終了状態になった, false: 終了状態になっていない
     */
    #input(ch) {
        if (ch === "\r") ch = this.#ch.eos;

        const next = this.#table[this.#state.key][this.#event(ch)];
        if (next !== this.#state) {
            this.#state.exit(ch);
            if (!next) {
                this.#fin();
                return true;
            }
            this.#state = next;
            this.#state.entry(ch);
        } else {
            this.#state.do(ch);
        }

        return false;
    }

    /**
     * 入力された文字をイベントに変換する
     */
    #event(ch) {
        if (ch === this.#ch.comma) return this.#ev.comma;
        if (ch === this.#ch.dq) return this.#ev.dq;
        if (ch === this.#ch.eos) return this.#ev.eos;
        return this.#ev.others;
    }

    /**
     * ステートマシンの終了処理
     */
    #fin() {
        this.#field.fix();
    }
}

/*
// テスト
(function() {
    // テストケースの定義

    const caseSingleLine = [
        {
            input: 'hello',
            expect: [ 'hello' ],
        },
        {
            input: 'hello, "world"',
            expect: [ 'hello', 'world' ],
        },
        {
            input: 'hello, world,',
            expect: [ 'hello', 'world', '' ],
        },
        {
            input: 'hello,, world',
            expect: [ 'hello', '', 'world' ],
        },
        {
            input: 'hello, , world',
            expect: [ 'hello', '', 'world' ],
        },
        {
            input: 'hell,o, "w,orld"',
            expect: [ 'hell', 'o', 'w,orld' ],
        },
        {
            input: '"say ""hello, world!"" to the world."',
            expect: [ 'say "hello, world!" to the world.' ],
        },
        {
            input: 'ハロ～, ワ～ルド',
            expect: [ 'ハロ～', 'ワ～ルド' ],
        },
    ];

    const caseMultiLine = {
        input: "",
        expect: []
    };

    for (const c of caseSingleLine) {
        caseMultiLine.input += (c.input + "\n");
        caseMultiLine.expect.push(c.expect);
    }

    // 配列の比較関数
    const areEqual = (arr1, arr2) => {
        return JSON.stringify(arr1) === JSON.stringify(arr2);
    };

    // テスト実行

    for (const c of caseSingleLine) {
        const output = Csv.parse(c.input);
        console.assert(areEqual(output, c.expect), `${c.input}`);
    }

    const output = Csv.parse(caseMultiLine.input);
    console.assert(areEqual(output, caseMultiLine.expect), `${caseMultiLine.input}`);
})();
*/
