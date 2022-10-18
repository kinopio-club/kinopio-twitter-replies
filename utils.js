import _ from 'lodash'

export default {

  // kinopio

  apiHost () {
    if (process.env.NODE_ENV === 'production') {
      return 'https://api.kinopio.club'
    } else {
      return 'http://kinopio.local:3000'
    }
  },
  async kinopioUser (username) {
    const apiHost = this.apiHost()
    const url = `${apiHost}/user/by-twitter-username/${username}`
    const user = await fetch(url)
    console.log('🍅🍅🍅🍅 TEMP',url, user)
    return user
  },
  async createTweetsSpace (tweet, kinopioUser) {

    // ﻿author_id: '1580586621719674880',
    // ﻿edit_history_tweet_ids: [ '1582032020099985409' ],
    // ﻿id: '1582032020099985409',
    // ﻿text: '@WholesomeMeme @KinopioClub save'

    const apiHost = this.apiHost()

    // POST to api /space w process.env.KINOPIO_TWITTER_REPLIES_SECRET

    // return space
  },

  // twitter

  tweetUrl ({ tweetId, username }) {
    username = username || clientUserName
    return `https://twitter.com/${username}/status/${tweetId}`
  },
  replyMessageSuccess (username) {
    // const tweet = data.data
    // const spaceUrl = `https://kinopio.club/twitter-thread/${tweet.id}`
    const kaomojis = ['ヾ(＾∇＾)', '(^-^*)/', '( ﾟ▽ﾟ)/', '( ^_^)／', '(^o^)/', '(^ _ ^)/', '( ´ ▽ ` )ﾉ', '(ﾉ´∀｀*)ﾉ', 'ヾ(´･ω･｀)', '☆ﾐ(o*･ω･)ﾉ', '＼(＾▽＾*)', '(*＾▽＾)／', '(￣▽￣)ノ', 'ヾ(-_-;)', 'ヾ( ‘ – ‘*)', 'ヾ(＠⌒ー⌒＠)ノ', '~ヾ ＾∇＾', '~ヾ(＾∇＾)', '＼(￣O￣)', '(｡･ω･)ﾉﾞ', '(*^･ｪ･)ﾉ', '(￣∠ ￣ )ﾉ', '(*￣Ｏ￣)ノ', 'ヾ(｡´･_●･`｡)☆', '(/・0・)', '(ノ^∇^)', '(,, ･∀･)ﾉ゛', '(。･д･)ﾉﾞ', '＼(°o°；）', '(｡´∀｀)ﾉ', '(o´ω`o)ﾉ', '( ･ω･)ﾉ', '(。^_・)ノ', '( ・_・)ノ', '＼(-o- )', '(。-ω-)ﾉ', '＼(-_- )', '＼( ･_･)', 'ヾ(´￢｀)ﾉ', 'ヾ(☆▽☆)', '(^ Q ^)/゛', '~(＾◇^)/', 'ヘ(‘◇’、)/', 'ヘ(°◇、°)ノ', 'ヘ(°￢°)ノ', 'ヘ(゜Д、゜)ノ', '（ ゜ρ゜)ノ', 'ー( ´ ▽ ` )ﾉ', 'ヽ(๏∀๏ )ﾉ']
    const kaomoji = _.sample(kaomojis)
    const message = `@${username} ${kaomoji}\n\nHere's a space to explore this twitter thread,\n\n(p.s. anyone can use this to make their own space – no sign up required)`
    // [a new space for] this thread was saved to kinopio for you,
    // as 'spacename'
      // [threadname] was added to your kinopio spaces, [for this thread]
    return message
  },
  replyMessageError (username) {
    const message = `@${username} (シ_ _)シ could not save thread, \n\n please connect your twitter account to kinopio through Share → Import → Twitter`
  },
}
