import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import path from "path";

const prod = (process.argv[2] === "production");
const force = process.argv.includes("--force");

// 防呆：main.js 比 src/ 新时禁止构建，防止过期源码覆盖手改过的功能版。
// 确认 src 已同步后用 npm run build -- --force 绕过。
function newestMtime(dir) {
  let newest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestMtime(p));
    else newest = Math.max(newest, fs.statSync(p).mtimeMs);
  }
  return newest;
}

if (prod && !force && fs.existsSync("main.js")) {
  const srcMtime = newestMtime("src");
  const distMtime = fs.statSync("main.js").mtimeMs;
  if (distMtime > srcMtime) {
    console.error(
      "❌ 构建已阻止：main.js 比 src/ 新，直接构建会丢失只在 main.js 里的改动。\n" +
      "   先把 main.js 的功能回移植到 src/，或确认无损失后加 --force 强制构建。"
    );
    process.exit(1);
  }
}

const context = await esbuild.context({
  banner: {
    js: "/* Diary Heatmap Plugin */",
  },
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "moment",
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  minify: prod,
  outfile: "main.js",
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
