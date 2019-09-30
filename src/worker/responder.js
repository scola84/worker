import { Worker } from './worker'

export class Responder extends Worker {
  act (box, boxData) {
    const {
      meta = {},
      data
    } = this.filter(box, boxData)

    meta.statusCode = box.request.method === 'POST'
      ? 201
      : 200

    box.callback({
      meta,
      data: {
        data,
        status: meta.statusCode
      }
    })
  }

  err (box, error) {
    const {
      meta = {}
    } = this.filter(box, error)

    const [,
      code = 500,
      text
    ] = error.message.match(/^(\d{3}) (.*)/) || []

    if (code) {
      meta.statusCode = Number(code)
    }

    const data = error.data
      ? error.data
      : meta.statusCode < 500 ? text : 'Internal Server Error'

    box.callback({
      meta,
      data: {
        data,
        status: meta.statusCode
      }
    })
  }

  filter (box, data) {
    if (this._filter) {
      return this.filter(box, data)
    }

    return {
      data
    }
  }
}
