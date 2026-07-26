function readStdin() {
  if (process.stdin.isTTY) {
    return Promise.resolve('')
  }
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')

    const onData = (chunk) => {
      data += chunk
    }

    const onEnd = () => {
      cleanup() // eslint-disable-line no-use-before-define
      resolve(data.trim())
    }

    process.stdin.on('data', onData)
    process.stdin.on('end', onEnd)

    const timer = setTimeout(() => {
      cleanup() // eslint-disable-line no-use-before-define
      resolve(data.trim())
    }, 100)

    function cleanup() {
      clearTimeout(timer)
      process.stdin.removeListener('data', onData)
      process.stdin.removeListener('end', onEnd)
      try {
        process.stdin.pause()
      } catch (err) {
        // ignore errors pausing stdin
      }
    }
  })
}

module.exports = {
  readStdin,
}
