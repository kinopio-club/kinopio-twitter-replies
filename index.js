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
import _ from 'lodash'

let steamClient, tweetClient

if (process.env.TWITTER_ACCESS_TOKEN) {
  tweetClient = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  })
  const verifiedUser = await tweetClient.currentUser()
  console.log('🌳 connected to twitter user', verifiedUser.screen_name)
  console.log('🕊 tweetClient started')
} else {
  console.log('🚑 missing auth for tweetClient, use /sign-in')
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
// https://kinopio-twitter-replies-production.up.railway.app/sign-in
app.get('/sign-in', async (request, response) => {
  console.log('☮️ sign in auth',{
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET
  })

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
  // AUTH STEP 3: copy keys from loggedClient to env
  console.log('💖',loggedClient)
  response.json({
    message: 'update env with TWITTER_ACCESS_TOKEN and TWITTER_ACCESS_SECRET from 💖 log',
    oauth_token,
    oauth_token_secret,
    loggedClient
  })
})

// init streaming

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
  console.log('🌚 rules cleared')
}

const addRules = async () => {
  const rules = await steamClient.v2.updateStreamRules({
    add: [
      { value: '@kinopioclub -from:kinopioclub', tag: 'mention' },
    ]
  })
  console.log('🌝 rules added')
}

// respond to streaming tweets

const tweetUrl = (username, tweetId) => {
  return `https://twitter.com/${username}/status/${tweetId}`
}

const replyWithSaveMessage = async (tweet) => {
  const spaceUrl = `https://kinopio.club/twitter-thread/${tweet.id}`
  const kaomojis = ['ヾ(＾∇＾)', '(^-^*)/', '( ﾟ▽ﾟ)/', '( ^_^)／', '(^o^)/', '(^ _ ^)/', '( ´ ▽ ` )ﾉ', '(ﾉ´∀｀*)ﾉ', 'ヾ(´･ω･｀)', '☆ﾐ(o*･ω･)ﾉ', '＼(＾▽＾*)', '(*＾▽＾)／', '(￣▽￣)ノ', 'ヾ(-_-;)', 'ヾ( ‘ – ‘*)', 'ヾ(＠⌒ー⌒＠)ノ', '~ヾ ＾∇＾', '~ヾ(＾∇＾)', '＼(￣O￣)', '(｡･ω･)ﾉﾞ', '(*^･ｪ･)ﾉ', '(￣∠ ￣ )ﾉ', '(*￣Ｏ￣)ノ', 'ヾ(｡´･_●･`｡)☆', '(/・0・)', '(ノ^∇^)', '(,, ･∀･)ﾉ゛', '(。･д･)ﾉﾞ', '＼(°o°；）', '(｡´∀｀)ﾉ', '(o´ω`o)ﾉ', '( ･ω･)ﾉ', '(。^_・)ノ', '( ・_・)ノ', '＼(-o- )', '(。-ω-)ﾉ', '＼(-_- )', '＼( ･_･)', 'ヾ(´￢｀)ﾉ', 'ヾ(☆▽☆)', '(^ Q ^)/゛', '~(＾◇^)/', 'ヘ(‘◇’、)/', 'ヘ(°◇、°)ノ', 'ヘ(°￢°)ノ', 'ヘ(゜Д、゜)ノ', '（ ゜ρ゜)ノ', 'ー( ´ ▽ ` )ﾉ', 'ヽ(๏∀๏ )ﾉ']
  const kaomoji = _.sample(kaomojis)
  const message = `${kaomoji}\n\nHere's a space to explore this twitter thread,\n\n${spaceUrl}\n\n(p.s. anyone can use this to make their own space – no sign up required)`
  if (process.env.NODE_ENV === 'production') {
    const reply = await tweetClient.v1.reply(message, tweet.id)
    const url = tweetUrl(reply.in_reply_to_screen_name, reply.id)
    console.log('💌 replied', reply, url)
  } else {
    console.log('✉️ preflight reply', message)
  }
}

const handleTweet = async (data) => {
  data.includes.users.forEach(user => {
    console.log('🐶',user)
  })
  const username = data.includes.users[0].username
  const tweet = data.data
  const rule = data.matching_rules[0].tag
  const isSave = (rule === 'mention') && tweet.text.includes('save')
  console.log('💁‍♀️', tweet, username, rule, isSave)
  if (isSave) {
    replyWithSaveMessage(tweet)
  } else {
    const url = tweetUrl(username, tweet.id)
    // TODO post to discord
    // defer to next version, pending noise becoming an issue
    console.log('💐 TODO post to discord', username, tweet, url)
  }
}

const listen = async () => {
  steamClient = new TwitterApi(process.env.TWITTER_API_BEARER_TOKEN)
  console.log('🌸 server is listening to stream')
  await clearRules()
  await addRules()
  try {
    const stream = await steamClient.v2.searchStream({ expansions: ['author_id'], 'user.fields': ['username'] })
    stream.on(
      ETwitterStreamEvent.Data,
      eventData => {
        handleTweet(eventData)
      },
    )
    stream.autoReconnect = true
  } catch (error) {
    console.error('🚒', error)
  }
}

listen()
