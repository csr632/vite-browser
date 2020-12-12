console.log("sw run11");

self.addEventListener("install", (event) => {
  console.log("V1 installing…");
  // cache a cat jpg
  event.waitUntil(
    caches.open("static-v1").then((cache) => cache.add("/cat.jpg"))
  );
});

self.addEventListener("activate", (event) => {
  console.log("V1 now ready to handle fetches!");
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  console.log("fetch url3 ", url);

  // serve the cat jpg from the cache if the request is
  // same-origin and the path is '/dog.jpg'
  if (url.origin == location.origin && url.pathname == "/dog.jpg") {
    event.respondWith(fetch("/cat.jpg"));
  }
});
