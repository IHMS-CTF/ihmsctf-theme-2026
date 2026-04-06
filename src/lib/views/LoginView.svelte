<script lang="ts">
  import { onMount } from 'svelte'
  import { init, login } from '$lib/ctfd.svelte'
  import { Terminal, Lock, User, AlertTriangle, CheckCircle, Loader } from 'lucide-svelte'

  let username = $state('')
  let password = $state('')
  let errorMessage = $state('')
  let successMessage = $state('')
  let isSubmitting = $state(false)
  let isReady = $state(false)
  let terminalLines = $state<string[]>([])
  let showForm = $state(false)

  const addTerminalLine = (line: string, delay: number = 0) => {
    setTimeout(() => {
      terminalLines = [...terminalLines, line]
    }, delay)
  }

  onMount(async () => {
    // Terminal boot sequence
    addTerminalLine('> Initializing secure connection...', 0)
    addTerminalLine('> Loading authentication module...', 400)
    addTerminalLine('> Establishing encrypted channel...', 800)
    
    await init()
    
    addTerminalLine('> Connection established.', 1200)
    addTerminalLine('> AUTH_READY', 1600)
    
    setTimeout(() => {
      isReady = true
      showForm = true
    }, 1800)
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    errorMessage = ''
    successMessage = ''
    isSubmitting = true
    
    addTerminalLine(`> Authenticating user: ${username}...`)

    try {
      const result = await login(username, password)

      if (result.success) {
        addTerminalLine('> Authentication successful.')
        addTerminalLine('> Granting access...')
        successMessage = 'ACCESS GRANTED'
        
        setTimeout(() => {
          window.location.hash = '#/challenges'
        }, 1500)
      } else {
        addTerminalLine(`> ERROR: ${result.error ?? 'Authentication failed'}`)
        errorMessage = result.error ?? 'Authentication failed'
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Authentication failed'
      addTerminalLine(`> FATAL ERROR: ${msg}`)
      errorMessage = msg
    } finally {
      isSubmitting = false
    }
  }
</script>

<div class="login-view">
  <div class="login-container">
    <!-- Terminal window -->
    <div class="terminal-window panel panel-corners">
      <div class="terminal-header panel-header">
        <div class="terminal-title panel-title">
          <Terminal size={14} strokeWidth={2} />
          <span>AUTH_TERMINAL</span>
        </div>
        <div class="terminal-controls">
          <span class="control-dot"></span>
          <span class="control-dot"></span>
          <span class="control-dot active"></span>
        </div>
      </div>
      
      <div class="terminal-body">
        <!-- Terminal output -->
        <div class="terminal-output">
          {#each terminalLines as line, i}
            <div class="terminal-line stagger-{Math.min(i + 1, 8)}">
              {line}
            </div>
          {/each}
          {#if isSubmitting}
            <div class="terminal-line loading">
              <Loader size={12} class="spinner" />
              <span>Processing...</span>
            </div>
          {/if}
        </div>
        
        <!-- Login form -->
        {#if showForm}
          <form class="login-form" onsubmit={handleSubmit}>
            <div class="form-header">
              <Lock size={16} strokeWidth={2} />
              <span>SECURE LOGIN REQUIRED</span>
            </div>
            
            {#if successMessage}
              <div class="message success">
                <CheckCircle size={16} strokeWidth={2} />
                <span>{successMessage}</span>
              </div>
            {/if}
            
            {#if errorMessage}
              <div class="message error">
                <AlertTriangle size={16} strokeWidth={2} />
                <span>{errorMessage}</span>
              </div>
            {/if}
            
            <div class="input-group">
              <label for="username" class="input-label">
                <User size={14} strokeWidth={2} />
                <span>USERNAME</span>
              </label>
              <div class="input-wrapper">
                <span class="input-prompt">$</span>
                <input
                  id="username"
                  type="text"
                  name="username"
                  bind:value={username}
                  placeholder="enter username"
                  required
                  autocomplete="username"
                  class="input input-terminal"
                  disabled={!isReady || isSubmitting}
                />
              </div>
            </div>
            
            <div class="input-group">
              <label for="password" class="input-label">
                <Lock size={14} strokeWidth={2} />
                <span>PASSWORD</span>
              </label>
              <div class="input-wrapper">
                <span class="input-prompt">$</span>
                <input
                  id="password"
                  type="password"
                  name="password"
                  bind:value={password}
                  placeholder="enter password"
                  required
                  autocomplete="current-password"
                  class="input input-terminal"
                  disabled={!isReady || isSubmitting}
                />
              </div>
            </div>
            
            <button
              type="submit"
              class="btn btn-primary submit-btn"
              disabled={!isReady || isSubmitting}
            >
              {#if isSubmitting}
                <Loader size={16} class="spinner" />
                <span>AUTHENTICATING...</span>
              {:else}
                <Terminal size={16} />
                <span>EXECUTE LOGIN</span>
              {/if}
            </button>
          </form>
        {/if}
      </div>
    </div>
    
    <!-- Side info panel -->
    <div class="info-panel">
      <div class="info-block">
        <div class="info-label">SYSTEM</div>
        <div class="info-value">IHMSCTF AUTH v2.0</div>
      </div>
      <div class="info-block">
        <div class="info-label">PROTOCOL</div>
        <div class="info-value">TLS 1.3 ENCRYPTED</div>
      </div>
      <div class="info-block">
        <div class="info-label">STATUS</div>
        <div class="info-value" class:active={isReady}>
          {isReady ? 'READY' : 'INITIALIZING'}
        </div>
      </div>
      <div class="info-divider"></div>
      <div class="info-note">
        <AlertTriangle size={12} strokeWidth={2} />
        <span>Unauthorized access attempts are logged and reported.</span>
      </div>
    </div>
  </div>
</div>

<style>
  .login-view {
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl) 0;
  }
  
  .login-container {
    display: flex;
    gap: var(--space-xl);
    max-width: 800px;
    width: 100%;
  }
  
  /* Terminal window */
  .terminal-window {
    flex: 1;
    min-width: 400px;
    animation: scale-in 0.4s ease forwards;
  }
  
  .terminal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-elevated);
  }
  
  .terminal-title {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-terminal);
  }
  
  .terminal-controls {
    display: flex;
    gap: 6px;
  }
  
  .control-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-border-bright);
  }
  
  .control-dot.active {
    background: var(--color-terminal);
    box-shadow: 0 0 6px var(--color-terminal-glow);
  }
  
  .terminal-body {
    padding: var(--space-lg);
    background: var(--color-abyss);
    min-height: 400px;
  }
  
  /* Terminal output */
  .terminal-output {
    margin-bottom: var(--space-xl);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }
  
  .terminal-line {
    padding: 2px 0;
    animation: fade-in-up 0.3s ease forwards;
    opacity: 0;
  }
  
  .terminal-line.loading {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    color: var(--color-amber);
  }
  
  /* Login form */
  .login-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    animation: fade-in-up 0.4s ease 0.2s forwards;
    opacity: 0;
  }
  
  .form-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--color-terminal);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid var(--color-border);
  }
  
  .message {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md);
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .message.success {
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid var(--color-terminal-dim);
    color: var(--color-terminal);
  }
  
  .message.error {
    background: rgba(255, 0, 68, 0.1);
    border: 1px solid var(--color-red-dim);
    color: var(--color-red);
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  
  .input-label {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-tertiary);
  }
  
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .input-prompt {
    position: absolute;
    left: var(--space-md);
    color: var(--color-terminal);
    font-weight: 700;
    pointer-events: none;
  }
  
  .input-terminal {
    padding-left: calc(var(--space-md) + 1rem);
    background: var(--color-void);
    border-color: var(--color-border);
  }
  
  .input-terminal:focus {
    border-color: var(--color-terminal);
    box-shadow: 
      0 0 0 1px var(--color-terminal-dim),
      0 0 20px var(--color-terminal-glow);
  }
  
  .submit-btn {
    margin-top: var(--space-md);
    width: 100%;
  }
  
  .submit-btn :global(.spinner) {
    animation: spin 1s linear infinite;
  }
  
  /* Info panel */
  .info-panel {
    width: 180px;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding: var(--space-lg);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    animation: slide-in-right 0.4s ease 0.3s forwards;
    opacity: 0;
  }
  
  .info-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .info-label {
    font-size: 0.55rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-muted);
  }
  
  .info-value {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-secondary);
  }
  
  .info-value.active {
    color: var(--color-terminal);
  }
  
  .info-divider {
    height: 1px;
    background: var(--color-border);
  }
  
  .info-note {
    display: flex;
    gap: var(--space-sm);
    font-size: 0.6rem;
    color: var(--color-amber);
    line-height: 1.4;
  }
  
  .info-note :global(svg) {
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  /* Animations */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes slide-in-right {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
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
  
  /* Stagger delays */
  .stagger-1 { animation-delay: 50ms; }
  .stagger-2 { animation-delay: 100ms; }
  .stagger-3 { animation-delay: 150ms; }
  .stagger-4 { animation-delay: 200ms; }
  .stagger-5 { animation-delay: 250ms; }
  .stagger-6 { animation-delay: 300ms; }
  .stagger-7 { animation-delay: 350ms; }
  .stagger-8 { animation-delay: 400ms; }
  
  /* Responsive */
  @media (max-width: 768px) {
    .login-container {
      flex-direction: column;
      padding: 0 var(--space-md);
    }
    
    .terminal-window {
      min-width: 0;
      width: 100%;
    }
    
    .info-panel {
      width: 100%;
      flex-direction: row;
      flex-wrap: wrap;
    }
    
    .info-block {
      flex: 1;
      min-width: 100px;
    }
    
    .info-divider {
      width: 100%;
    }
    
    .info-note {
      width: 100%;
    }
  }
</style>
