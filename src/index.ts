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

const scaleFactor = 4
const dropedFrames = 3
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
  // Setup playing fields
  room.state.players.forEach(player => {

    // Differenciate between you and others
    if (
      room.sessionId === player.sessionId 
      && player.username !== 'spectator'
    ) {
      setupLocalPlayer(room, player)
    }

    if (
      room.sessionId !== player.sessionId
      && !isMobile()
    ) {
      setupNetworkPlayer(room, player)
    }
    
  })

  // TODO: Throw error on mobile spectator (currently: empty screen)

  // Change view after DOM is populated
  $('#config').hide()
  $('#ready').hide()
  $('#game').show()

  // To reset the client => reload the page
  room.onMessage('reset', () => {
    window.location.reload()
  })
}

function sendCanvas(room: Colyseus.Room, ctx: CanvasRenderingContext2D) {
  /*
  Downscale image data
    Loop runs for every (downScaleFactor)th item in array (every 2nd pixel)
    Calculates average of R, G and B
    Pushes B&W value into new array
  */

  const originalImage = Array.from(ctx.getImageData(0, 0, canvasWidth, canvasHeight).data)
  const compressedImage: number[] = []

  for (let i = 0; i < originalImage.length; i = i+4*scaleFactor) {
    const R = originalImage[i]
    const G = originalImage[i+1]
    const B = originalImage[i+2]
    const BW = Math.floor((R+G+B) / 3)

    compressedImage.push(BW)
  }

  room.send('canvas', JSON.stringify(compressedImage))
}

function receiveCanvas(sessionId: string, data: string) {
  /*
    Upscale image data
    Reverse the compression back to full scale
  */

  const originalImage: number[] = []
  const compressedImage = JSON.parse(data) as Array<number>

  for (let i1 = 0; i1 < compressedImage.length; i1++) {
    for (let i2 = 0; i2 < scaleFactor; i2++) {
      originalImage.push(compressedImage[i1]) // R
      originalImage.push(compressedImage[i1]) // G
      originalImage.push(compressedImage[i1]) // B
      originalImage.push(255) // A
    }
  }

  const imageData = new ImageData(Uint8ClampedArray.from(originalImage), canvasWidth, canvasHeight)
  const canvas = $('#' + sessionId + '-canvas')[0] as HTMLCanvasElement
  const ctx = canvas.getContext('2d')
  ctx.putImageData(imageData, 0, 0)
}

function isMobile(): boolean {
  if (
    navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
  ) {
    return true
  } else {
    return false
  }
}

function setupLocalPlayer(room: Colyseus.Room, player: any) {
  // Create html layout for local player
  $('#game').append(`
  <div class="player" id="${player.sessionId}-player">
    <div class="username" id="${player.sessionId}-username"></div>
    <div class="canvas" id="${player.sessionId}-canvas" style="width: ${canvasWidth}px; height: ${canvasHeight}px;"></div>
  </div>
  `)

  // Set username in layout
  $('#' + player.sessionId + '-username').text(player.username)

  // Setup blockrain
  const canvas = $('#' + player.sessionId + '-canvas')

  let renderCount = 0
  canvas.blockrain({
    theme: 'candy',
    onLine: (lines: number, scoreIncrement: number, score: number) => {
      room.send('line', lines)
    },
    onGameOver: (score: number) => {
      room.send('gameover', score)
    },
    onRender: (ctx: CanvasRenderingContext2D) => {
      renderCount++
      if (renderCount === dropedFrames) {
        sendCanvas(room, ctx)
        renderCount = 0
      }
    },
  })

  // Enable the touch UI if mobile user agent is detected
  if (isMobile()) {
    canvas.blockrain('touchControls', true)
  }

  canvas.blockrain('start')
}

function setupNetworkPlayer(room: Colyseus.Room, player: any) {
  // Create html layout for other players
  $('#game').append(`
    <div class="player" id="${player.sessionId}-player">
      <div class="username" id="${player.sessionId}-username"></div>
      <canvas class="canvas" id="${player.sessionId}-canvas" width="${canvasWidth}" height="${canvasHeight}"></canvas>
    </div>
  `)

  // Set username in layout
  $('#' + player.sessionId + '-username').text(player.username)

  // Handle state updates
  player.onChange = (changes) => {
    changes.forEach(change => {
      switch (change.field) {
        case 'canvas': receiveCanvas(player.sessionId, change.value)
        default: void(0)
      }
    })
  }
}