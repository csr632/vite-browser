importScripts(
  "https://cdn.jsdelivr.net/npm/idb-keyval@3/dist/idb-keyval-iife.js"
);

const { Store, get, set } = idbKeyval;
console.log("{ Store, get, set }", { Store, get, set });

const channel = new BroadcastChannel("vite-browser-channel");
const store = new Store("vite-browser-idb-name", "files-v1");
function getFiles() {
  return get("files", store);
}
function setFiles(files) {
  return set("files", files, store);
}

(async () => {
  // init files if db is empty
  if (!(await getFiles())) {
    await setFiles({
      "/file1.js": `import App from "./file2.js";
const appEl = document.getElementById("app");
appEl.innerHTML = App();`,
      "/file2.js": `import Child from "./file3.js";
export default () => {
  return "<h1>App</h1>" + Child();
};`,
      "/file3.js": `export default () => {
  return "<p>Child</p>"
}`,
    });
  }
})();

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  clients.claim();
  console.log("V1 now ready to handle fetches!");
});

self.addEventListener("fetch", async (event) => {
  event.respondWith(
    (async () => {
      const url = new URL(event.request.url);
      const files = await getFiles();
      console.log("fetch ", url.pathname, event, files);
      if (url.origin === location.origin) {
        if (url.pathname === "/runner") {
          return new Response(
            `<!DOCTYPE html>
<div id="app">
<script type="module">
  import "./file1.js";
</script>`,
            {
              headers: {
                "Content-Type": "text/html",
              },
            }
          );
        }
        if (url.pathname === "/__vite_browser_files") {
          return new Response(JSON.stringify({ files }), {
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
        if (files[url.pathname]) {
          const file = files[url.pathname];
          return new Response(file, {
            headers: {
              "Content-Type": "application/javascript",
            },
          });
        }
        // fallback to network
        return fetch(event.request);
      }
    })()
  );
});

channel.addEventListener("message", async (event) => {
  switch (event.data.type) {
    case "requestFileChange":
      const newFiles = event.data.files;
      // TODO: add simple HMR
      await setFiles(newFiles);
      console.log("requestFileChange@@", newFiles);
      channel.postMessage({
        type: "onFilesChange",
        newFiles,
      });
      break;

    default:
      break;
  }
});
