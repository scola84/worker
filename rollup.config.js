import buble from 'rollup-plugin-buble';
import builtins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';

const external = [
  'fs-extra',
  'node-cron'
];

const globals = {
  'fs-extra': 'fsExtra',
  'node-cron': 'nodeCron'
};

const input = './index.js';

const plugins = [
  resolve(),
  commonjs(),
  builtins(),
  json(),
  buble({
    transforms: {
      dangerousForOf: true
    }
  })
];

export default [{
  input,
  external,
  output: {
    extend: true,
    file: 'dist/worker.umd.js',
    format: 'umd',
    globals,
    name: 'scola.worker'
  },
  plugins
}, {
  input,
  external,
  output: {
    file: 'dist/worker.cjs.js',
    format: 'cjs',
    globals
  },
  plugins
}];
