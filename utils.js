import _ from 'lodash'
import fetch from 'node-fetch'
const { Headers } = fetch

export default {

  // kinopio

  apiHost () {
    if (process.env.NODE_ENV === 'production') {
      return 'https://api.kinopio.club'
    } else {
      return 'http://kinopio.local:3000'
    }
  },
  async kinopioUser (twitterUsername) {
    const apiHost = this.apiHost()
    const url = `${apiHost}/user/by-twitter-username/${twitterUsername}`
    const response = await fetch(url)
    const user = await response.json()
    console.log('🍅 username → kinopio user', twitterUsername, user)
    return user
  },
  async createTweetsSpace (data, kinopioUser) {
    const tweet = data.data
    const originalAuthorTwitterUsername = data.includes.users[1].username
    // ﻿author_id: '1580586621719674880',
    // ﻿edit_history_tweet_ids: [ '1582032020099985409' ],
    // ﻿id: '1582032020099985409',
    // ﻿text: '@WholesomeMeme @KinopioClub save'
    console.log('🌷🌷🌷🌷🌷🌷 start createTweetsSpace', tweet, originalAuthorTwitterUsername)
    const apiHost = this.apiHost()
    const url = `${apiHost}/space/tweet`
    const body = {
      secret: process.env.KINOPIO_TWITTER_REPLIES_SECRET,
      kinopioUserId: kinopioUser.id,
      tweetId: tweet.id
    }
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(body)
    })
    const space = await response.json()

    console.log('🔮🔮🔮🔮🔮 end createTweetsSpace',space)
    return space
  },

  // twitter

  tweetUrl ({ tweetId, username }) {
    username = username
    return `https://twitter.com/${username}/status/${tweetId}`
  },
  replyMessageSuccess (username) {
    const kaomojis = ['ヾ(＾∇＾)', '(^-^*)/', '( ﾟ▽ﾟ)/', '( ^_^)／', '(^o^)/', '(^ _ ^)/', '( ´ ▽ ` )ﾉ', '(ﾉ´∀｀*)ﾉ', 'ヾ(´･ω･｀)', '☆ﾐ(o*･ω･)ﾉ', '＼(＾▽＾*)', '(*＾▽＾)／', '(￣▽￣)ノ', 'ヾ(-_-;)', 'ヾ( ‘ – ‘*)', 'ヾ(＠⌒ー⌒＠)ノ', '~ヾ ＾∇＾', '~ヾ(＾∇＾)', '＼(￣O￣)', '(｡･ω･)ﾉﾞ', '(*^･ｪ･)ﾉ', '(￣∠ ￣ )ﾉ', '(*￣Ｏ￣)ノ', 'ヾ(｡´･_●･`｡)☆', '(/・0・)', '(ノ^∇^)', '(,, ･∀･)ﾉ゛', '(。･д･)ﾉﾞ', '＼(°o°；）', '(｡´∀｀)ﾉ', '( ･ω･)ﾉ', '(。^_・)ノ', '( ・_・)ノ', '＼(-o- )', '(。-ω-)ﾉ', '＼(-_- )', '＼( ･_･)', 'ヾ(´￢｀)ﾉ', 'ヾ(☆▽☆)', '(^ Q ^)/゛', '~(＾◇^)/', 'ヘ(‘◇’、)/']
    const kaomoji = _.sample(kaomojis)
    const message = `@${username} ${kaomoji} Saved to your spaces`
    return message
  },
  replyMessageError (username) {
    const message = `@${username} (シ_ _)シ could not save thread, \n\n please connect your twitter account to kinopio through User → Settings → Connect to Twitter`
    return message
  },
}
