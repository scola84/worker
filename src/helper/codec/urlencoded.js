import qs from 'qs'
const type = 'application/x-www-form-urlencoded'

class Codec {
  static decode (readable, callback) {
    const buffers = []

    readable.on('data', (buffer) => {
      buffers.push(buffer)
    })

    readable.once('end', () => {
      const buffer = Buffer.concat(buffers)

      if (buffer.length === 0) {
        callback()
        return
      }

      try {
        callback(null, qs.parse(String(buffer)))
      } catch (error) {
        callback(error)
      }
    })
  }

  static encode (writable, data, callback) {
    try {
      if (data === null || data === undefined) {
        writable.end(callback)
      } else {
        writable.end(qs.stringify(data), callback)
      }
    } catch (error) {
      callback(error)
    }
  }
}

export {
  Codec,
  type
}