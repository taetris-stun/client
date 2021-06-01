declare global { interface Window { jQuery: any; } }
import $ from 'jquery'
window.jQuery = $

import * as Colyseus from 'colyseus.js'

// require('./blockrain/blockrain.jquery.libs.js')
// require('./blockrain/blockrain.jquery.src.js')
// require('./blockrain/blockrain.jquery.themes.js')
// require('./blockrain/blockrain.css')

$('#submit').on('click', () => {
  let endpoint = $('#endpoint').val()
  let username = $('#username').val()
  let shocker = $('#shocker').val()

  if (
    typeof(endpoint) === 'string' &&
    typeof(username) === 'string' &&
    typeof(shocker) === 'string'
  ) {
    connect(endpoint as string, username as string, shocker as string)
      .then(room => {
        handleRoom(room)
      })
      .catch(e => {
        console.error('Join error', e)
      })
  }
})

function connect(endpoint: string, username: string, shocker: string) {
  const client = new Colyseus.Client(endpoint)
  return client.joinOrCreate('GameRoom', {username, shocker})
}

function handleRoom(room: Colyseus.Room) {
  console.log(room.sessionId, 'joined', room.id)
}