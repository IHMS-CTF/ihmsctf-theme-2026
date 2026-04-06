import type { Component } from 'svelte'

import HomeView from '$lib/views/HomeView.svelte'
import ScoreboardView from '$lib/views/ScoreboardView.svelte'
import Challenges from '$lib/views/Challenges.svelte'
import LoginView from '$lib/views/LoginView.svelte'

export type ViewConfig = {
  key: string
  label: string
  component: Component
  requiresAuth?: boolean
}

export const views: ViewConfig[] = [
  { key: 'home', label: 'Home', component: HomeView, requiresAuth: false },
  { key: 'scoreboard', label: 'Scoreboard', component: ScoreboardView, requiresAuth: false },
  { key: 'challenges', label: 'Challenges', component: Challenges, requiresAuth: true },
  { key: 'login', label: 'Login', component: LoginView, requiresAuth: false },
]

export const defaultView = 'home'

export const getViewByKey = (key: string): ViewConfig | undefined => {
  return views.find((view) => view.key === key)
}

export const publicViews = views.filter((v) => !v.requiresAuth).map((v) => v.key)
export const protectedViews = views.filter((v) => v.requiresAuth).map((v) => v.key)
