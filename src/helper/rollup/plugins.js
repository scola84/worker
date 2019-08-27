import babel from 'rollup-plugin-babel'
import builtins from 'rollup-plugin-node-builtins'
import commonjs from 'rollup-plugin-commonjs'
import css from 'rollup-plugin-postcss'
import json from 'rollup-plugin-json'
import minimist from 'minimist'
import resolve from 'rollup-plugin-node-resolve'
import { uglify } from 'rollup-plugin-uglify'

const args = minimist(process.argv)

export const plugins = [
  resolve(),
  commonjs(),
  builtins(),
  css({
    minimize: true
  }),
  json(),
  (args.w && {}) || babel({
    plugins: [
      ['@babel/plugin-transform-runtime', {
        helpers: false
      }]
    ],
    presets: [
      ['@babel/preset-env']
    ]
  }),
  (args.w && {}) || uglify()
]
