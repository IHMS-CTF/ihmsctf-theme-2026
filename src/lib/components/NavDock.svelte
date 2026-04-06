<script lang="ts">
  import { logout, state as authState } from '$lib/ctfd.svelte'
  import { 
    Home, 
    Trophy, 
    Target, 
    LogIn, 
    LogOut, 
    Terminal,
    Shield,
    Zap
  } from 'lucide-svelte'
  
  interface Props {
    items?: Array<{ key: string; label: string }>
    activeView?: string
    onNavigate?: (view: string) => void
  }
  
  let { items = [], activeView = '', onNavigate = () => {} }: Props = $props()
  
  const loginViewKey = 'login'
  
  // Map view keys to icons
  const iconMap: Record<string, typeof Home> = {
    home: Home,
    scoreboard: Trophy,
    challenges: Target,
    login: LogIn,
  }
  
  let navItems = $derived(items.filter((item) => item.key !== loginViewKey))
  
  const handleAuthAction = async () => {
    if (authState.isLoggedIn) {
      await logout()
      onNavigate('home')
      return
    }
    onNavigate(loginViewKey)
  }
  
  let isExpanded = $state(false)
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null
  
  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    isExpanded = true
  }
  
  const handleMouseLeave = () => {
    hoverTimeout = setTimeout(() => {
      isExpanded = false
    }, 300)
  }
</script>

<!-- Sidebar Navigation Dock -->
<nav 
  class="nav-dock"
  class:expanded={isExpanded}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  aria-label="Main navigation"
