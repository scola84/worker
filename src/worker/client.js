import parseContentType from 'content-type-parser'
import { request as http } from 'http'
import { request as https } from 'https'
import { mergeDeepRight } from 'ramda'
import { format } from 'url'
import { codec } from '../helper'
import { Worker } from './worker'

let wmeta = {
  protocol: 'https:'
}

export class Client extends Worker {
  static getMeta () {
    return wmeta
  }

  static setMeta (meta) {
    wmeta = mergeDeepRight(wmeta, meta)
  }

  act (box, boxData = null) {
    let {
      meta,
      data
    } = this.filter(box, boxData)

    meta = mergeDeepRight(wmeta, meta)
    meta.path = format(meta.path || '/')

    const fetch = meta.protocol === 'https:' ? https : http
    const request = fetch(meta)

    request.once('error', (error) => {
      this.fail(box, error)
    })

    request.once('response', (response) => {
      this.handleResponse(box, boxData, response)
    })

    this.handleRequest(box, boxData, request, data)
  }

  handleRequest (box, boxData, request, data) {
    const type = parseContentType(request.getHeader('content-type'))

    const encoder =
      (type && codec[`${type.type}/${type.subtype}`]) ||
      codec['application/octet-stream']

    encoder.encode(request, data, (encodeError) => {
      if (encodeError) {
        this.fail(box, encodeError)
      }
    })
  }

  handleResponse (box, boxData, response) {
    const type = parseContentType(response.headers['content-type'])

    const decoder =
      (type && codec[`${type.type}/${type.subtype}`]) ||
      codec['application/octet-stream']

    decoder.decode(response, (decodeError, data) => {
      if (decodeError) {
        this.fail(box, decodeError)
        return
      }

      if (response.statusCode >= 400) {
        const error = new Error(
          `${response.statusCode} ${response.statusText || ''}`.trim()
        )

        this.fail(box, this.merge(response, data, boxData, error))
        return
      }

      this.pass(box, this.merge(response, data, boxData))
    })
  }

  merge (response, data, boxData, error) {
    if (this._merge) {
      return this._merge(response, data, boxData, error)
    }

    if (error) {
      error.data = data
      return error
    }

    return data && data.data ? data.data : data
  }
}
