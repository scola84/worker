import buble from 'rollup-plugin-buble';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: './index.js',
  external: [
    'node-schedule'
  ],
  output: [{
    file: 'dist/worker.cjs.js',
    format: 'cjs'
  }, {
    file: 'dist/worker.umd.js',
    format: 'umd',
    name: 'scola'
  }],
  plugins: [
    resolve(),
    commonjs(),
    buble()
  ]
};
