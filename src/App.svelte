<script lang="ts">
  import Navbar from '$lib/navbar.svelte'
  import { defaultView, getViewByKey, views } from '$lib/views'

  let activeView = defaultView

  $: activeViewConfig = getViewByKey(activeView) ?? views[0]
</script>

<div class="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-100 text-slate-900">
  <Navbar items={views} activeView={activeView} onNavigate={(view) => (activeView = view)} />

  <main class="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    {#if activeViewConfig}
      <svelte:component this={activeViewConfig.component} />
    {/if}
  </main>
</div>