>
  <!-- Logo / Brand -->
  <div class="nav-brand">
    <button 
      type="button"
      class="brand-icon"
      onclick={() => onNavigate('home')}
      aria-label="Go to home"
    >
      <Shield size={24} strokeWidth={1.5} />
    </button>
    <span class="brand-text">IHMS<span class="brand-accent">CTF</span></span>
  </div>
  
  <!-- Main Navigation Items -->
  <div class="nav-items">
    {#each navItems as item, i}
      {@const Icon = iconMap[item.key] || Terminal}
      {@const isActive = activeView === item.key}
      <button
        type="button"
        class="nav-item"
        class:active={isActive}
        onclick={() => onNavigate(item.key)}
        style="animation-delay: {50 + i * 30}ms"
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <span class="nav-icon">
          <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
        </span>
        <span class="nav-label">{item.label}</span>
        {#if isActive}
          <span class="nav-indicator"></span>
        {/if}
      </button>
    {/each}
  </div>
  
  <!-- Spacer -->
  <div class="nav-spacer"></div>
  
  <!-- Status indicator -->
  <div class="nav-status">
    <div class="status-icon" class:online={authState.isLoggedIn}>
      <Zap size={14} strokeWidth={2} />
    </div>
    <span class="status-text">
      {authState.isLoggedIn ? 'CONNECTED' : 'OFFLINE'}
    </span>
  </div>
  
  <!-- Auth Button -->
  <button
    type="button"
    class="nav-auth"
    class:logged-in={authState.isLoggedIn}
    onclick={handleAuthAction}
    aria-label={authState.isLoggedIn ? 'Logout' : 'Login'}
  >
    <span class="nav-icon">
      {#if authState.isLoggedIn}
        <LogOut size={20} strokeWidth={1.5} />
      {:else}
        <LogIn size={20} strokeWidth={1.5} />
      {/if}
    </span>
    <span class="nav-label">
      {authState.isLoggedIn ? 'Logout' : 'Login'}
    </span>
  </button>
</nav>

<!-- Mobile bottom bar -->
<nav class="mobile-nav" aria-label="Mobile navigation">
  {#each navItems as item}
    {@const Icon = iconMap[item.key] || Terminal}
    {@const isActive = activeView === item.key}
    <button
      type="button"
      class="mobile-nav-item"
      class:active={isActive}
      onclick={() => onNavigate(item.key)}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
      <span class="mobile-nav-label">{item.label}</span>
    </button>
  {/each}
  <button
    type="button"
    class="mobile-nav-item"
    class:active={activeView === 'login'}
    onclick={handleAuthAction}
    aria-label={authState.isLoggedIn ? 'Logout' : 'Login'}
  >
    {#if authState.isLoggedIn}
      <LogOut size={20} strokeWidth={1.5} />
    {:else}
      <LogIn size={20} strokeWidth={1.5} />
    {/if}
    <span class="mobile-nav-label">{authState.isLoggedIn ? 'Exit' : 'Login'}</span>
  </button>
</nav>

<style>
  /* Desktop Sidebar Dock */
  .nav-dock {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 64px;
    background: rgba(4, 13, 8, 0.95);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    padding: var(--space-md) var(--space-sm);
    gap: var(--space-sm);
    z-index: var(--z-nav);
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(12px);
  }
  
  .nav-dock.expanded {
    width: 200px;
  }
  
  /* Brand */
  .nav-brand {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm);
    margin-bottom: var(--space-md);
  }
  
  .brand-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-terminal-muted);
    border: 1px solid var(--color-terminal-dim);
    color: var(--color-terminal);
    cursor: pointer;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }
  
  .brand-icon:hover {
    background: var(--color-terminal);
    color: var(--color-void);
    box-shadow: 0 0 20px var(--color-terminal-glow);
  }
  
  .brand-text {
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--text-primary);
    opacity: 0;
    white-space: nowrap;
    transition: opacity 0.2s ease;
  }
  
  .nav-dock.expanded .brand-text {
    opacity: 1;
  }
  
  .brand-accent {
    color: var(--color-terminal);
  }
  
  /* Navigation Items */
  .nav-items {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-sm);
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all var(--transition-fast);
    overflow: hidden;
    text-align: left;
    animation: fade-in-up 0.3s ease forwards;
    opacity: 0;
  }
  
  .nav-item:hover {
    color: var(--text-primary);
    background: var(--color-surface);
  }
  
  .nav-item.active {
    color: var(--color-terminal);
    background: var(--color-terminal-muted);
  }
  
  .nav-icon {
    width: 40px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform var(--transition-fast);
  }
  
  .nav-item:hover .nav-icon {
    transform: scale(1.1);
  }
  
  .nav-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.2s ease;
  }
  
  .nav-dock.expanded .nav-label {
    opacity: 1;
    transform: translateX(0);
  }
  
  .nav-indicator {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    background: var(--color-terminal);
    box-shadow: 0 0 10px var(--color-terminal-glow);
  }
  
  /* Spacer */
  .nav-spacer {
    flex: 1;
  }
  
  /* Status */
  .nav-status {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-sm);
    border-top: 1px solid var(--color-border);
    margin-top: var(--space-sm);
  }
  
  .status-icon {
    width: 40px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-red);
    flex-shrink: 0;
  }
  
  .status-icon.online {
    color: var(--color-terminal);
    animation: pulse 2s ease-in-out infinite;
  }
  
  .status-text {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    opacity: 0;
    white-space: nowrap;
    transition: opacity 0.2s ease;
  }
  
  .nav-dock.expanded .status-text {
    opacity: 1;
  }
  
  /* Auth Button */
  .nav-auth {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-cyan);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .nav-auth:hover {
    border-color: var(--color-cyan);
    background: rgba(0, 212, 255, 0.1);
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
  }
  
  .nav-auth.logged-in {
    color: var(--color-red);
  }
  
  .nav-auth.logged-in:hover {
    border-color: var(--color-red);
    background: rgba(255, 0, 68, 0.1);
    box-shadow: 0 0 15px rgba(255, 0, 68, 0.2);
  }
  
  /* Mobile Navigation */
  .mobile-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: rgba(4, 13, 8, 0.98);
    border-top: 1px solid var(--color-border);
    backdrop-filter: blur(12px);
    z-index: var(--z-nav);
  }
  
  .mobile-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: var(--space-xs);
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .mobile-nav-item:hover,
  .mobile-nav-item.active {
    color: var(--color-terminal);
  }
  
  .mobile-nav-item.active {
    background: var(--color-terminal-muted);
  }
  
  .mobile-nav-label {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .nav-dock {
      display: none;
    }
    
    .mobile-nav {
      display: flex;
    }
  }
  
  /* Animations */
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
