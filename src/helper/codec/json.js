const type = 'application/json'

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
        callback(null, JSON.parse(buffer))
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
        writable.end(JSON.stringify(data), callback)
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
