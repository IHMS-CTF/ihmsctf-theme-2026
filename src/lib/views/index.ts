import type { Component } from 'svelte'

import HomeView from '$lib/views/HomeView.svelte'
import AboutView from '$lib/views/AboutView.svelte'
import ContactView from '$lib/views/ContactView.svelte'

export type ViewConfig = {
  key: string
  label: string
  component: Component
}

export const views: ViewConfig[] = [
  { key: 'home', label: 'Home', component: HomeView },
  { key: 'about', label: 'About', component: AboutView },
  { key: 'contact', label: 'Contact', component: ContactView },
]

export const defaultView = views[0]?.key ?? ''

export const getViewByKey = (key: string): ViewConfig | undefined => {
  return views.find((view) => view.key === key)
}
