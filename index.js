// load .env
import dotenv from 'dotenv'
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

import { createServer } from 'http'

createServer((req, res) => {
  res.write('Hello World!')
  res.end()
}).listen(process.env.PORT)
