<script lang="ts" setup>
const a = 1
console.log(a)

function onClick() {
  const b = true
  const c = null
  const d = {
    a: 1,
    b: 2,
    d: false,
  }
  console.log(a, b, c, d)
}
</script>

<template>
  <div>
    <button @click="onClick">
      click to log
    </button>
  </div>
</template>
