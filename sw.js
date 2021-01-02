// simple indexDB key-value store
importScripts(
  "https://cdn.jsdelivr.net/npm/idb-keyval@3/dist/idb-keyval-iife.js"
);
const { Store, get, set, keys } = idbKeyval;

const channel = new BroadcastChannel("vite-browser-channel");
const store = new Store("vite-browser-idb-name", "files-v2");

async function getFile(fileName) {
  return get(fileName, store);
}
async function getFiles() {
  const fileNames = await keys();
  const filesArr = Promise.all(fileNames.map(getFile));
  return fileNames.reduce((acc, cur, idx) => {
    acc[cur] = filesArr[idx];
    return acc;
  }, {});
}

async function setFile(fileName, content) {
  await set(fileName, content, store);
  return;
}

async function setFiles(files) {
  await Promise.all(Object.entries(files).map(([n, c]) => setFile(n, c)));
  return;
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
});

self.addEventListener("fetch", async (event) => {
  event.respondWith(
    (async () => {
      const url = new URL(event.request.url);
      console.log("fetch ", url.pathname, event);
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
      const files = await getFiles();
      if (url.pathname === "/__vite_browser_files") {
        return new Response(JSON.stringify({ files }), {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      const client = await self.clients.get(event.clientId);
      if (!client || client.url !== `${location.origin}/runner`) {
        // not from sandbox iframe, fallback to network
        return fetch(event.request);
      }
      const fileName = url.pathname;
      if (files[fileName]) {
        let fileContent = files[fileName];
        fileContent = await rewriteForHMR(fileName, fileContent);
        return new Response(fileContent, {
          headers: {
            "Content-Type": "application/javascript",
          },
        });
      } else {
        return new Response("", {
          status: 404,
          statusText: `[vite-browser]: file not exist in virtual fs`,
        });
      }
    })()
  );
});

channel.addEventListener("message", async (event) => {
  switch (event.data.type) {
    case "requestFileChange":
      const { fileName, content } = event.data;
      await setFile(fileName, content);
      notifyChange(fileName);
      break;

    default:
      break;
  }
});

// simple HMR

function notifyChange(fileName) {
  channel.postMessage({
    type: "hmr:fileChange",
    fileName,
  });
}

async function rewriteForHMR(fileName, content) {
  const importReg = /import (?:.*?) from \"(.*)\"/g;
  let match = importReg.exec(content);
  const importees = [];
  while (match) {
    let importee = match[1];
    importee = resolveRelativePath(fileName, importee);
    importees.push(fileName);
    match = importReg.exec(content);
  }
  // const registerDeps = importees.map(
  //   (importee) => `import.meta.hot.registerDep("${importee}");`
  // );
  const inject = `import { createHotContext } from "/_hmr_client";
import.meta.hot = createHotContext(${fileName});`;
  return inject + content;
}

// TODO, 在服务端收集accept信息
// 因为hmr时服务端必须要知道要更新的模块链

const hmrClientCode = `
  
`;

// utils

function resolveRelativePath(base, path) {
  if (!path) return base;
  if (path.startsWith("/")) return path;
  const parts = path.split("/");
  // ensure path not starts with ./
  if (parts[0] === ".") return resolveRelativePath(base, path.slice(2));
  // ensure base ends with /
  if (!base.endsWith("/")) return resolveRelativePath(getDir(base), path);

  if (parts[0] === "..") {
    parts.shift();
    return resolveRelativePath(getDir(base.slice(0, -1)), parts.join("/"));
  }
  if (parts.length === 1) {
    return base + parts[0];
  }
  parts.shift();
  return resolveRelativePath(base + parts[0] + "/", parts.join("/"));

  function getDir(p) {
    if (p.endsWith("/")) return p;
    const parts = p.split("/");
    parts.pop();
    return parts.join("/") + "/";
  }
}
