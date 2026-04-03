<script lang="ts">
  export let items: Array<{ key: string; label: string }> = []
  export let activeView = ''
  export let onNavigate: (view: string) => void = () => {}

  const navigateHome = () => {
    if (items.length > 0) {
      onNavigate(items[0].key)
    }
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

    <div class="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
      {#each items as item}
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
  </div>
</nav>
