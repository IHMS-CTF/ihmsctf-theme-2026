import { mount } from 'svelte'
import App from './App.svelte'
import './app.css'

// Remove loading state
const appEl = document.getElementById('app')!
appEl.classList.remove('app-loading')

const app = mount(App, {
  target: appEl,
})

export default app
