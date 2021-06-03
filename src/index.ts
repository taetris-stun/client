declare global {
  interface Window { jQuery: any; } 
  interface JQuery { blockrain: Function }
}

import $ from 'jquery'
window.jQuery = $

import * as Colyseus from 'colyseus.js'
import Swal from 'sweetalert2'

require('./blockrain/blockrain.jquery.libs.js')
require('./blockrain/blockrain.jquery.src.js')
require('./blockrain/blockrain.jquery.themes.js')
require('./blockrain/blockrain.css')

// Show config
// $('#config').show()
// $('#ready').hide()
// $('#game').hide()

// Show ready check
// $('#config').hide()
// $('#ready').show()
// $('#game').hide()

// Show game
// $('#config').hide()
// $('#ready').hide()
// $('#game').show()

setupConfig()

function setupConfig() {
  // Change view (already set in markup)
  // $('#config').show()
  // $('#ready').hide()
  // $('#game').hide()

  // When config is submitted
  $('#submit').on('click', () => {
    let endpoint = $('#endpoint').val()
    let username = $('#username').val()
    let shocker = $('#shocker').val()
  
    if (
      endpoint &&
      username &&
      shocker &&
      typeof(endpoint) === 'string' &&
      typeof(username) === 'string' &&
      typeof(shocker) === 'string'
    ) {
      console.log('[taetris-stun] Trying to connect')
  
      const client = new Colyseus.Client(endpoint)
      client.join('GameRoom', { username, shocker })
        .then(room => {
          console.log('[taetris-stun] Connected as ' + room.sessionId)
          setupReadyCheck(room)
        })
        .catch(e => {
          console.error('Join error', e)
          Swal.fire('Join error', JSON.stringify(e), 'error')
        })
    }
  })
}

function setupReadyCheck(room: Colyseus.Room) {
  // Change view
  $('#config').hide()
  $('#ready').show()
  $('#game').hide()

  // Setup ready button
  $('#ready').on('click', () => {
    room.send('ready')

    // Tell server that you are ready
    $('#ready')
      .text('waiting for others..')
      .addClass('clicked')
      .off('click') // this prevents sending ready twice
  })

  // When everyone is ready
  room.onMessage('start', () =>{
    setupGame(room)
  })
}

function setupGame(room: Colyseus.Room) {
  // Change view
  $('#config').hide()
  $('#ready').hide()
  $('#game').show()

  // TODO:  - setup blockrain
  //        - blockrain callbacks to server
  //        - process canvas data
  //        - transmit canvas data to server
  //        - html layout for local game and streamed-in games

}