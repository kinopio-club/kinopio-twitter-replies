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

import utils from './utils.js'

let streamClient, tweetClient, clientUserName

if (process.env.TWITTER_ACCESS_TOKEN) {
  tweetClient = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  })
  const verifiedUser = await tweetClient.currentUser()
  clientUserName = verifiedUser.screen_name
  console.log('🌳 connected to twitter user', clientUserName)
  console.log('🕊 tweetClient started, waiting for streamClient…')
} else {
  console.log('🚑 missing auth for tweetClient, use /sign-in')
}

const app = express()
app.use(bodyParser.json({ limit: '650kb' }))
const server = http.createServer(app)
app.listen(process.env.PORT)
console.log('server is listening to http')

// http
app.get('/', (request, response) => {
  console.log('🐢 /')
  if (streamClient) {
    response.json({
      status: 200,
      message: '🔮 kinopio-twitter-replies is streaming',
      repo: 'https://github.com/kinopio-club/kinopio-twitter-replies'
    })
  } else {
    response.status(503).json({
      status: 503,
      message: '🚑 kinopio-twitter-replies is waiting to stream…',
      repo: 'https://github.com/kinopio-club/kinopio-twitter-replies'
    })
  }
})

// AUTH STEP 1: sign in to allow tweeting
// You should only need to do this once per environment
// http://localhost:8060/sign-in
// https://twitter-replies.kinopio.club/sign-in
app.get('/sign-in', async (request, response) => {
  console.log('🐢 /sign-in')
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
// https://twitter-replies.kinopio.club/sign-in-complete?pin=123&oauth_token=ABC&oauth_token_secret=XYZ
app.get('/sign-in-complete', async (request, response) => {
  console.log('🐢 /sign-in-complete')
  const { pin, oauth_token, oauth_token_secret } = request.query
  console.log('🌿', pin, oauth_token, oauth_token_secret)
  const tweetClient = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  })
  const { client: loggedClient, accessToken, accessSecret } = await tweetClient.login(pin)
  // AUTH STEP 3: copy keys from loggedClient to env
  console.log('💖',loggedClient)
  response.json({
    message: 'update env with TWITTER_ACCESS_TOKEN and TWITTER_ACCESS_SECRET from 💖 log',
    oauth_token,
    oauth_token_secret,
    loggedClient
  })
})

// init stream rules

const clearRules = async () => {
  let rules = await streamClient.v2.streamRules()
  if (rules.data) {
    const rulesIds = rules.data.map(rule => rule.id)
    await streamClient.v2.updateStreamRules({
      delete: {
        ids: rulesIds,
      },
    })
  }
  rules = await streamClient.v2.streamRules()
  console.log('🌚 rules cleared')
}

const addRules = async () => {
  const rules = await streamClient.v2.updateStreamRules({
    add: [
      { value: '@kinopioclub -from:kinopioclub -is:retweet', tag: 'mentioned' },
      { value: 'kinopio.club -from:kinopioclub -is:retweet', tag: 'space shared' },
    ]
  })
  console.log('🌝 rules added', rules)
}

// create tweet space

const tweetById = async (id) => {
  const tweet = await tweetClient.v2.singleTweet(id, {
    expansions: ['author_id'],
    'tweet.fields': ['text'],
    'user.fields': ['username']
  })
  return tweet
}

const createSpace = async (data, kinopioUser) => {
  const tweet = data.data
  data.conversationTweet = await tweetById(tweet.conversation_id)
  console.log('🌸', data.conversationTweet)
  utils.createTweetsSpace(data, kinopioUser)
}

// respond to streaming tweets

const replyAndCreateSpace = async (data) => {
  const tweet = data.data
  const twitterUsername = data.includes.users[0].username
  const kinopioUser = await utils.kinopioUser(twitterUsername)
  console.log('💁‍♀️', data, twitterUsername)
  let message
  if (kinopioUser) {
    message = utils.replyMessageSuccess(twitterUsername)
    console.log('🍋',message)
    createSpace(data, kinopioUser)
  } else {
    message = utils.replyMessageError(twitterUsername)
  }
  const options = {
    in_reply_to_status_id: tweet.id,
  }
  if (process.env.NODE_ENV === 'production') {
    const reply = await tweetClient.v1.tweet(message, options)
    console.log('💌 replied', reply, options, utils.tweetUrl({ tweetId: reply.id_str, username: clientUserName }))
  } else {
    console.log('✉️ preflight reply', message, options)
  }
}

const handleTweet = async (data) => {
  const tweet = data.data
  const rule = data.matching_rules[0].tag
  const isSaveRequest = rule === 'mentioned' && tweet.text.includes('save')
  if (isSaveRequest) {
    replyAndCreateSpace(data)
  // if else ..
  // TODO support DMs to save
  } else {
    // all other mentions, and tweets with spaces
    const username = data.includes.users[0].username
    // TODO post to discord, pending noise becoming an issue
    console.log('💐 TODO post to discord', username, tweet, utils.tweetUrl({ tweetId: tweet.id, username }))
  }
}

const listen = async () => {
  streamClient = new TwitterApi(process.env.TWITTER_API_BEARER_TOKEN)
  console.log('🔮 server is listening to stream')
  await clearRules()
  await addRules()
  try {
    // https://github.com/PLhery/node-twitter-api-v2/blob/master/doc/streaming.md
    const stream = await streamClient.v2.searchStream({
      expansions: ['author_id'],
      'user.fields': ['username'],
      'tweet.fields': ['conversation_id']
    })
    stream.on(
      ETwitterStreamEvent.Data,
      eventData => {
        handleTweet(eventData)
      },
    )
    stream.on(
      ETwitterStreamEvent.ConnectionClosed,
      () => {
        console.log('🚒 Connection has been closed')
        stream.close()
        listen()
      },
    )
    stream.on(
      ETwitterStreamEvent.ConnectionError,
      error => console.log('🚒 Connection error', error),
    )
    stream.on(
      // Emitted when Twitter sends a signal to keep connection active
      ETwitterStreamEvent.DataKeepAlive,
      () => console.log('💕 Twitter sent a keep-alive signal'),
    )
    stream.autoReconnect = true
  } catch (error) {
    console.error('🚒', error)
  }
}

// init listen to stream

if (process.env.NODE_ENV === 'production') {
  console.log('waiting to listen to stream…')
  setTimeout(() => {
    console.log('starting listen to stream')
    listen()
  }, 5 * 60 * 1000) // wait 5 minute to start streaming
} else {
  listen()
}
