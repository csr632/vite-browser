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

  file1.addEventListener("input", getChangeHandler("/file1.js"));
  file2.addEventListener("input", getChangeHandler("/file2.js"));
  file3.addEventListener("input", getChangeHandler("/file3.js"));

  function getChangeHandler(fileName: string) {
    return function handleChange(e: Event) {
      requestFileChange(fileName, getFiles()[fileName]);
    };
  }

  function getFiles(): any {
    return {
      "/file1.js": file1.value,
      "/file2.js": file2.value,
      "/file3.js": file3.value,
    };
  }

  function requestFileChange(fileName: string, content: string) {
    channel.postMessage({
      type: "requestFileChange",
      fileName,
      content,
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
