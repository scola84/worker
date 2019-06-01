import buble from 'rollup-plugin-buble';
import builtins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: './index.js',
  output: [{
    file: 'dist/worker.cjs.js',
    format: 'cjs'
  }, {
    extend: true,
    file: 'dist/worker.umd.js',
    format: 'umd',
    name: 'scola.worker'
  }],
  plugins: [
    resolve(),
    commonjs(),
    builtins(),
    json(),
    buble()
  ]
};
