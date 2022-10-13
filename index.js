// load .env
import dotenv from 'dotenv'
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

import { createServer } from 'http'
import fetch from 'node-fetch'
import { Headers } from 'node-fetch'
import { URL, URLSearchParams } from 'url'

let rules

createServer((request, response) => {
  response.write('kinopio-twitter-replies is online')
  response.end()
}).listen(process.env.PORT)


console.log('☮️')

// // https://developer.twitter.com/en/docs/tutorials/stream-tweets-in-real-time

const init = async () => {
  if (!rules) {
    rules = await filterRules()
  }
  console.log('💖💖💖💖💖💖', rules)
  // tweets()
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
  console.log('☃️☃️',result)
  return result
}
// const tweets = async () => {

// }



// export default () {

// }
// init()
init()
