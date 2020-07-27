const plugins = require('./rollup.plugins')

const external = [
  'fs-extra',
  'node-cron'
]

const globals = {
  'fs-extra': 'fsExtra',
  'node-cron': 'nodeCron'
}

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
