export {};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(function (reg) {
      if (reg.installing) {
        console.log("Service worker installing");
      } else if (reg.waiting) {
        console.log("Service worker installed");
      } else if (reg.active) {
        console.log("Service worker active");
      }
      // const sw = reg.installing || reg.waiting || reg.active as ServiceWorker
      // sw.
    })
    .catch(function (error) {
      // registration failed
      console.log("Registration failed with " + error);
    });
} else {
  alert("use a browser that support serviceWorker");
}

const defaultFiles = {
  file1: `const appEl = document.getElementById("app")!;
import App from "./App.js";
appEl.innerHTML = App();`,
  file2: `import Child from "./Child.js";
export default () => {
  return "<h1>App</h1>" + Child();
};`,
  file3: `export default () => {
  return "<p>Child</p>"
}`,
};

const file1 = document.getElementById("file1") as HTMLTextAreaElement;
const file2 = document.getElementById("file2") as HTMLTextAreaElement;
const file3 = document.getElementById("file3") as HTMLTextAreaElement;

setFiles(defaultFiles);

function getFiles() {
  return {
    file1: file1.value,
    file2: file2.value,
    file3: file3.value,
  };
}

function setFiles(data: any) {
  file1.value = data.file1;
  file2.value = data.file2;
  file3.value = data.file3;
}

console.log(getFiles());

// const c = new BroadcastChannel("vite-channel").addEventListener(
//   "message",
//   (event) => {
//     console.log("Broadcast received in page:", event.data);
//   }
// );
