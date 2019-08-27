import { banner } from './src/helper/rollup/banner'
import { external } from './src/helper/rollup/external'
import { globals } from './src/helper/rollup/globals'
import { plugins } from './src/helper/rollup/plugins'
import { name, version } from './package.json'

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
    banner: banner(name, version),
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
    banner: banner(name, version),
    file: 'dist/worker.cjs.js',
    format: 'cjs',
    globals
  },
  plugins
}]
