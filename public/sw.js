const CACHE='minha-rotina-shell-v4';
const SHELL=['/','/icon.svg','/brand-logo.svg','/brand-logo-light.svg','/app-icon.svg','/icon-192.png','/icon-512.png','/manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('minha-rotina-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{const open=clients.find(client=>new URL(client.url).origin===self.location.origin);if(open)return open.focus();return self.clients.openWindow(e.notification.data?.url||'/');}));});
// Cache apenas dos arquivos do aplicativo, nunca da sessão ou dos dados da conta.
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin||url.search)return;if(!SHELL.includes(url.pathname)&&!url.pathname.startsWith('/assets/'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return r;}).catch(async()=>await caches.match(e.request)||Response.error()));});
