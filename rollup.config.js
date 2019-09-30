const plugins = require('./rollup.plugins')

const input = './index.js'

export default [{
  input,
  external: [
    'fs-extra',
    'node-cron'
  ],
  output: {
    extend: true,
    file: 'dist/worker.umd.js',
    format: 'umd',
    globals: {
      'fs-extra': 'fsExtra',
      'node-cron': 'nodeCron'
    },
    name: 'scola.worker'
  },
  plugins
}, {
  input,
  external: [
    'fs-extra',
    'http',
    'https',
    'node-cron'
  ],
  output: {
    file: 'dist/worker.cjs.js',
    format: 'cjs',
    globals: {
      'fs-extra': 'fsExtra',
      http: 'http',
      https: 'https',
      'node-cron': 'nodeCron'
    }
  },
  plugins
}]
