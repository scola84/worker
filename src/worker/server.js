import parseContentType from 'content-type-parser'
import { createServer } from 'http'
import { mergeDeepRight } from 'ramda'
import { codec } from '../helper'
import { Worker } from './worker'

let wmeta = {
  statusCode: 200
}

export class Server extends Worker {
  static getMeta () {
    return wmeta
  }

  static setMeta (meta) {
    wmeta = mergeDeepRight(wmeta, meta)
  }

  constructor (options = {}) {
    super(options)

    this._listen = null
    this.setListen(options.listen)
  }

  getListen () {
    return this._listen
  }

  setListen (value = 3000) {
    this._listen = value
    return this
  }

  handleRequest (request, response) {
    const type = parseContentType(request.headers['content-type'])

    const decoder =
      (type && codec[`${type.type}/${type.subtype}`]) ||
      codec['application/octet-stream']

    decoder.decode(request, (decodeError, data) => {
      const callback = (value) => {
        this.handleResponse(request, response, value)
      }

      const box = {
        callback,
        request,
        response
      }

      if (decodeError) {
        this.fail(box, decodeError)
        return
      }

      this.pass(box, this.merge(request, data))
    })
  }

  handleResponse (request, response, { meta, data }) {
    meta = mergeDeepRight(wmeta, meta)

    const type = parseContentType(meta.headers['content-type'])

    const encoder =
      (type && codec[`${type.type}/${type.subtype}`]) ||
      codec['application/octet-stream']

    response.writeHead(meta.statusCode, meta.headers)

    encoder.encode(response, data, (encodeError) => {
      if (encodeError) {
        this.fail({ request, response }, encodeError)
      }
    })
  }

  start () {
    const server = createServer()

    server.on('request', (request, response) => {
      this.handleRequest(request, response)
    })

    server.listen(this._listen)
  }
}
