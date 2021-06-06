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

const downScaleFactor = 16
const dropedFrames = 20
const canvasWidth = 300
const canvasHeight = 600

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

  const game = $('#blockrain')

  // Set canvas dimensions
  game.attr('style', `width: ${canvasWidth}px; height: ${canvasHeight}px;`)

  let renders = 0
  game.blockrain({
    theme: 'candy',
    onLine: (lines: number, scoreIncrement: number, score: number) => {
      console.log('line', lines)
    },
    onGameOver: (score: number) => {
      console.log('gameover', score)
    },
    onRender: (ctx: CanvasRenderingContext2D) => {
      renders++
      if (renders === dropedFrames) {
        sendCanvas(room, ctx)
        renders = 0
      }
    },
  })

  game.blockrain('start')


  room.state.players.forEach(player => {
    if (room.sessionId !== player.sessionId) {
      // This executes for everyone but yourself

      // player.onChange = (changes) => {
      //   changes.forEach(change => {
      //     console.log(player.username, change.field, change.value)
      //   })
      // }

      // Add html layout for every player 
      $('#game').append(`
      <div class="player">
        <div>${player.username}</div>
        <canvas id="${player.sessionId}"></canvas>
      </div>
      `)
    }
  })
}

function sendCanvas(room: Colyseus.Room, ctx: CanvasRenderingContext2D) {
  let originalImage = Array.from(ctx.getImageData(0, 0, canvasWidth, canvasHeight).data)
  console.log('org', originalImage.length)

  /*
  Downscale image data
    Loop runs for every (downScaleFactor)th item in array (every 2nd pixel)
    Calculates average of R, G and B
    Pushes B&W value into new array
  */
  let compressedImage: number[] = []
  for (let i = 0; i < originalImage.length; i = i+4*downScaleFactor) {
    const R = originalImage[i]
    const G = originalImage[i+1]
    const B = originalImage[i+2]

    const BW = Math.floor((R+G+B) / 3)

    compressedImage.push(BW)
  }

  console.log('comp', compressedImage.length)

  room.send('canvas', JSON.stringify(compressedImage))

  // Free memory (prob. useless?)
  originalImage = []
  compressedImage = []
}
