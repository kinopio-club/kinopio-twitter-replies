// load .env
import dotenv from 'dotenv'
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

import http from 'http'
import { URL, URLSearchParams } from 'url'
import express from 'express'
import bodyParser from 'body-parser'
import { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } from 'twitter-api-v2'
const client = new TwitterApi(process.env.TWITTER_API_BEARER_TOKEN)

const app = express()
app.use(bodyParser.json({ limit: '650kb' }))
const server = http.createServer(app)
app.listen(process.env.PORT)
console.log('🔮 server is listening to http')

// http
app.get('/', function (request, response) {
  response.json({
    message: 'kinopio-twitter-replies is online',
    repo: 'https://github.com/kinopio-club/kinopio-twitter-replies'
  })
})

const clearRules = async () => {
  let rules = await client.v2.streamRules()
  if (rules.data) {
    const rulesIds = rules.data.map(rule => rule.id)
    await client.v2.updateStreamRules({
      delete: {
        ids: rulesIds,
      },
    })
  }
  rules = await client.v2.streamRules()
  console.log('💣 rules cleared', rules)
}

const addRules = async () => {
  const rules = await client.v2.updateStreamRules({
    add: [
      { value: 'to:readwise', tag: 'test readwise tag' }, // to:kinopioclub text:save
      { value: 'TypeScript', tag: 'test ts tag' }
    ]
  })
  console.log('🐸 rules added', rules)
}

const handleTweet = async (data) => {
  console.log('🕊', data)
}

const listen = async () => {
  await clearRules()
  await addRules()
  const stream = await client.v2.searchStream({ expansions: ['author_id'], 'user.fields': ['username'] })
  console.log('🔮 server is listening to stream')
  stream.on(
    ETwitterStreamEvent.Data,
    eventData => {
      handleTweet(eventData)
    },
  )
  stream.autoReconnect = true
}

listen()
