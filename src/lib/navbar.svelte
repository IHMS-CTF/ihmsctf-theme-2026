<script lang="ts">
  import { logout, state } from '$lib/ctfd.svelte'

  export let items: Array<{ key: string; label: string }> = []
  export let activeView = ''
  export let onNavigate: (view: string) => void = () => {}

  const loginViewKey = 'login'

  $: navItems = items.filter((item) => item.key !== loginViewKey)

  const navigateHome = () => {
    if (items.length > 0) {
      onNavigate(items[0].key)
    }
  }

  const handleAuthAction = async () => {
    if (state.isLoggedIn) {
      await logout()
      onNavigate('home')
      return
    }

    onNavigate(loginViewKey)
  }
</script>

<nav class="sticky top-0 z-10 border-b border-slate-700/80 bg-slate-950/80 backdrop-blur">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
    <button
      type="button"
      class="text-lg font-semibold tracking-tight text-slate-100 transition-colors hover:text-slate-300"
      onclick={navigateHome}
    >
      ihmsctf
    </button>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 p-1">
      {#each navItems as item}
        <button
          type="button"
          onclick={() => onNavigate(item.key)}
          class={`rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
            activeView === item.key
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          {item.label}
        </button>
      {/each}
      </div>

      <button
        type="button"
        onclick={handleAuthAction}
        class={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
          state.isLoggedIn
            ? 'bg-rose-900/60 text-rose-200 hover:bg-rose-800/70'
            : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
      >
        {state.isLoggedIn ? 'Logout' : 'Login'}
      </button>
    </div>
  </div>
</nav>
