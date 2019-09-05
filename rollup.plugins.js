const { readFileSync } = require('fs')
const { template } = require('lodash')
const minimist = require('minimist')
const babel = require('rollup-plugin-babel')
const commonjs = require('rollup-plugin-commonjs')
const json = require('rollup-plugin-json')
const license = require('rollup-plugin-license')
const builtins = require('rollup-plugin-node-builtins')
const resolve = require('rollup-plugin-node-resolve')
const css = require('rollup-plugin-postcss')
const { uglify } = require('rollup-plugin-uglify')

const pkg = require([process.cwd(), 'package.json'].join('/'))
const { w: watch } = minimist(process.argv)

module.exports = [
  { watch },
  resolve(),
  commonjs(),
  builtins(),
  css({
    extract: true,
    minimize: true
  }),
  json(),
  (watch && {}) || babel({
    plugins: [
      ['@babel/plugin-transform-runtime', {
        helpers: false
      }]
    ],
    presets: [
      ['@babel/preset-env']
    ]
  }),
  (watch && {}) || uglify(),
  (watch && {}) || license({
    banner: {
      content: {
        file: [__dirname, 'tpl', 'BANNER'].join('/')
      }
    },
    thirdParty: {
      output: {
        file: './LICENSE',
        template: (dependencies) => {
          return template(
            readFileSync(
              [__dirname, 'tpl', 'LICENSE'].join('/')
            )
          )({ dependencies, pkg })
        }
      }
    }
  })
]
