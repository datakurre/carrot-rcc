import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import hashbang from 'rollup-plugin-hashbang'

const plugins = [
  replace({
    "process.env.NODE_ENV": JSON.stringify("production"),
    preventAssignment: true
  }),
  resolve(),
  json(),
  commonjs({ignore: ['original-fs']}),
  typescript(),
  hashbang(),
];

export default [
  {
    input: "carrot_rcc.ts",
    output: {
      file: "carrot-rcc",
      format: "cjs"
    },
    plugins,
  },
];
