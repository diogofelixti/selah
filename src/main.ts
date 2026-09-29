import { mount } from 'svelte'
import '@fontsource-variable/lora'
import '@fontsource-variable/lora/wght-italic.css'
import '@fontsource-variable/source-sans-3'
import './styles/tokens.css'
import './styles/themes/aurora.css'
import './styles/themes/noite.css'
import './styles/themes/pergaminho.css'
import './styles/themes/oliveira.css'
import './styles/global.css'
import App from './App.svelte'
import { listenInstall } from './lib/install.svelte'

// Cedo: o convite de instalação do navegador pode chegar antes de a tela de Ajustes abrir.
listenInstall()

mount(App, { target: document.getElementById('app')! })
