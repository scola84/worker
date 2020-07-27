const { execSync } = require('child_process')
const { readFileSync, writeFileSync } = require('fs')
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

function scolaBabel () {
  if (watch) {
    return {}
  }

  return babel({
    plugins: [
      ['@babel/plugin-transform-runtime', {
        helpers: false
      }]
    ],
    presets: [
      ['@babel/preset-env']
    ]
  })
}

function scolaChangelog () {
  if (watch) {
    return {}
  }

  return {
    writeBundle: () => {
      const file = process.cwd() + '/CHANGELOG.md'
      let log = null

      try {
        log = String(readFileSync(file))
      } catch (error) {
        return
      }

      if (log.match(pkg.version)) {
        return
      }

      const add = String(
        execSync(
          'git log --pretty=format:"* %s"' +
          ' HEAD ^$(git tag --sort version:refname | tail -n 1)'
        )
      )

      if (add === '') {
        return
      }

      writeFileSync(
        file,
        `## ${pkg.version} (${new Date().toDateString()})\n\n` +
        `${add}\n\n${log}`
      )
    }
  }
}

function scolaLicense () {
  if (watch) {
    return {}
  }

  return license({
    banner: {
      content: {
        file: [__dirname, 'tpl', 'BANNER'].join('/')
      }
    },
    thirdParty: {
      output: {
        file: './LICENSE.md',
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
}

function scolaUglify () {
  if (watch) {
    return {}
  }

  return uglify()
}

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
  scolaBabel(),
  scolaUglify(),
  scolaLicense(),
  scolaChangelog()
]
