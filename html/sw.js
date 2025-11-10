// importScripts('/cache-polyfill.js');
importScripts('cache-polyfill.js');


self.addEventListener('install', function(e) {
 e.waitUntil(
   caches.open('airhorner').then(function(cache) {
     return cache.addAll([
       '/',
       '/index.html',
       '/panel_super/index.html',
       '/panel_super/liquidar.html',
       '/panel_super/liquidar.html',
       '/panel_users/index.html',
       '/panel_root/index.html',
       '/panel_admin/index.html',
     ]);
   })
 );
});