<script lang="ts">
  import { onMount } from 'svelte'
  import Navbar from '$lib/navbar.svelte'
  import { defaultView, getViewByKey, views } from '$lib/views'

  const readViewFromHash = () => {
    if (typeof window === 'undefined') {
      return defaultView
    }

    const key = window.location.hash.replace(/^#\/?/, '')
    return getViewByKey(key) ? key : defaultView
  }

  const navigateToView = (view: string) => {
    const nextView = getViewByKey(view) ? view : defaultView

    activeView = nextView

    if (typeof window !== 'undefined') {
      const nextHash = `#/${nextView}`

      if (window.location.hash !== nextHash) {
        window.location.hash = nextHash
      }
    }
  }

  let activeView = readViewFromHash()

  onMount(() => {
    const syncActiveView = () => {
      activeView = readViewFromHash()
    }

    syncActiveView()

    if (!window.location.hash) {
      window.location.hash = `#/${activeView}`
    }

    window.addEventListener('hashchange', syncActiveView)

    return () => {
      window.removeEventListener('hashchange', syncActiveView)
    }
  })

  $: activeViewConfig = getViewByKey(activeView) ?? views[0]
</script>

<div class="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-100 text-slate-900">
  <Navbar items={views} activeView={activeView} onNavigate={navigateToView} />

  <main class="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    {#if activeViewConfig}
      <svelte:component this={activeViewConfig.component} />
    {/if}
  </main>
</div>
