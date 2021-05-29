<template>
  <div id="blockrain" style="width: 400px; height: 800px;"></div>
</template>

<script lang="js">
import { defineComponent, onMounted } from 'vue'

import $ from 'jquery'
window.jQuery = $

require('../blockrain/blockrain.jquery.libs.js')
require('../blockrain/blockrain.jquery.src.js')
require('../blockrain/blockrain.jquery.themes.js')
import '../blockrain/blockrain.css'

export default defineComponent({
  setup() {
    onMounted(() => {
      const game = $('#blockrain').blockrain({
        onRender: function(ctx) {
        },
        onLine: function(lines, scoreIncrement, score) {
          console.log(lines)
        }
      })
    })
  }
})

</script>