const builtins = require('rollup-plugin-node-builtins')
const commonjs = require('rollup-plugin-commonjs')
const css = require('rollup-plugin-postcss')
const json = require('rollup-plugin-json')
const license = require('rollup-plugin-license')
const minimist = require('minimist')
const resolve = require('rollup-plugin-node-resolve')
const { uglify } = require('rollup-plugin-uglify')
const babel = require('rollup-plugin-babel')

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
        file: [__dirname, 'BANNER'].join('/')
      }
    },
    thirdParty: {
      output: {
        file: './LICENSE-THIRDPARTY',
        template: (deps) => {
          return deps.map(({ name, version, license, licenseText }) => {
            return `# ${name}@${version}\n\n${(licenseText || license).trim()}`
          }).join('\n\n')
        }
      }
    }
  })
]
