// load .env
import dotenv from 'dotenv'
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

import http from 'http'
import fetch from 'node-fetch'
import { Headers } from 'node-fetch'
import { URL, URLSearchParams } from 'url'
import express from 'express'
import bodyParser from 'body-parser'

let rules

const app = express()
app.use(bodyParser.json({ limit: '650kb' }))
const server = http.createServer(app)

app.listen(process.env.PORT)
console.log('🔮 server is listening')

// http
app.get('/', function (request, response) {
  response.json({
    message: 'kinopio-twitter-replies is online',
    repo: 'https://github.com/kinopio-club/kinopio-twitter-replies'
  })
})

// websocket
// const websockets = new WebSocket.Server({ server })


// // https://developer.twitter.com/en/docs/tutorials/stream-tweets-in-real-time



const init = async () => {
  if (!rules) {
    rules = await filterRules()
  }
  console.log('💖💖💖💖💖💖')
  tweets()
}

const filterRules = async () => {
  // Filtering criteria are applied to the filtered stream endpoints in the form of rules
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.TWITTER_API_BEARER_TOKEN}`
  })
  const body = {
    add: [
      { value: 'from:twitterdev from:twitterapi has:links' } // to:kinopioclub text:save
      // https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule
    ]
  }
  const url = 'https://api.twitter.com/2/tweets/search/stream/rules'
  const options = { method: 'POST', headers, body: JSON.stringify(body) }
  const response = await fetch(url, options)
  const result = await response.json()
  console.log('☃️ Rules',result)
  return result
}


const tweets = async () => {
  const url = 'https://api.twitter.com/2/tweets/search/stream?tweet.fields=context_annotations&expansions=author_id'

}



// export default () {

// }
// init()
init()
