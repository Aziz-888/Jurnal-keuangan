// v2 — perbaikan: permintaan ke server data (Google Apps Script) TIDAK PERNAH di-cache.
// Versi lama menyimpan jawaban server di cache sehingga aplikasi bisa menerima data lama.
const CACHE = 'jurnal-keuangan-v2';
const SHELL = ['./jurnal-keuangan.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Hanya file aplikasi milik sendiri yang boleh ditangani. Semua permintaan ke luar
  // (terutama server Apps Script) langsung ke jaringan, tanpa cache.
  if (url.origin !== self.location.origin) return;
  // Jaringan lebih dulu (selalu ambil versi terbaru); cache hanya cadangan saat tidak ada sinyal.
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
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
