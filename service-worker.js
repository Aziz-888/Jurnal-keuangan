// v3 — memaksa bypass cache HTTP browser (bukan cuma cache Service Worker) saat mengambil
// app shell, supaya versi terbaru selalu diambil begitu ada sinyal internet. Nama cache juga
// dinaikkan supaya seluruh cache lama otomatis dibuang saat versi ini terpasang.
const CACHE = 'jurnal-keuangan-v3';
const SHELL = ['./jurnal-keuangan.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Hanya file aplikasi milik sendiri yang boleh ditangani. Semua permintaan ke luar
  // (terutama server Apps Script) langsung ke jaringan, tanpa cache sama sekali.
  if (url.origin !== self.location.origin) return;
  // 'reload' memaksa browser mengambil ulang dari server (bypass HTTP cache), bukan cuma
  // revalidasi — supaya perubahan file (termasuk perbaikan keamanan) selalu langsung kepakai.
  e.respondWith(
    fetch(e.request, { cache: 'reload' })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
