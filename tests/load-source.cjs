const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Compile the repository's TypeScript in memory, with explicit boundary fakes.
module.exports = function loadSource(relativePath, mocks = {}, cache = new Map()) {
  const filename = require.resolve(path.resolve(__dirname, '..', relativePath));
  if (cache.has(filename)) return cache.get(filename).exports;
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  cache.set(filename, compiled);
  const nativeRequire = compiled.require.bind(compiled);
  compiled.require = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('@/') || name.startsWith('.')) {
      const base = name.startsWith('@/')
        ? path.resolve(__dirname, '../src', name.slice(2))
        : path.resolve(path.dirname(filename), name);
      const source = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
        .find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (source && /\.tsx?$/.test(source)) return loadSource(source, mocks, cache);
    }
    return nativeRequire(name);
  };
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText, filename);
  return compiled.exports;
};
