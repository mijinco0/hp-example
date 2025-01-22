# An example for creating a simple webpage using EJS and Sass.

## 概要

- EJS と Sass を使ってシンプルなウェブページを生成するためのサンプルです。
- レスポンシブにも一応対応していると思います。
- Sass の設計手法として FLOCSS を (ゆるく) 取り入れています。
- HTML のうち、使い回しが効きそうな部分は部品化して本体にインクルードするようにしました。
- コンパイルすると public/ ディレクトリの下に HTML ファイルと css/style.css が生成されます。
- リセット CSS は [A modern CSS reset](https://github.com/Andy-set-studio/modern-css-reset/) を使わせていただいています。
- 数年前に仕入れた知識で作成したため、2025 年現在では陳腐化しているかもしれません。

## 開発環境

### バージョン

- Node.js 18.16.1
- css-mqpacker 7.0.0
- gulp-ejs 5.1.0
- gulp-line-ending-corrector 1.0.3
- gulp-postcss 9.0.1
- gulp-rename 2.0.0
- gulp-sass-glob 1.1.0
- gulp-sass 5.1.0
- gulp-data 1.3.1
- gulp 4.0.2
- postcss 8.4.27
- sass 1.64.2
- fs 0.0.1-security

### インストール方法

FreeBSD でのインストール方法を記しますが、その他の OS でもほとんど同じだと思います。

1. Node.js と NPM を packages でインストールする。
   ```
   # pkg install -y node npm
   ```
2. リポジトリを fork して clone する。
   ```
   % git clone git@github.com:someone/hp-example.git ~/somewhere/hp-example
   ```
3. clone 先のディレクトリに移動して Node.js のパッケージをインストールする。
   ```
   % cd ~/somewhere/hp-example/
   % npm ci
   % npm ls --depth=0
   hp-example@1.0.0 ~/somewhere/hp-example
   ├── css-mqpacker@7.0.0
   ├── fs@0.0.1-security
   ├── gulp-data@1.3.1
   ├── gulp-ejs@5.1.0
   ├── gulp-line-ending-corrector@1.0.3
   ├── gulp-postcss@9.0.1
   ├── gulp-rename@2.0.0
   ├── gulp-sass-glob@1.1.0
   ├── gulp-sass@5.1.0
   ├── gulp@4.0.2
   ├── postcss@8.4.27
   └── sass@1.64.2
   ```

## コンパイル方法

```
% cd ~/somewhere/hp-example/
% npx gulp
```
