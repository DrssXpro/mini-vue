import typescript from "@rollup/plugin-typescript";

export default {
  input: "./src/index.ts",
  // 打包产物：commonjs 和 esm 规范
  output: [
    {
      format: "cjs",
      file: "lib/guide-mini-vue.cjs.js",
    },
    {
      format: "es",
      file: "lib/guide-mini-vue.esm.js",
    },
  ],
  // 使用编译 ts 文件插件
  plugins: [typescript()],
};
