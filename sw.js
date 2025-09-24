/**
 * Service Worker para Webapp de Gastos
 * Proporciona funcionalidad offline y caching
 */

const CACHE_NAME = 'gestor-gastos-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Archivos que se cachearán al instalar
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/debug.js',
    '/js/database.js',
    '/js/auth.js',
    '/js/projects.js',
    '/js/app.js',
    '/manifest.json',
    // CDN assets críticos
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css'
];

// Archivos que nunca se cachearán
const NEVER_CACHE = [
    '/sw.js',
    '/debug.json'
];

// URLs de API que requieren estrategia especial
const API_URLS = [
    '/tables/'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker');
    
    event.waitUntil(
        Promise.all([
            // Cache de archivos estáticos
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES.filter(url => !url.startsWith('http')));
            }),
            
            // Cache de CDN files
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching CDN files');
                const cdnFiles = STATIC_FILES.filter(url => url.startsWith('http'));
                return Promise.allSettled(
                    cdnFiles.map(url => 
                        fetch(url).then(response => {
                            if (response.ok) {
                                return cache.put(url, response);
                            }
                        }).catch(err => console.warn('[SW] Failed to cache CDN file:', url, err))
                    )
                );
            })
        ]).then(() => {
            console.log('[SW] Installation complete');
            // Activar inmediatamente
            return self.skipWaiting();
        })
    );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker');
    
    event.waitUntil(
        Promise.all([
            // Limpiar caches antiguos
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Tomar control de todas las páginas inmediatamente
            self.clients.claim()
        ]).then(() => {
            console.log('[SW] Activation complete');
        })
    );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar peticiones que no son GET o que están en la lista de nunca cachear
    if (request.method !== 'GET' || NEVER_CACHE.some(path => url.pathname.includes(path))) {
        return;
    }
    
    // Estrategia para diferentes tipos de recursos
    if (isApiRequest(url)) {
        // API requests: Network First con fallback a cache
        event.respondWith(networkFirstStrategy(request));
    } else if (isStaticResource(url)) {
        // Recursos estáticos: Cache First
        event.respondWith(cacheFirstStrategy(request));
    } else {
        // Páginas: Stale While Revalidate
        event.respondWith(staleWhileRevalidateStrategy(request));
    }
});

// Verificar si es una petición a la API
function isApiRequest(url) {
    return API_URLS.some(apiPath => url.pathname.includes(apiPath));
}

// Verificar si es un recurso estático
function isStaticResource(url) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'];
    return staticExtensions.some(ext => url.pathname.includes(ext)) || 
           url.hostname !== self.location.hostname; // CDN resources
}

// Estrategia Network First (para APIs)
async function networkFirstStrategy(request) {
    try {
        console.log('[SW] Network first:', request.url);
        
        // Intentar network primero
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cachear respuesta exitosa
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
        
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        
        // Fallback a cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Si no hay cache, devolver respuesta de error
        return new Response(
            JSON.stringify({
                error: 'Sin conexión',
                message: 'No se puede conectar al servidor y no hay datos en cache'
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Estrategia Cache First (para recursos estáticos)
async function cacheFirstStrategy(request) {
    console.log('[SW] Cache first:', request.url);
    
    // Intentar cache primero
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Si no está en cache, hacer network request
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cachear para futuras peticiones
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.warn('[SW] Cache first failed for:', request.url);
        
        // Para recursos críticos, devolver fallback
        if (request.url.includes('.css')) {
            return new Response('/* Offline fallback styles */', {
                headers: { 'Content-Type': 'text/css' }
            });
        } else if (request.url.includes('.js')) {
            return new Response('console.log("Offline fallback script");', {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }
        
        throw error;
    }
}

// Estrategia Stale While Revalidate (para páginas)
async function staleWhileRevalidateStrategy(request) {
    console.log('[SW] Stale while revalidate:', request.url);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Hacer network request en background
    const networkPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(error => {
        console.warn('[SW] Stale while revalidate network failed:', error);
    });
    
    // Devolver cache inmediatamente si existe, sino esperar network
    return cachedResponse || networkPromise;
}

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'GET_CACHE_STATUS':
                getCacheStatus().then(status => {
                    event.ports[0].postMessage(status);
                });
                break;
                
            case 'CLEAR_CACHE':
                clearAllCaches().then(() => {
                    event.ports[0].postMessage({ success: true });
                });
                break;
                
            default:
                console.log('[SW] Unknown message type:', event.data.type);
        }
    }
});

// Obtener estado del cache
async function getCacheStatus() {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        status[cacheName] = keys.length;
    }
    
    return status;
}

// Limpiar todos los caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
}

// Manejar actualizaciones
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Aquí podrías sincronizar datos offline
            syncOfflineData()
        );
    }
});

async function syncOfflineData() {
    console.log('[SW] Syncing offline data');
    
    try {
        // Obtener datos offline del IndexedDB si los hay
        // Enviar al servidor cuando haya conexión
        // Por ahora solo logging
        
        console.log('[SW] Offline data sync complete');
        
    } catch (error) {
        console.error('[SW] Offline sync failed:', error);
    }
}

console.log('[SW] Service Worker loaded');