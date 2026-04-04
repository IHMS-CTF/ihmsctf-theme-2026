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

<nav class="sticky top-0 z-10 border-b border-slate-200/70 bg-white/85 backdrop-blur">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
    <button
      type="button"
      class="text-lg font-semibold tracking-tight text-slate-900"
      on:click={navigateHome}
    >
      ihmsctf
    </button>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
      {#each navItems as item}
        <button
          type="button"
          on:click={() => onNavigate(item.key)}
          class={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            activeView === item.key
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          {item.label}
        </button>
      {/each}
      </div>

      <button
        type="button"
        on:click={handleAuthAction}
        class={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          state.isLoggedIn
            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {state.isLoggedIn ? 'Logout' : 'Login'}
      </button>
    </div>
  </div>
</nav>
