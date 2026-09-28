import { mount } from 'svelte'
import '@fontsource-variable/lora'
import '@fontsource-variable/lora/wght-italic.css'
import '@fontsource-variable/source-sans-3'
import './styles/tokens.css'
import './styles/themes/aurora.css'
import './styles/global.css'
import App from './App.svelte'

mount(App, { target: document.getElementById('app')! })
