import _ from 'lodash'

export default {

  tweetUrl ({ tweetId, username }) {
    username = username || clientUserName
    return `https://twitter.com/${username}/status/${tweetId}`
  },

  replyMessageSuccess (data) {
    // const tweet = data.data
    const username = data.includes.users[0].username
    // const spaceUrl = `https://kinopio.club/twitter-thread/${tweet.id}`
    const kaomojis = ['ヾ(＾∇＾)', '(^-^*)/', '( ﾟ▽ﾟ)/', '( ^_^)／', '(^o^)/', '(^ _ ^)/', '( ´ ▽ ` )ﾉ', '(ﾉ´∀｀*)ﾉ', 'ヾ(´･ω･｀)', '☆ﾐ(o*･ω･)ﾉ', '＼(＾▽＾*)', '(*＾▽＾)／', '(￣▽￣)ノ', 'ヾ(-_-;)', 'ヾ( ‘ – ‘*)', 'ヾ(＠⌒ー⌒＠)ノ', '~ヾ ＾∇＾', '~ヾ(＾∇＾)', '＼(￣O￣)', '(｡･ω･)ﾉﾞ', '(*^･ｪ･)ﾉ', '(￣∠ ￣ )ﾉ', '(*￣Ｏ￣)ノ', 'ヾ(｡´･_●･`｡)☆', '(/・0・)', '(ノ^∇^)', '(,, ･∀･)ﾉ゛', '(。･д･)ﾉﾞ', '＼(°o°；）', '(｡´∀｀)ﾉ', '(o´ω`o)ﾉ', '( ･ω･)ﾉ', '(。^_・)ノ', '( ・_・)ノ', '＼(-o- )', '(。-ω-)ﾉ', '＼(-_- )', '＼( ･_･)', 'ヾ(´￢｀)ﾉ', 'ヾ(☆▽☆)', '(^ Q ^)/゛', '~(＾◇^)/', 'ヘ(‘◇’、)/', 'ヘ(°◇、°)ノ', 'ヘ(°￢°)ノ', 'ヘ(゜Д、゜)ノ', '（ ゜ρ゜)ノ', 'ー( ´ ▽ ` )ﾉ', 'ヽ(๏∀๏ )ﾉ']
    const kaomoji = _.sample(kaomojis)
    const message = `@${username} ${kaomoji}\n\nHere's a space to explore this twitter thread,\n\n(p.s. anyone can use this to make their own space – no sign up required)`
    // [a new space for] this thread was saved to kinopio for you,
    // as 'spacename'
      // [threadname] was added to your kinopio spaces, [for this thread]
    return message
  },
  replyMessageError (data) {
    const username = data.includes.users[0].username
    const message = `@${username} (シ_ _)シ could not save thread, \n\n please connect your twitter account to kinopio through Share → Import → Twitter`
  }
}
