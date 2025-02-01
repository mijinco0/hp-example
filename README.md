# An example for creating a simple website using EJS and Sass.

## 概要

- EJS と Sass を使って簡素なウェブサイトを生成するためのサンプルです。
- 外観は[作者のサイト](https://retrotecture.jp)のようなイメージになります。
- レスポンシブにも一応対応していると思います。
- Sass の設計手法として [FLOCSS](https://github.com/hiloki/flocss) を (ゆるく) 取り入れています。
- HTML のうち、使い回しが効きそうな部分は部品化して本体にインクルードするようにしました。
- リセット CSS は [A modern CSS reset](https://github.com/Andy-set-studio/modern-css-reset/) を使わせていただいています。
- 数年前に仕入れた知識で作成したため、2025 年現在では陳腐化しているかもしれません。
- バージョン 0.6 にて脱 Gulp を行い、自作のタスクランナーもどきでビルドするようにしました。ソースコードは builder ディレクトリにあります。

## ソースと生成物について

- ↓のような構造を持つソースディレクトリから、
  ```
  src/
      ejs/
          category1/
              article1.ejs
              article2.ejs
              ...
          category2/
              article1.ejs
              article2.ejs
              ...
          ...
          _parts/
          index.ejs
      assets/
      sass/ (構造は FLOCSS にしたがう)
  ```
  ↓のような構造をもつサイトを生成します。
  ```
  /
      category1/
          article1.html
          article2.html
          ...
      category2/
          article1.html
          article2.html
          ...
      ...
      assets/
      css/
      index.html
      sitemap.xml
  ```
- 入力元・出力先のディレクトリは、config.json である程度変更可能です。
- config.json の srcRoot や dstRoot では次の組込み的な変数が使えます (あまり真面目に解析していませんが)。
  - <code>$HOME</code>: 環境変数 <code>HOME</code> で指定したディレクトリに展開される
  - <code>$CWD</code>: スクリプトを実行したディレクトリに展開される
- カテゴリーを新たに追加するには src/site/category.csv へ行を追加します。
- 記事を新たに追加するには src/site/article.csv へ行を追加します。

## 開発環境

依存するパッケージと動作確認したバージョンは次のとおりです。

- Node.js 22.12.0
- npm 11.0.0
- cssnano 7.0.6
- ejs 3.1.10
- fs 0.0.1-security
- fs-extra 11.3.0
- glob 11.0.1
- html-minifier-terser 7.2.0
- postcss 8.5.1
- postcss-sort-media-queries 5.2.0
- sass 1.83.4
- terser 5.37.0

## 開発環境の構築手順

1. Node.js と npm をインストールする。<br>
   Volta や fnm といったバージョン管理ツールを使うと Node.js のバージョンを固定でき、トラブルが少なくて済むかもしれません。
2. リポジトリを clone する。
   ```
   % git clone https://github.com/mijinco0/hp-example.git ~/somewhere/hp-example
   ```
3. clone 先のディレクトリに移動して Node.js のパッケージをインストールする。
   ```
   % cd ~/somewhere/hp-example/
   % npm ci
   % npm ls --depth=0
   hp-example@1.0.0 ~/somewhere/hp-example
   +-- cssnano@7.0.6
   +-- ejs@3.1.10
   +-- fs-extra@11.3.0
   +-- fs@0.0.1-security
   +-- glob@11.0.1
   +-- html-minifier-terser@7.2.0
   +-- postcss-sort-media-queries@5.2.0
   +-- postcss@8.5.1
   +-- sass@1.83.4
   `-- terser@5.37.0
   ```

## ビルド方法

- デバッグビルド
  ```
  % npm run build
  ```
  - 生成物の出力先: プロジェクトディレクトリ直下の public.d/
  - HTML / CSS / JS 圧縮: なし
  - CSS クエリ: 付加しない
- リリースビルド
  ```
  % npm run build.rel
  ```
  - 生成物の出力先: プロジェクトディレクトリ直下の public/
  - HTML / CSS / JS 圧縮: あり
  - CSS クエリ: 付加する (ビルド日時をもとに生成)


## 残課題

- Sass の @import を @use に変更<br>
  参考: https://sass-lang.com/documentation/at-rules/import/
