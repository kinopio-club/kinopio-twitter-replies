// enable es6 module imports
require = require("esm")(module) // eslint-disable-line no-global-assign

// load .env
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

import { createServer } from 'http'

createServer((req, res) => {
  res.write('Hello World!')
  res.end()
}).listen(process.env.PORT)
