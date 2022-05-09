import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import nodePolyfills from "rollup-plugin-node-polyfills";
import replace from "@rollup/plugin-replace";

const packageDec = require("./package.json");

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageDec.main,
        format: "cjs",
        sourcemap: true,
        name: "pioche",
        exports: "named"
      },
      {
        file: packageDec.module,
        format: "esm",
        sourcemap: true
      }
    ],
    plugins: [
      replace({
        "process.env.NODE_ENV": JSON.stringify("production")
      }),
      resolve({
        browser: true
      }),
      nodePolyfills(),
      typescript({ tsconfig: "./tsconfig.json" })
    ],
  },
  {
    input: "dist/esm/types/index.d.ts",
    output: [{ file: packageDec.types, format: "esm" }],
    plugins: [dts()],
  },
];