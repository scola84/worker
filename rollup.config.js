const {
  external,
  globals,
  plugins
} = require('./rollup')

external.splice(0, 0, ...[
  'fs-extra',
  'node-cron'
])

Object.assign(globals, {
  'fs-extra': 'fsExtra',
  'node-cron': 'nodeCron'
})

const input = './index.js'

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
}]
