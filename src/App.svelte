<script lang="ts">
  import { onMount } from 'svelte'
  import NavDock from '$lib/components/NavDock.svelte'
  import { defaultView, getViewByKey, views, type ViewConfig } from '$lib/views'
  import { state as authState, init as initCtfd } from '$lib/ctfd.svelte'

  // Read view from URL hash
  const readViewFromHash = (): string => {
    if (typeof window === 'undefined') return defaultView
    const key = window.location.hash.replace(/^#\/?/, '')
    return getViewByKey(key) ? key : defaultView
  }

  // Navigate to a specific view
  const navigateToView = (view: string) => {
    const viewConfig = getViewByKey(view)
    if (!viewConfig) {
      activeView = defaultView
      updateHash(defaultView)
      return
    }

    // Auth guard: redirect to login if protected view and not logged in
    if (viewConfig.requiresAuth && !authState.isLoggedIn) {
      activeView = 'login'
      pendingRedirect = view // Store where they wanted to go
      updateHash('login')
      return
    }

    activeView = view
    updateHash(view)
  }

  const updateHash = (view: string) => {
    if (typeof window !== 'undefined') {
      const nextHash = `#/${view}`
      if (window.location.hash !== nextHash) {
        window.location.hash = nextHash
      }
    }
  }

  let activeView = $state(readViewFromHash())
  let pendingRedirect = $state<string | null>(null)
  let isInitialized = $state(false)

  // Get the current view config (derived from activeView)
  let activeViewConfig = $derived(getViewByKey(activeView) ?? views[0])

  // Handle successful login - redirect to pending view
  $effect(() => {
    if (authState.isLoggedIn && pendingRedirect) {
      const redirect = pendingRedirect
      pendingRedirect = null
      navigateToView(redirect)
    }
  })

  onMount(async () => {
    // Initialize CTFd API
    await initCtfd()
    
    const syncActiveView = () => {
      const hashView = readViewFromHash()
      const viewConfig = getViewByKey(hashView)
      
      // Auth guard on hash change
      if (viewConfig?.requiresAuth && !authState.isLoggedIn) {
        activeView = 'login'
        pendingRedirect = hashView
        updateHash('login')
        return
      }
      
      activeView = hashView
    }

    syncActiveView()

    if (!window.location.hash) {
      updateHash(activeView)
    }

    window.addEventListener('hashchange', syncActiveView)
    
    isInitialized = true
    
    return () => {
      window.removeEventListener('hashchange', syncActiveView)
    }
  })
</script>

<div class="app-shell" class:initialized={isInitialized}>
  <!-- Scanline overlay effect -->
  <div class="scanline-overlay"></div>
  
  <!-- Navigation Dock -->
  <NavDock 
    items={views} 
    {activeView} 
    onNavigate={navigateToView} 
  />
  
  <!-- Main Content Area -->
  <main class="main-content">
    {#if activeViewConfig}
      {#key activeView}
        {@const ViewComponent = activeViewConfig.component}
        <div class="view-container animate-fade-in-up">
          <ViewComponent />
        </div>
      {/key}
    {/if}
  </main>
  
  <!-- Status bar at bottom -->
  <footer class="status-bar">
    <div class="status-item">
      <span class="status-label">SYS</span>
      <span class="status-value">ONLINE</span>
    </div>
    <div class="status-item">
      <span class="status-label">VIEW</span>
      <span class="status-value">{activeView.toUpperCase()}</span>
    </div>
    <div class="status-item">
      <span class="status-label">AUTH</span>
      <span class="status-value" class:active={authState.isLoggedIn}>
        {authState.isLoggedIn ? 'ACTIVE' : 'NONE'}
      </span>
    </div>
    <div class="status-spacer"></div>
    <div class="status-item">
      <span class="status-label">IHMSCTF</span>
      <span class="status-value">2026</span>
    </div>
  </footer>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    min-height: 100dvh;
    background: var(--color-void);
    position: relative;
    overflow-x: hidden;
  }
  
  .app-shell::before {
    content: '';
    position: fixed;
    inset: 0;
    background: 
      radial-gradient(ellipse at 20% 30%, rgba(0, 255, 65, 0.03) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(0, 212, 255, 0.02) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  
  /* Scanline effect */
  .scanline-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9998;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    );
    opacity: 0.5;
  }
  
  /* Main content area */
  .main-content {
    position: relative;
    padding-left: 64px; /* Nav dock width */
    padding-bottom: 32px; /* Status bar height */
    min-height: 100vh;
    min-height: 100dvh;
  }
  
  .view-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-xl) var(--space-lg);
  }
  
  /* Status bar */
  .status-bar {
    position: fixed;
    bottom: 0;
    left: 64px;
    right: 0;
    height: 28px;
    background: rgba(4, 13, 8, 0.95);
    border-top: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    padding: 0 var(--space-lg);
    gap: var(--space-xl);
    z-index: var(--z-nav);
    font-family: var(--font-mono);
    backdrop-filter: blur(8px);
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  
  .status-label {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }
  
  .status-value {
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--text-tertiary);
  }
  
  .status-value.active {
    color: var(--color-terminal);
  }
  
  .status-spacer {
    flex: 1;
  }
  
  /* Animation */
  .animate-fade-in-up {
    animation: fade-in-up 0.4s ease forwards;
  }
  
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .main-content {
      padding-left: 0;
      padding-bottom: 96px; /* Mobile nav + status bar */
    }
    
    .view-container {
      padding: var(--space-lg) var(--space-md);
    }
    
    .status-bar {
      left: 0;
      bottom: 64px; /* Above mobile nav */
    }
  }
</style>
