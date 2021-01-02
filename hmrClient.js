/**
 * We need to build a module graph,
 * so that with this import relationship:
 *   a
 *  ↗ ↖
 * b   c
 *  ↖ ↗
 *   d
 * when d is updated, we only call the cb of a **once**.
 */

const channel = new BroadcastChannel("vite-browser-channel");

const moduleMap = {};

class HotModule {
  constructor(name) {
    this.name = name;
    this.accepts = {};
  }
}

export const createHotContext = (fileName) => {
  if (!moduleMap[fileName]) {
    moduleMap[fileName] = new HotModule(fileName);
  }
  const hotModule = moduleMap[fileName];
  return {
    accept(cb) {
      const arr = (hotModule.accepts[fileName] =
        hotModule.accepts[fileName] || []);
      arr.push(cb);
    },
    acceptDeps(depFileName, cb) {
      const arr = (hotModule.accepts[depFileName] =
        hotModule.accepts[depFileName] || []);
      arr.push(cb);
    },
  };
};

function bubbleUpdate(currentFileName, hmrBoundaries) {
  if (false) {
    /**
     * TODO re-import the modules in import chain.
     * Example 1:
     *   a
     *  ↗ ↖
     * b   c
     *  ↖ ↗ ↖
     *   d   e
     *
     * a: acceptDep c
     * b: acceptDep d
     * c: acceptDep e
     *
     * When d is updated, the hmrBoundaries will be a and b.
     * Only d, c will be re-import (in that order).
     * a, b, e will not be re-import.
     *
     * Example 2:
     *   a
     *  ↗ ↖
     * b   c
     *  ↖ ↗ ↖
     *   d   e
     *
     * a: self-accept
     *
     * When e is updated, the hmrBoundaries will be a.
     * Only e, c, a will be re-import(in that order).
     * b, d will not be re-import.
     */
  }
}

channel.addEventListener("message", async (event) => {
  if (event.data.type === "hmr_start_update") {
    const { acceptingFile, acceptedFile, versionId } = event.data;
    // moduleMap[fileName]
    const acceptCb = moduleMap[fileName].accepts[acceptedFile]

    const newMod = await import(acceptedFile + `?versionId=${versionId}`);
    // moduleMap[fileName]
    // if (onFileChange[fileName]) {
    //   onFileChange[fileName].forEach((cb) => {
    //     cb();
    //   });
    // }
  }
});
