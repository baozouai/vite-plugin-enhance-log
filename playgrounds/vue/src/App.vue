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

function onLogMulLine() {
  const b = true
  const c = null
  const e = {
    a: 1,
    b: 2,
    d: false,
    f: 2,
    w: {
      c: 1,
    },
  }

  console.log(
    1,
    2,
    3,
    4,
    5,
    10000000000000,
    'string',
    null,
    undefined,
    a,
    b,
    e,
    e.w,
    e.w.c,
  )
}
</script>

<template>
  <div>
    <button @click="onClick">
      click to log
    </button>

    <button @click="onLogMulLine">
      log multi line
    </button>
  </div>
</template>

<style>
button {
  color: red;
}
</style>
