<script lang="ts">
  import { onMount } from 'svelte'
  import { state as authState } from '$lib/ctfd.svelte'
  import { Terminal, Shield, Target, Zap, Clock, Users } from 'lucide-svelte'
  
  let typedText = $state('')
  let showCursor = $state(true)
  let statsVisible = $state(false)
  
  const heroText = 'IHMSCTF 2026'
  const subText = 'BREACH THE SYSTEM'
  
  let currentCharIndex = $state(0)
  let isTypingHero = $state(true)
  
  onMount(() => {
    // Typing animation
    const typeInterval = setInterval(() => {
      if (isTypingHero) {
        if (currentCharIndex < heroText.length) {
          typedText = heroText.slice(0, currentCharIndex + 1)
          currentCharIndex++
        } else {
          isTypingHero = false
          currentCharIndex = 0
        }
      }
    }, 80)
    
    // Cursor blink
    const cursorInterval = setInterval(() => {
      showCursor = !showCursor
    }, 530)
    
    // Show stats with delay
    setTimeout(() => {
      statsVisible = true
    }, 1200)
    
    return () => {
      clearInterval(typeInterval)
      clearInterval(cursorInterval)
    }
  })
  
  const navigateTo = (view: string) => {
    window.location.hash = `#/${view}`
  }
</script>

<div class="home-view">
  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <!-- Glitch title -->
      <div class="hero-tag">
        <Terminal size={14} strokeWidth={2} />
        <span>CAPTURE THE FLAG</span>
      </div>
      
      <h1 class="hero-title">
        <span class="typed-text">{typedText}</span>
        <span class="cursor" class:visible={showCursor}>_</span>
      </h1>
      
      <p class="hero-subtitle">{subText}</p>
      
      <p class="hero-description">
        Compete in the ultimate cybersecurity challenge. 
        Exploit vulnerabilities, decode secrets, and prove your skills 
        against the best hackers in the competition.
      </p>
      
      <div class="hero-actions">
        {#if authState.isLoggedIn}
          <button 
            type="button" 
            class="btn btn-primary btn-lg"
            onclick={() => navigateTo('challenges')}
          >
            <Target size={18} />
            <span>Enter Challenges</span>
          </button>
          <button 
            type="button" 
            class="btn btn-lg"
            onclick={() => navigateTo('scoreboard')}
          >
            <Users size={18} />
            <span>View Scoreboard</span>
          </button>
        {:else}
          <button 
            type="button" 
            class="btn btn-primary btn-lg"
            onclick={() => navigateTo('login')}
          >
            <Shield size={18} />
            <span>Access Terminal</span>
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Decorative elements -->
    <div class="hero-decoration">
      <div class="hex-grid"></div>
    </div>
  </section>
  
  <!-- Stats Section -->
  <section class="stats-section" class:visible={statsVisible}>
    <div class="stats-grid">
      <div class="stat-card stagger-1">
        <div class="stat-icon">
          <Target size={24} strokeWidth={1.5} />
        </div>
        <div class="stat-content">
          <span class="stat-value">50+</span>
          <span class="stat-label">Challenges</span>
        </div>
      </div>
      
      <div class="stat-card stagger-2">
        <div class="stat-icon cyan">
          <Users size={24} strokeWidth={1.5} />
        </div>
        <div class="stat-content">
          <span class="stat-value">200+</span>
          <span class="stat-label">Hackers</span>
        </div>
      </div>
      
      <div class="stat-card stagger-3">
        <div class="stat-icon amber">
          <Zap size={24} strokeWidth={1.5} />
        </div>
        <div class="stat-content">
          <span class="stat-value">$5K</span>
          <span class="stat-label">Prize Pool</span>
        </div>
      </div>
      
      <div class="stat-card stagger-4">
        <div class="stat-icon magenta">
          <Clock size={24} strokeWidth={1.5} />
        </div>
        <div class="stat-content">
          <span class="stat-value">48H</span>
          <span class="stat-label">Duration</span>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Categories Preview -->
  <section class="categories-section" class:visible={statsVisible}>
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-prefix">//</span>
        CHALLENGE CATEGORIES
      </h2>
    </div>
    
    <div class="categories-grid">
      {#each [
        { name: 'Web Exploitation', desc: 'SQL injection, XSS, CSRF, and more', color: 'terminal' },
        { name: 'Binary Exploitation', desc: 'Buffer overflows, ROP chains, shellcode', color: 'cyan' },
        { name: 'Cryptography', desc: 'Break ciphers and encryption schemes', color: 'amber' },
        { name: 'Reverse Engineering', desc: 'Analyze and decompile binaries', color: 'magenta' },
        { name: 'Forensics', desc: 'Investigate digital evidence', color: 'terminal' },
        { name: 'Miscellaneous', desc: 'OSINT, steganography, and puzzles', color: 'cyan' },
      ] as category, i}
        <div class="category-card stagger-{i + 1}" class:terminal={category.color === 'terminal'} class:cyan={category.color === 'cyan'} class:amber={category.color === 'amber'} class:magenta={category.color === 'magenta'}>
          <h3 class="category-name">{category.name}</h3>
          <p class="category-desc">{category.desc}</p>
        </div>
      {/each}
    </div>
  </section>
  
  <!-- Terminal ASCII art decoration -->
  <div class="terminal-decoration">
    <pre class="ascii-art">
{`
    ╔══════════════════════════════════════╗
    ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
    ║  ▓  SYSTEM BREACH DETECTED         ▓  ║
    ║  ▓  INITIATING COUNTERMEASURES...  ▓  ║
    ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
    ╚══════════════════════════════════════╝
`}
    </pre>
  </div>
</div>

