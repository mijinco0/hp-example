/*
 * XML サイトマップ生成タスク
 */

"use strict";

import path from "path/posix";
import { promises as fs } from "node:fs";

/**
 * XML サイトマップ生成タスク
 */
async function taskSitemap(conf) {
    const br = conf.task.sitemap.lineBreak;
    const depth = (br !== "") ? 1 : 0;    // 改行コードが "" でなければインデントも行なう

    let xml = "";
    xml += `<?xml version="1.0" encoding="UTF-8"?>${br}`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${br}`;

    for (const cat of conf.site.categories()) {
        for (const art of conf.site.articles(cat.key)) {
            if (!art.sitemap) continue;

            const urlbase = `https://${conf.site.name()}`;
            const urlpath = path.join(cat.dirname, art.fname);
            const url = new URL(urlpath, urlbase);
            const lastmod = (art.lastmod !== "") ? art.lastmod : art.release;

            xml += `${indent(depth * 1)}<url>${br}`;
            xml += `${indent(depth * 2)}<loc>${url.toString()}</loc>${br}`;
            xml += `${indent(depth * 2)}<lastmod>${lastmod}</lastmod>${br}`;
            xml += `${indent(depth * 1)}</url>${br}`;
        }
    }

    xml += `</urlset>${br}`;

    await fs.writeFile(conf.task.sitemap.dst, xml, "utf8");
}

/**
 * (depth * 4) 個の空白文字を返す
 */
function indent(depth) {
    return " ".repeat(depth * 4);
}

export default taskSitemap;
