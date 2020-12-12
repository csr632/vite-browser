async function main() {
  const file1 = document.getElementById("file1") as HTMLTextAreaElement;
  const file2 = document.getElementById("file2") as HTMLTextAreaElement;
  const file3 = document.getElementById("file3") as HTMLTextAreaElement;
  const runner = document.getElementById("runner") as HTMLIFrameElement;

  const channel = new BroadcastChannel("vite-browser-channel");

  fetch("/__vite_browser_files")
    .then((res) => res.json())
    .then((d) => d.files)
    .then(setFiles);

  channel.addEventListener("message", (event) => {
    if (event.data.type === "onFilesChange") {
      runner.contentWindow?.location.reload();
    }
  });
  runner.src = "/runner";

  file1.addEventListener("input", handleChange);
  file2.addEventListener("input", handleChange);
  file3.addEventListener("input", handleChange);

  function handleChange(e: Event) {
    requestFileChange(getFiles());
  }

  function getFiles() {
    return {
      "/file1.js": file1.value,
      "/file2.js": file2.value,
      "/file3.js": file3.value,
    };
  }

  function requestFileChange(files: any) {
    channel.postMessage({
      type: "requestFileChange",
      files,
    });
  }

  function setFiles(files: any) {
    file1.value = files["/file1.js"];
    file2.value = files["/file2.js"];
    file3.value = files["/file3.js"];
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");

  navigator.serviceWorker.ready
    .then(() => {
      if (navigator.serviceWorker.controller) return;
      return new Promise<void>((res) => {
        const listener = () => {
          res();
          navigator.serviceWorker.removeEventListener(
            "controllerchange",
            listener
          );
        };
        navigator.serviceWorker.addEventListener("controllerchange", listener);
      });
    })
    .then(() => {
      console.log("Service worker is ready. Bootstrap the app.");
      main();
    });
} else {
  alert("Use a browser that support serviceWorker");
}
export {};
