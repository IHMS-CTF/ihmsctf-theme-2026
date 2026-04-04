import type { Component } from 'svelte'

import HomeView from '$lib/views/HomeView.svelte'
import AboutView from '$lib/views/AboutView.svelte'
import ContactView from '$lib/views/ContactView.svelte'
import LoginView from "$lib/views/LoginView.svelte";

export type ViewConfig = {
  key: string
  label: string
  component: Component
}

export const views: ViewConfig[] = [
  { key: 'home', label: 'Home', component: HomeView },
  { key: 'scoreboard', label: 'Scoreboard', component: AboutView },
  { key: 'challenges', label: 'Challenges', component: ContactView },
  { key: 'login', label: 'Login', component: LoginView },
]

export const defaultView = views[0]?.key ?? ''

export const getViewByKey = (key: string): ViewConfig | undefined => {
  return views.find((view) => view.key === key)
}
