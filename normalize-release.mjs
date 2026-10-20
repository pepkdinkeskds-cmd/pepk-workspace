// Apply the same release identifier to every browser module edge and HTML entry.
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../website');
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await walk(file); continue; }
    if (!/\.(js|html)$/.test(file)) continue;
    let text = await fs.readFile(file, 'utf8');
    if (file.endsWith('.js')) {
      text = text.replace(/(["'])(\.{1,2}\/[^"'\s]+\.js)(?:\?v=[^"']+)?\1/g, '$1$2?v=0.9.7-rc2$1');
      text = text.replaceAll('applyMetadata(data.settings);', 'applyMetadata(data.settings, data);');
      text = text.replaceAll('setContentReady();', 'setContentReady(data);');
    } else {
      text = text.replace(/\?v=0\.9\.6-rc1/g, '?v=0.9.7-rc2');
      text = text.replaceAll('0.9.6 RC1', '0.9.7 RC2');
      text = text.replace(/Data diperbarui <span data-updated>[^<]*<\/span>/g, 'Sumber terakhir dibaca <span data-updated>Belum tersinkron</span>');
      text = text.replace(/data-state="ready">Siap digunakan/g, 'data-state="loading">Memuat katalog…');
      text = text.replace(/(<strong data-resource-(?:visible-)?count[^>]*>)0/g, '$1…');
      text = text.replace('>0 materi</strong>', '>Memuat materi…</strong>');
      text = text.replace(/(<strong data-summary-[^>]+>)[^<]+/g, '$1…');
      if (!text.includes('src="js/boot.js?')) text = text.replace('<script defer src="js/mobile-nav.js?v=0.9.7-rc2"></script>', '<script defer src="js/mobile-nav.js?v=0.9.7-rc2"></script>\n  <script defer src="js/boot.js?v=0.9.7-rc2"></script>');
      if (!text.includes('<noscript>')) text = text.replace('</main>', '  <noscript><p class="container source-note">Aktifkan JavaScript untuk memuat katalog dan pencarian. Tautan navigasi tetap tersedia.</p></noscript>\n</main>');
    }
    await fs.writeFile(file, text);
  }
}
await walk(root);
