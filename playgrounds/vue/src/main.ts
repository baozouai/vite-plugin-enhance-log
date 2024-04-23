import { createApp } from 'vue'
import packageJson from '../package.json' assert { type: 'json' }
import App from './App.vue'
import './index.css'

console.log(packageJson)
const app = createApp(App)

app.mount('#app')

const theFileName = 'main.tsx'
const arg1 = 1
const arg2 = '123'
const arg3 = true
const arg4 = false
const arg5 = null
const arg6 = undefined
const arg7 = {
  arg1,
  arg2,
  argn: 'xjxjxj',
}

console.log(theFileName, arg1, arg2, arg3, arg4, arg5, arg6, arg7)
