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
      { value: '@kinopioclub save', tag: 'save thread' },
      { value: 'kinopio.club has:links', tag: 'someone shared a space' }, // TODO to discord
      { value: '@kinopioclub -save', tag: 'message to kinopio' }, // TODO to discord
    ]
  })
  console.log('🐸 rules added', rules)
}

const handleTweet = async (data) => {
  const username = data.includes.users[0].username
  const tweet = data.data
  const url = `https://twitter.com/${username}/status/${tweet.id}` // to send to discord
  const rule = data.matching_rules[0].tag
  console.log('🕊', data, tweet, username, url, rule)
  if (rule === 'save thread') {
    // reply to tweet
    const spaceUrl = `kinopio.club/twitter-thread/${tweet.id}`
    await client.v2.reply(
      `test reply to previously \n\ncreated tweet. \n\$${spaceUrl} \n yolo.`,
      tweet.id,
    );
  } else {
    // post to discord
    //
  }
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
