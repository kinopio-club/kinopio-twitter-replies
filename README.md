# Kinopio Twitter Replies

Processes tweets that mention @kinopioClub in real-time

## Why this is a Micro-Service

- Self-contained: this app doesn't need to interact with `kinopio-server` or the `kinopio-client`
- Easier logging

# Install

copy `.env.sample` to `.env` and update with your twitter auth
> Make sure you only use auth tokens from `kinopio-twitter-dev`, otherwise you might break production

    npm install

# One-Time Auth

Follow the steps in `index.js` to allow tweeting

    http://localhost:8060/sign-in
    http://localhost:8060/sign-in-complete

# Run

    npm run serve
    http://localhost:8060
