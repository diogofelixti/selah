import { mount } from 'svelte'
import '@fontsource-variable/inter'
import '@fontsource-variable/literata'
import './styles/tokens.css'
import './styles/themes/aurora.css'
import './styles/global.css'
import App from './App.svelte'

mount(App, { target: document.getElementById('app')! })
