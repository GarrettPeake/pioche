import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import nodePolyfills from "rollup-plugin-node-polyfills";
import replace from "@rollup/plugin-replace";
import del from "rollup-plugin-delete";
import copy from "rollup-plugin-copy-watch";

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
      del({ targets: "dist" }), // Clear dist directory to start
      replace({ "process.env.NODE_ENV": JSON.stringify("production"), preventAssignment: true}),
      resolve({ browser: true }),
      nodePolyfills(),
      typescript({ tsconfig: "./tsconfig.json" })
    ],
  },
  {
    input: "dist/esm/types/index.d.ts",
    output: [{ file: packageDec.types, format: "esm" }],
    plugins: [
      dts(),
      copy({
        watch: "scripts/**",
        targets: [
          { src: "scripts", dest: "dist/" }
        ]
      })
    ],
  }
];