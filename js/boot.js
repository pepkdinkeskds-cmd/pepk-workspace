// A small independent recovery message if a page module cannot finish loading.
(() => {
  const timer = setTimeout(() => {
    if (document.documentElement.dataset.pageReady === 'true') return;
    const box = document.createElement('div');
    box.className = 'page-recovery container';
    box.setAttribute('role', 'alert');
    const text = document.createElement('p');
    text.textContent = 'Katalog belum selesai dimuat. Periksa koneksi lalu muat ulang halaman.';
    const button = document.createElement('button');
    button.className = 'button button--secondary';
    button.type = 'button';
    button.textContent = 'Muat ulang';
    button.addEventListener('click', () => window.location.reload());
    box.append(text, button);
    document.querySelector('main')?.prepend(box);
  }, 12000);
  document.addEventListener('pepk:ready', () => {
    clearTimeout(timer);
    document.querySelector('.page-recovery')?.remove();
  }, { once: true });
})();
