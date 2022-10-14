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

let steamClient, tweetClient

if (process.env.TWITTER_ACCESS_TOKEN) {
  tweetClient = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  })
  tweetClient.readWrite
  // await tweetClient.login()
  // await tweetClient.currentUser()

  // console.log('🌳', tweetClient)
  // const verifiedUser = await tweetClient.currentUser()
  console.log('🕊 tweet client started')
} else {
  console.log('🚑 missing auth for tweetClient')
}

const app = express()
app.use(bodyParser.json({ limit: '650kb' }))
const server = http.createServer(app)
app.listen(process.env.PORT)
console.log('🔮 server is listening to http')

// http
app.get('/', (request, response) => {
  response.json({
    message: 'kinopio-twitter-replies is online',
    repo: 'https://github.com/kinopio-club/kinopio-twitter-replies'
  })
})

// AUTH STEP 1: sign in to allow tweeting
// You should only need to do this once per environment
// http://localhost:8060/sign-in
app.get('/sign-in', async (request, response) => {
  tweetClient = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET
  })
  const authLink = await tweetClient.generateAuthLink()
  response.json({
    message: 'store tokens, the auth url will return a PIN. Then pass them to /sign-in-complete',
    auth_url: authLink.url,
    oauth_token: authLink.oauth_token,
    oauth_token_secret: authLink.oauth_token_secret,
  })
})
// AUTH STEP 2: complete sign in
// http://localhost:8060/sign-in-complete?pin=123&oauth_token=ABC&oauth_token_secret=XYZ
app.get('/sign-in-complete', async (request, response) => {
  const { pin, oauth_token, oauth_token_secret } = request.query
  console.log('🌿', pin, oauth_token, oauth_token_secret)
  const tweetClient = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  })
  const { client: loggedClient, accessToken, accessSecret } = await tweetClient.login(pin)
  console.log('💖',loggedClient)
  const verifiedUser = await loggedClient.currentUser()
  console.log('🌳 verify persistent user', verifiedUser)
  response.json({
    message: 'update env with TWITTER_ACCESS_TOKEN and TWITTER_ACCESS_SECRET',
    oauth_token,
    oauth_token_secret,
    loggedClient
  })
})

const clearRules = async () => {
  let rules = await steamClient.v2.streamRules()
  if (rules.data) {
    const rulesIds = rules.data.map(rule => rule.id)
    await steamClient.v2.updateStreamRules({
      delete: {
        ids: rulesIds,
      },
    })
  }
  rules = await steamClient.v2.streamRules()
  console.log('💣 rules cleared', rules)
}

const addRules = async () => {
  const rules = await steamClient.v2.updateStreamRules({
    add: [
      { value: '@kinopioclub save', tag: 'save thread' },
      { value: 'kinopio.club has:links', tag: 'someone shared a space' }, // TODO to discord
      { value: '@kinopioclub -save', tag: 'message to kinopio' }, // TODO to discord
    ]
  })
  console.log('🐸 rules added', rules)
}

const replyToTweet({ tweet, url }) {
  // TODO after shipping this, don't reply to @s from dev env, just log it
  const spaceUrl = `kinopio.club/twitter-thread/${tweet.id}`
  await tweetClient.v2.reply(
    `test reply \n\ncreated tweet. \n\$${spaceUrl} \n yolo.`,
    tweet.id,
  )
}

const handleTweet = async (data) => {
  const username = data.includes.users[0].username
  const tweet = data.data
  const url = `https://twitter.com/${username}/status/${tweet.id}` // to send to discord
  const rule = data.matching_rules[0].tag
  console.log('🕊', data, tweet, username, url, rule)
  if (rule === 'save thread') {
    replyToTweet({ tweet, url })
  } else {
    // post to discord
  }
}

const listen = async () => {
  steamClient = new TwitterApi(process.env.TWITTER_API_BEARER_TOKEN)
  await clearRules()
  await addRules()
  const stream = await steamClient.v2.searchStream({ expansions: ['author_id'], 'user.fields': ['username'] })
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
