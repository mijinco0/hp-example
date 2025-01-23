import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
    pluginJs.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            "no-use-before-define": [    // 巻き上げ (ホイスティング) の許可/禁止
                "error", {
                    "functions": false,
                    "classes": false,
                    "variables": true,
                    "allowNamedExports": false,    // true: エクスポート宣言をこのルールの対象外とする
                },
            ],
            "no-var": "error",                     // var の使用を禁止
            "prefer-const": "error",               // const を優先
            "eqeqeq": "error",                     // 厳密等価演算子（===）を強制
            "no-unused-vars": "warn",              // 未使用変数の警告
            "no-console": "warn",                  // console.log を警告
        },
    },
];