<style>
  .home-view {
    position: relative;
    overflow: hidden;
  }
  
  /* Hero Section */
  .hero {
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    padding: var(--space-3xl) 0;
  }
  
  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 700px;
  }
  
  .hero-tag {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-md);
    background: var(--color-terminal-muted);
    border: 1px solid var(--color-terminal-dim);
    color: var(--color-terminal);
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: var(--space-lg);
    animation: fade-in-up 0.5s ease forwards;
  }
  
  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 8vw, 5rem);
    font-weight: 900;
    letter-spacing: 0.05em;
    line-height: 1.1;
    color: var(--text-primary);
    margin: 0 0 var(--space-md);
    text-shadow: 
      0 0 30px var(--color-terminal-glow),
      0 0 60px var(--color-terminal-glow);
  }
  
  .typed-text {
    color: var(--color-terminal);
  }
  
  .cursor {
    opacity: 0;
    color: var(--color-terminal);
  }
  
  .cursor.visible {
    opacity: 1;
  }
  
  .hero-subtitle {
    font-family: var(--font-display);
    font-size: clamp(1rem, 3vw, 1.5rem);
    font-weight: 500;
    letter-spacing: 0.3em;
    color: var(--text-secondary);
    margin: 0 0 var(--space-xl);
    animation: fade-in-up 0.5s ease 0.2s forwards;
    opacity: 0;
  }
  
  .hero-description {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--text-tertiary);
    margin: 0 0 var(--space-2xl);
    max-width: 500px;
    animation: fade-in-up 0.5s ease 0.3s forwards;
    opacity: 0;
  }
  
  .hero-actions {
    display: flex;
    gap: var(--space-md);
    flex-wrap: wrap;
    animation: fade-in-up 0.5s ease 0.4s forwards;
    opacity: 0;
  }
  
  .btn-lg {
    padding: var(--space-md) var(--space-xl);
    font-size: 0.8rem;
  }
  
  /* Hero decoration */
  .hero-decoration {
    position: absolute;
    top: 0;
    right: -100px;
    width: 500px;
    height: 500px;
    opacity: 0.1;
    pointer-events: none;
  }
  
  .hex-grid {
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300ff41' fill-opacity='0.4'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  
  /* Stats Section */
  .stats-section {
    padding: var(--space-2xl) 0;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease;
  }
  
  .stats-section.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-md);
  }
  
  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: var(--space-lg);
    display: flex;
    align-items: center;
    gap: var(--space-md);
    transition: all var(--transition-fast);
    animation: fade-in-up 0.5s ease forwards;
    opacity: 0;
  }
  
  .stat-card:hover {
    border-color: var(--color-terminal-dim);
    transform: translateY(-2px);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-terminal-muted);
    border: 1px solid var(--color-terminal-dim);
    color: var(--color-terminal);
  }
  
  .stat-icon.cyan {
    background: rgba(0, 212, 255, 0.15);
    border-color: var(--color-cyan-dim);
    color: var(--color-cyan);
  }
  
  .stat-icon.amber {
    background: rgba(255, 184, 0, 0.15);
    border-color: var(--color-amber-dim);
    color: var(--color-amber);
  }
  
  .stat-icon.magenta {
    background: rgba(255, 0, 110, 0.15);
    border-color: var(--color-magenta-dim);
    color: var(--color-magenta);
  }
  
  .stat-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .stat-value {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.02em;
  }
  
  .stat-label {
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-tertiary);
  }
  
  /* Categories Section */
  .categories-section {
    padding: var(--space-2xl) 0;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease 0.2s;
  }
  
  .categories-section.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .section-header {
    margin-bottom: var(--space-xl);
  }
  
  .section-title {
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--text-secondary);
    margin: 0;
  }
  
  .title-prefix {
    color: var(--color-terminal);
    margin-right: var(--space-sm);
  }
  
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-md);
  }
  
  .category-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: var(--space-lg);
    transition: all var(--transition-fast);
    position: relative;
    overflow: hidden;
    animation: fade-in-up 0.5s ease forwards;
    opacity: 0;
  }
  
  .category-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: var(--color-terminal);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  
  .category-card.terminal::before { background: var(--color-terminal); }
  .category-card.cyan::before { background: var(--color-cyan); }
  .category-card.amber::before { background: var(--color-amber); }
  .category-card.magenta::before { background: var(--color-magenta); }
  
  .category-card:hover {
    border-color: var(--color-border-bright);
    transform: translateX(4px);
  }
  
  .category-card:hover::before {
    opacity: 1;
  }
  
  .category-name {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--space-sm);
  }
  
  .category-desc {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin: 0;
    line-height: 1.5;
  }
  
  /* Terminal decoration */
  .terminal-decoration {
    position: fixed;
    bottom: 60px;
    right: 20px;
    opacity: 0.15;
    pointer-events: none;
    z-index: 0;
  }
  
  .ascii-art {
    font-family: var(--font-mono);
    font-size: 0.55rem;
    color: var(--color-terminal);
    line-height: 1.2;
    margin: 0;
  }
  
  /* Stagger animations */
  .stagger-1 { animation-delay: 100ms; }
  .stagger-2 { animation-delay: 150ms; }
  .stagger-3 { animation-delay: 200ms; }
  .stagger-4 { animation-delay: 250ms; }
  .stagger-5 { animation-delay: 300ms; }
  .stagger-6 { animation-delay: 350ms; }
  
  /* Responsive */
  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .categories-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 640px) {
    .hero {
      min-height: 60vh;
      padding: var(--space-2xl) 0;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .categories-grid {
      grid-template-columns: 1fr;
    }
    
    .hero-actions {
      flex-direction: column;
    }
    
    .hero-actions .btn {
      width: 100%;
      justify-content: center;
    }
    
    .terminal-decoration {
      display: none;
    }
  }
  
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
