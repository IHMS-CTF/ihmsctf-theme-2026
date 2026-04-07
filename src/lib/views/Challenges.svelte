<script lang="ts">
  import { onMount } from 'svelte'
  import { marked } from 'marked'
  import { 
    Target, CheckCircle, Users, X, Download, Play, RefreshCw, 
    Square, ExternalLink, Terminal, Loader, AlertTriangle, Flag,
    Clock, FileText, FileCode, FileArchive, Image, Music, Film, File
  } from 'lucide-svelte'
  import { ctfdurl } from '$lib/index'
  import {
    getChallenge,
    getChallenges,
    getContainerInfo,
    init,
    renewContainer,
    requestContainer,
    stopContainer,
    submitFlag,
    type Challenge,
    type ContainerConnection,
    type ContainerInstanceInfo,
  } from '$lib/ctfd.svelte'
  
  // Configure marked
  marked.setOptions({ breaks: true, gfm: true })

  // Types
  type ChallengeGroup = {
    category: string
    colorClass: string
    challenges: Challenge[]
  }

  // Category color mapping
  const categoryColors: Record<string, string> = {
    'Web': 'cyan',
    'Binary': 'magenta',
    'Crypto': 'amber',
    'Forensics': 'terminal',
    'Reverse': 'magenta',
    'Misc': 'cyan',
    'PWN': 'red',
    'OSINT': 'amber',
  }

  const getCategoryColor = (category: string): string => {
    for (const [key, color] of Object.entries(categoryColors)) {
      if (category.toLowerCase().includes(key.toLowerCase())) return color
    }
    return 'terminal'
  }

  // State
  let loading = $state(true)
  let errorMessage = $state('')
  let groups = $state<ChallengeGroup[]>([])
  let activeFilter = $state<string | null>(null)

  // Modal state
  let modalOpen = $state(false)
  let modalLoading = $state(false)
  let selectedChallenge = $state<Challenge | null>(null)
  let submitMessage = $state('')
  let submitError = $state('')
  let flagInput = $state('')
  let submittingFlag = $state(false)

  // Container state
  let containerInfo = $state<ContainerInstanceInfo | null>(null)
  let containerLoading = $state(false)
  let containerActionLoading = $state(false)
  let containerMessage = $state('')
  let containerError = $state('')

  // Derived state
  let filteredGroups = $derived(activeFilter 
    ? groups.filter(g => g.category === activeFilter)
    : groups)
  let totalChallenges = $derived(groups.reduce((sum, g) => sum + g.challenges.length, 0))
  let solvedChallenges = $derived(groups.reduce((sum, g) => sum + g.challenges.filter(c => c.solved_by_me).length, 0))

  // Helpers
  const truncateMiddle = (value: string, maxLength = 28) => {
    if (value.length <= maxLength) return value
    const keep = Math.max(6, Math.floor((maxLength - 3) / 2))
    return `${value.slice(0, keep)}...${value.slice(-keep)}`
  }

  const getFileName = (fileUrl: string) => {
    const pathname = fileUrl.split('?')[0]
    return pathname.split('/').pop() || 'download'
  }

  const getFileIcon = (fileUrl: string) => {
    const fileName = getFileName(fileUrl).toLowerCase()
    if (/(png|jpg|jpeg|gif|webp|svg)$/.test(fileName)) return Image
    if (/(zip|tar|gz|7z|rar)$/.test(fileName)) return FileArchive
    if (/(mp3|wav|ogg|flac)$/.test(fileName)) return Music
    if (/(mp4|mov|avi|webm|mkv)$/.test(fileName)) return Film
    if (/(js|ts|py|c|cpp|rs|go|java|sh|php|rb)$/.test(fileName)) return FileCode
    if (/(txt|md|pdf|doc|docx)$/.test(fileName)) return FileText
    return File
  }

  const normalizeFileUrl = (fileUrl: string) => {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl
    return `${ctfdurl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`
  }

  const formatExpiry = (timestampMs?: number) => {
    if (!timestampMs) return ''
    const secondsLeft = Math.ceil((timestampMs - Date.now()) / 1000)
    if (secondsLeft <= 0) return 'Expired'
    if (secondsLeft < 60) return `${secondsLeft}s`
    return `${Math.ceil(secondsLeft / 60)}m`
  }

  const isContainerChallenge = (challenge: Challenge) => {
    const typeId = challenge.type_data?.id?.toLowerCase()
    return challenge.type === 'container' || typeId === 'container'
  }

  const resolveConnectionLinks = (connection?: ContainerConnection) => {
    if (!connection) return []
    
    if (connection.type === 'url_list' && Array.isArray(connection.urls)) {
      return connection.urls
        .filter((entry): entry is { label?: string; url: string } => !!entry?.url)
        .map((entry) => ({ label: entry.label || entry.url, href: entry.url }))
    }

    if (connection.type === 'url' && connection.urls?.length) {
      return connection.urls
        .filter((entry): entry is { label?: string; url: string } => !!entry?.url)
        .map((entry) => ({ label: entry.label || entry.url, href: entry.url }))
    }

    if (['http', 'web', 'https'].includes(connection.type || '')) {
      if (connection.ports && connection.host) {
        return Object.values(connection.ports).map((externalPort) => {
          const protocol = connection.type === 'https' ? 'https' : 'http'
          const href = `${protocol}://${connection.host}:${externalPort}`
          return { label: href, href }
        })
      }
      if (connection.host && connection.port) {
        const protocol = connection.type === 'https' ? 'https' : 'http'
        const href = `${protocol}://${connection.host}:${connection.port}`
        return [{ label: href, href }]
      }
    }

    return []
  }

  const resolveConnectionCommands = (connection?: ContainerConnection) => {
    if (!connection?.host) return []
    
    if (connection.type === 'tcp' || connection.type === 'nc') {
      if (connection.ports && Object.keys(connection.ports).length > 0) {
        const portList = Object.values(connection.ports).join(', ')
        return [`nc ${connection.host} ${portList}`]
      }
      if (connection.port) return [`nc ${connection.host} ${connection.port}`]
    }

    if (connection.type === 'ssh') {
      if (connection.ports && Object.keys(connection.ports).length > 0) {
        return Object.values(connection.ports).map((p) => `ssh -p ${p} user@${connection.host}`)
      }
      if (connection.port) return [`ssh -p ${connection.port} user@${connection.host}`]
    }

    return []
  }

  const portal = (node: HTMLElement) => {
    // Keep the modal outside animated view containers so fixed positioning
    // stays relative to the viewport instead of the scrollable challenges view.
    document.body.appendChild(node)
  }

  const buildGroups = (challenges: Challenge[]): ChallengeGroup[] => {
    const byCategory = new Map<string, Challenge[]>()
    for (const challenge of challenges) {
      const category = challenge.category?.trim() || 'Uncategorized'
      if (!byCategory.has(category)) byCategory.set(category, [])
      byCategory.get(category)?.push(challenge)
    }
    return [...byCategory.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, categoryChallenges]) => ({
        category,
        colorClass: getCategoryColor(category),
        challenges: [...categoryChallenges].sort((a, b) => (a.value ?? 0) - (b.value ?? 0)),
      }))
  }

  // Data fetching
  const refreshChallenges = async () => {
    loading = true
    errorMessage = ''
    const result = await getChallenges()
    if (!result.success || !result.data) {
      errorMessage = result.error ?? 'Failed to load challenges'
      groups = []
    } else {
      groups = buildGroups(result.data)
    }
    loading = false
  }

  const refreshContainerInfo = async (challengeId: number) => {
    containerLoading = true
    containerError = ''
    const result = await getContainerInfo(challengeId)
    if (!result.success) {
      containerInfo = null
      containerError = result.error ?? 'Failed to fetch instance info'
    } else {
      containerInfo = result.data ?? null
    }
    containerLoading = false
  }

  // Modal actions
  const openChallenge = async (challenge: Challenge) => {
    // Reset all modal state
    selectedChallenge = null
    submitMessage = ''
    submitError = ''
    flagInput = ''
    containerInfo = null
    containerLoading = false
    containerActionLoading = false
    containerMessage = ''
    containerError = ''
    modalLoading = true
    
    // Open modal and lock scroll
    modalOpen = true
    document.body.style.overflow = 'hidden'

    const detail = await getChallenge(challenge.id)
    if (!detail.success || !detail.data) {
      submitError = detail.error ?? 'Failed to load challenge details'
      selectedChallenge = challenge
    } else {
      selectedChallenge = detail.data
      if (isContainerChallenge(detail.data)) {
        await refreshContainerInfo(detail.data.id)
      }
    }
    modalLoading = false
  }

  const closeModal = () => {
    modalOpen = false
    document.body.style.overflow = ''
  }

  // Container actions
  const handleContainerRequest = async () => {
    if (!selectedChallenge) return
    containerActionLoading = true
    containerError = ''
    containerMessage = ''
    const result = await requestContainer(selectedChallenge.id)
    containerActionLoading = false
    if (!result.success) {
      containerError = result.error ?? 'Failed to launch container'
      return
    }
    containerMessage = result.data?.status === 'existing' ? 'Using existing instance.' : 'Instance launched successfully.'
    await refreshContainerInfo(selectedChallenge.id)
  }

  const handleContainerRenew = async () => {
    if (!selectedChallenge) return
    containerActionLoading = true
    containerError = ''
    containerMessage = ''
    const result = await renewContainer(selectedChallenge.id)
    containerActionLoading = false
    if (!result.success) {
      containerError = result.error ?? 'Failed to renew container'
      return
    }
    containerMessage = 'Instance renewed.'
    await refreshContainerInfo(selectedChallenge.id)
  }

  const handleContainerStop = async () => {
    if (!selectedChallenge) return
    containerActionLoading = true
    containerError = ''
    containerMessage = ''
    const result = await stopContainer(selectedChallenge.id)
    containerActionLoading = false
    if (!result.success) {
      containerError = result.error ?? 'Failed to terminate container'
      return
    }
    containerMessage = 'Instance terminated.'
    await refreshContainerInfo(selectedChallenge.id)
  }

  // Flag submission
  const handleFlagSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (!selectedChallenge || !flagInput.trim()) return
    
    submitMessage = ''
    submitError = ''
    submittingFlag = true

    const result = await submitFlag(selectedChallenge.id, flagInput.trim())
    submittingFlag = false

    if (!result.success) {
      submitError = result.error ?? 'Failed to submit flag'
      return
    }

    const status = result.status ?? 'unknown'
    if (status === 'correct' || status === 'already_solved') {
      submitMessage = result.message ?? 'Correct flag!'
      await refreshChallenges()
      const detail = await getChallenge(selectedChallenge.id)
      if (detail.success && detail.data) selectedChallenge = detail.data
    } else {
      submitError = result.message ?? `Submission result: ${status}`
    }
  }

  // Keyboard handling
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && modalOpen) closeModal()
  }

  onMount(() => {
    let disposed = false

    const setup = async () => {
      await init()
      if (disposed) return

      await refreshChallenges()
      if (disposed) return

      window.addEventListener('keydown', handleKeydown)
    }

    void setup()

    return () => {
      disposed = true
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeydown)
    }
  })
</script>

<div class="challenges-page">
  <!-- Header -->
  <header class="page-header">
    <div class="header-left">
      <div class="header-icon">
        <Target size={28} strokeWidth={1.5} />
      </div>
      <div class="header-text">
        <h1>CHALLENGES</h1>
        <p>Select a target and capture the flag</p>
      </div>
    </div>
    
    <div class="header-right">
      <div class="stats-display">
        <div class="stat-block">
          <span class="stat-number">{solvedChallenges}</span>
          <span class="stat-label">CAPTURED</span>
        </div>
        <span class="stat-sep">/</span>
        <div class="stat-block">
          <span class="stat-number">{totalChallenges}</span>
          <span class="stat-label">TARGETS</span>
        </div>
      </div>
      <button type="button" class="refresh-btn" onclick={refreshChallenges} disabled={loading}>
        <RefreshCw size={14} class={loading ? 'spinning' : ''} />
        <span>REFRESH</span>
      </button>
    </div>
  </header>

  <!-- Category filters -->
  <nav class="filters-bar">
    <button 
      type="button" 
      class="filter-chip"
      class:active={!activeFilter}
      onclick={() => activeFilter = null}
    >
      ALL
    </button>
    {#each groups as group}
      <button 
        type="button" 
        class="filter-chip filter-chip--{group.colorClass}"
        class:active={activeFilter === group.category}
        onclick={() => activeFilter = group.category}
      >
        {group.category}
        <span class="chip-count">{group.challenges.length}</span>
      </button>
    {/each}
  </nav>

  <!-- Content -->
  <div class="challenges-content">
    {#if loading}
      <div class="state-message">
        <Loader size={28} class="spinning" />
        <span>Scanning targets...</span>
      </div>
    {:else if errorMessage}
      <div class="state-message state-message--error">
        <AlertTriangle size={28} />
        <span>{errorMessage}</span>
      </div>
    {:else if groups.length === 0}
      <div class="state-message">
        <Target size={48} strokeWidth={1} />
        <span>No challenges available</span>
      </div>
    {:else}
      {#each filteredGroups as group, gi}
        <section class="category-section" style="--delay: {gi * 60}ms">
          <div class="category-header">
            <h2 class="category-title">
              <span class="title-deco">//</span>
              {group.category.toUpperCase()}
            </h2>
            <span class="category-count count--{group.colorClass}">
              {group.challenges.length} TARGET{group.challenges.length === 1 ? '' : 'S'}
            </span>
          </div>

          <div class="cards-grid">
            {#each group.challenges as challenge, ci}
              <button
                type="button"
                class="challenge-card card--{group.colorClass}"
                class:solved={challenge.solved_by_me}
                onclick={() => openChallenge(challenge)}
                style="--delay: {(gi * 60) + (ci * 40)}ms"
              >
                <div class="card-top">
                  <h3 class="card-name">{challenge.name}</h3>
                  <span class="card-points">{challenge.value ?? 0}</span>
                </div>
                
                <div class="card-info">
                  <span class="info-item">
                    <Users size={12} />
                    {challenge.solves ?? 0}
                  </span>
                  {#if isContainerChallenge(challenge)}
                    <span class="info-item info-item--docker">
                      <Terminal size={12} />
                      Docker
                    </span>
                  {/if}
                </div>
                
                {#if challenge.solved_by_me}
                  <div class="card-badge">
                    <CheckCircle size={12} />
                    CAPTURED
                  </div>
                {/if}
              </button>
            {/each}
          </div>
        </section>
      {/each}
    {/if}
  </div>
</div>

<!-- Modal Portal - Rendered at document level -->
{#if modalOpen}
  <div 
    use:portal
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Challenge details"
    tabindex="-1"
  >
    <button type="button" class="modal-overlay-close" onclick={closeModal} aria-label="Close modal"></button>

    <!-- Modal Panel -->
    <div class="modal-panel">
      {#if modalLoading}
        <div class="modal-state">
          <Loader size={32} class="spinning" />
          <span>Loading challenge...</span>
        </div>
      {:else if selectedChallenge}
        <!-- Header -->
        <header class="modal-header">
          <div class="modal-title-area">
            <h2 class="modal-title">{selectedChallenge.name}</h2>
            <div class="modal-tags">
              <span class="tag tag--category">{selectedChallenge.category ?? 'Uncategorized'}</span>
              <span class="tag tag--points">{selectedChallenge.value ?? 0} PTS</span>
              <span class="tag tag--solves">
                <Users size={11} />
                {selectedChallenge.solves ?? 0}
              </span>
            </div>
          </div>
          <button type="button" class="modal-close" onclick={closeModal} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <!-- Body -->
        <div class="modal-body">
          <!-- Description -->
          <section class="modal-section">
            <div class="section-label">BRIEFING</div>
            <div class="description-box markdown">
              {@html marked.parse(selectedChallenge.description ?? 'No description available.')}
            </div>
          </section>

          <!-- Container Controls -->
          {#if isContainerChallenge(selectedChallenge)}
            <section class="modal-section container-box">
              <div class="section-label">
                <Terminal size={14} />
                INSTANCE CONTROLS
              </div>
              
              <div class="container-actions">
                <button type="button" class="action-btn" onclick={handleContainerRequest} disabled={containerActionLoading}>
                  <Play size={14} />
                  LAUNCH
                </button>
                <button type="button" class="action-btn" onclick={handleContainerRenew} disabled={containerActionLoading}>
                  <RefreshCw size={14} />
                  RENEW
                </button>
                <button type="button" class="action-btn action-btn--danger" onclick={handleContainerStop} disabled={containerActionLoading}>
                  <Square size={14} />
                  DESTROY
                </button>
              </div>

              {#if containerLoading}
                <div class="container-status">
                  <Loader size={14} class="spinning" />
                  <span>Checking status...</span>
                </div>
              {:else if containerInfo && containerInfo.status !== 'not_found'}
                <div class="container-status container-status--active">
                  <div class="status-row">
                    <span class="status-indicator"></span>
                    <span>STATUS: {containerInfo.status.toUpperCase()}</span>
                    {#if containerInfo.expires_at}
                      <span class="status-expiry">
                        <Clock size={12} />
                        {formatExpiry(containerInfo.expires_at)}
                      </span>
                    {/if}
                  </div>
                  
                  {#if resolveConnectionLinks(containerInfo.connection).length > 0}
                    <div class="connection-list">
                      {#each resolveConnectionLinks(containerInfo.connection) as link}
                        <a href={link.href} target="_blank" rel="noreferrer" class="connection-link">
                          <ExternalLink size={12} />
                          {link.label}
                        </a>
                      {/each}
                    </div>
                  {/if}

                  {#if resolveConnectionCommands(containerInfo.connection).length > 0}
                    <div class="command-list">
                      {#each resolveConnectionCommands(containerInfo.connection) as command}
                        <code class="command-code">{command}</code>
                      {/each}
                    </div>
                  {/if}
                </div>
              {:else}
                <div class="container-status">
                  <span class="status-indicator status-indicator--off"></span>
                  <span>No active instance</span>
                </div>
              {/if}

              {#if containerMessage}
                <div class="container-msg container-msg--success">{containerMessage}</div>
              {/if}
              {#if containerError}
                <div class="container-msg container-msg--error">{containerError}</div>
              {/if}
            </section>
          {/if}

          <!-- Files -->
          {#if selectedChallenge.files && selectedChallenge.files.length > 0}
            <section class="modal-section">
              <div class="section-label">
                <Download size={14} />
                ATTACHMENTS
              </div>
              <div class="files-list">
                {#each selectedChallenge.files as fileUrl}
                  {@const FileIcon = getFileIcon(fileUrl)}
                  <a href={normalizeFileUrl(fileUrl)} target="_blank" rel="noreferrer" class="file-link">
                    <FileIcon size={16} />
                    <span>{truncateMiddle(getFileName(fileUrl))}</span>
                  </a>
                {/each}
              </div>
            </section>
          {/if}

          <!-- Flag submission -->
          <section class="modal-section flag-box">
            <div class="section-label">
              <Flag size={14} />
              SUBMIT FLAG
            </div>
            
            <form class="flag-form" onsubmit={handleFlagSubmit}>
              <div class="flag-input-wrap">
                <span class="flag-prompt">FLAG{'>'}</span>
                <input
                  type="text"
                  bind:value={flagInput}
                  placeholder="flag{'{'} ... {'}'}"
                  class="flag-input"
                  required
                />
              </div>
              <button type="submit" class="submit-btn" disabled={submittingFlag}>
                {#if submittingFlag}
                  <Loader size={14} class="spinning" />
                {:else}
                  <Flag size={14} />
                {/if}
                SUBMIT
              </button>
            </form>

            {#if submitMessage}
              <div class="flag-result flag-result--success">
                <CheckCircle size={16} />
                <span>{submitMessage}</span>
              </div>
            {/if}
            {#if submitError}
              <div class="flag-result flag-result--error">
                <AlertTriangle size={16} />
                <span>{submitError}</span>
              </div>
            {/if}
          </section>
        </div>
      {:else}
        <div class="modal-state modal-state--error">
          <AlertTriangle size={28} />
          <span>Failed to load challenge</span>
          <button type="button" class="action-btn" onclick={closeModal}>Close</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* ============================================
     PAGE LAYOUT
     ============================================ */
  .challenges-page {
    animation: fadeUp 0.5s ease-out forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: none; }
  }

  /* Header */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-icon {
    color: var(--color-terminal);
  }

  .header-text h1 {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin: 0;
    color: var(--text-primary);
  }

  .header-text p {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin: 0.25rem 0 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .stats-display {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .stat-block {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-number {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-terminal);
  }

  .stat-label {
    font-size: 0.55rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }

  .stat-sep {
    color: var(--text-muted);
    font-size: 1.25rem;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .refresh-btn:hover:not(:disabled) {
    border-color: var(--color-terminal);
    color: var(--color-terminal);
  }

  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Filters */
  .filters-bar {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
  }

  .filter-chip {
    padding: 0.3rem 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-chip:hover {
    border-color: var(--color-border-bright);
    color: var(--text-primary);
  }

  .filter-chip.active {
    background: var(--color-terminal-muted);
    border-color: var(--color-terminal);
    color: var(--color-terminal);
  }

  .filter-chip--cyan.active {
    background: rgba(0, 212, 255, 0.15);
    border-color: var(--color-cyan);
    color: var(--color-cyan);
  }

  .filter-chip--amber.active {
    background: rgba(255, 184, 0, 0.15);
    border-color: var(--color-amber);
    color: var(--color-amber);
  }

  .filter-chip--magenta.active {
    background: rgba(255, 0, 110, 0.15);
    border-color: var(--color-magenta);
    color: var(--color-magenta);
  }

  .chip-count {
    padding: 2px 6px;
    background: var(--color-border);
    font-size: 0.6rem;
  }

  /* State messages */
  .state-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem;
    color: var(--text-tertiary);
  }

  .state-message--error {
    color: var(--color-red);
  }

  /* Category sections */
  .category-section {
    margin-bottom: 2.5rem;
    animation: fadeUp 0.4s ease-out forwards;
    animation-delay: var(--delay);
    opacity: 0;
  }

  .category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .category-title {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--text-secondary);
    margin: 0;
  }

  .title-deco {
    color: var(--color-terminal);
    margin-right: 0.5rem;
  }

  .category-count {
    font-size: 0.55rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.25rem 0.5rem;
    border: 1px solid currentColor;
  }

  .count--terminal { color: var(--color-terminal); background: var(--color-terminal-muted); }
  .count--cyan { color: var(--color-cyan); background: rgba(0, 212, 255, 0.15); }
  .count--amber { color: var(--color-amber); background: rgba(255, 184, 0, 0.15); }
  .count--magenta { color: var(--color-magenta); background: rgba(255, 0, 110, 0.15); }

  /* Challenge cards */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }

  .challenge-card {
    padding: 1.25rem;
    text-align: left;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    animation: fadeUp 0.35s ease-out forwards;
    animation-delay: var(--delay);
    opacity: 0;
  }

  .challenge-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: var(--color-terminal);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .card--cyan::before { background: var(--color-cyan); }
  .card--amber::before { background: var(--color-amber); }
  .card--magenta::before { background: var(--color-magenta); }

  .challenge-card:hover {
    border-color: var(--color-terminal-dim);
    transform: translateY(-2px);
  }

  .challenge-card:hover::before {
    opacity: 1;
  }

  .challenge-card.solved {
    border-color: var(--color-terminal-dim);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .card-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.3;
  }

  .card-points {
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-terminal);
    white-space: nowrap;
  }

  .card-info {
    display: flex;
    gap: 1rem;
    font-size: 0.65rem;
    color: var(--text-tertiary);
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .info-item--docker {
    color: var(--color-cyan);
  }

  .card-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-terminal);
  }

  /* ============================================
     MODAL STYLES
     ============================================ */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: grid;
    place-items: center;
    padding: 1rem;
    isolation: isolate;
    background: rgba(0, 0, 0, 0.88);
    backdrop-filter: blur(6px);
  }

  .modal-overlay-close {
    position: absolute;
    inset: 0;
    z-index: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .modal-panel {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 800px;
    max-height: calc(100vh - 2rem);
    background: var(--color-abyss);
    border: 1px solid var(--color-border-bright);
    box-shadow:
      0 0 80px rgba(0, 255, 65, 0.1),
      0 25px 80px rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem 2rem;
    color: var(--text-tertiary);
  }

  .modal-state--error {
    color: var(--color-red);
  }

  /* Modal header */
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    gap: 1rem;
  }

  .modal-title {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--text-primary);
    margin: 0 0 0.5rem;
  }

  .modal-tags {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border: 1px solid currentColor;
  }

  .tag--category {
    color: var(--color-terminal);
    background: var(--color-terminal-muted);
  }

  .tag--points {
    font-family: var(--font-display);
    color: var(--color-amber);
    background: rgba(255, 184, 0, 0.15);
  }

  .tag--solves {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-tertiary);
    background: var(--color-surface);
  }

  .modal-close {
    padding: 0.5rem;
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .modal-close:hover {
    border-color: var(--color-red);
    color: var(--color-red);
  }

  /* Modal body */
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .modal-section {
    margin-bottom: 1.5rem;
  }

  .modal-section:last-child {
    margin-bottom: 0;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }

  /* Description */
  .description-box {
    font-size: 0.875rem;
    line-height: 1.7;
    color: var(--text-secondary);
    padding: 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }

  /* Markdown styles */
  .markdown :global(p) { margin: 0 0 1em; }
  .markdown :global(p:last-child) { margin-bottom: 0; }
  .markdown :global(h1), .markdown :global(h2), .markdown :global(h3), .markdown :global(h4) {
    font-family: var(--font-display);
    color: var(--text-primary);
    margin: 1.5em 0 0.75em;
    font-weight: 700;
  }
  .markdown :global(h1:first-child), .markdown :global(h2:first-child), .markdown :global(h3:first-child) { margin-top: 0; }
  .markdown :global(h1) { font-size: 1.5rem; }
  .markdown :global(h2) { font-size: 1.25rem; }
  .markdown :global(h3) { font-size: 1.1rem; }
  .markdown :global(ul), .markdown :global(ol) { margin: 0 0 1em; padding-left: 1.5em; }
  .markdown :global(li) { margin: 0.25em 0; }
  .markdown :global(a) { color: var(--color-cyan); text-decoration: underline; }
  .markdown :global(a:hover) { color: var(--color-cyan-dim); }
  .markdown :global(blockquote) {
    margin: 1em 0;
    padding-left: 1em;
    border-left: 3px solid var(--color-terminal);
    color: var(--text-tertiary);
    font-style: italic;
  }
  .markdown :global(code) {
    background: var(--color-abyss);
    padding: 2px 6px;
    font-size: 0.85em;
    color: var(--color-terminal);
    font-family: var(--font-mono);
  }
  .markdown :global(pre) {
    background: var(--color-abyss);
    padding: 1rem;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    margin: 1em 0;
  }
  .markdown :global(pre code) { background: none; padding: 0; }
  .markdown :global(hr) { border: none; border-top: 1px solid var(--color-border); margin: 2em 0; }

  /* Container section */
  .container-box {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: 1rem;
  }

  .container-actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--color-abyss);
    border: 1px solid var(--color-border);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn:hover:not(:disabled) {
    border-color: var(--color-terminal);
    color: var(--color-terminal);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn--danger:hover:not(:disabled) {
    border-color: var(--color-red);
    color: var(--color-red);
  }

  .container-status {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--color-abyss);
    border: 1px solid var(--color-border);
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }

  .container-status--active {
    flex-direction: column;
    align-items: stretch;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    color: var(--color-terminal);
  }

  .status-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-terminal);
    box-shadow: 0 0 8px var(--color-terminal-glow);
  }

  .status-indicator--off {
    background: var(--color-red);
    box-shadow: 0 0 8px rgba(255, 0, 68, 0.5);
  }

  .status-expiry {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-amber);
    margin-left: auto;
    font-weight: 500;
  }

  .connection-list, .command-list {
    margin-top: 0.75rem;
  }

  .connection-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: var(--color-cyan);
    text-decoration: none;
    margin-right: 1rem;
  }

  .connection-link:hover {
    text-decoration: underline;
  }

  .command-code {
    display: block;
    padding: 0.5rem;
    background: var(--color-void);
    font-size: 0.75rem;
    color: var(--color-terminal);
    margin-top: 0.25rem;
  }

  .container-msg {
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  .container-msg--success {
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid var(--color-terminal-dim);
    color: var(--color-terminal);
  }

  .container-msg--error {
    background: rgba(255, 0, 68, 0.1);
    border: 1px solid var(--color-red-dim);
    color: var(--color-red);
  }

  /* Files */
  .files-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.5rem;
  }

  .file-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.75rem;
    transition: all 0.15s ease;
  }

  .file-link:hover {
    border-color: var(--color-terminal-dim);
    color: var(--color-terminal);
  }

  /* Flag submission */
  .flag-box {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: 1rem;
  }

  .flag-form {
    display: flex;
    gap: 0.75rem;
  }

  .flag-input-wrap {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }

  .flag-prompt {
    position: absolute;
    left: 0.75rem;
    font-weight: 700;
    color: var(--color-terminal);
    font-size: 0.75rem;
    pointer-events: none;
  }

  .flag-input {
    width: 100%;
    padding: 0.6rem 0.75rem 0.6rem 3.5rem;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    background: var(--color-abyss);
    border: 1px solid var(--color-border);
    color: var(--text-primary);
    transition: all 0.15s ease;
  }

  .flag-input:focus {
    outline: none;
    border-color: var(--color-terminal);
    box-shadow: 0 0 0 1px var(--color-terminal), 0 0 15px var(--color-terminal-glow);
  }

  .flag-input::placeholder {
    color: var(--text-muted);
  }

  .submit-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--color-terminal);
    border: 1px solid var(--color-terminal);
    color: var(--color-void);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--color-terminal-bright);
    box-shadow: 0 0 20px var(--color-terminal-glow);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .flag-result {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .flag-result--success {
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid var(--color-terminal-dim);
    color: var(--color-terminal);
  }

  .flag-result--error {
    background: rgba(255, 0, 68, 0.1);
    border: 1px solid var(--color-red-dim);
    color: var(--color-red);
  }

  /* Spinner utility */
  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .header-right {
      width: 100%;
      justify-content: space-between;
    }

    .cards-grid {
      grid-template-columns: 1fr;
    }

    .modal-panel {
      max-height: calc(100vh - 1rem);
    }

    .flag-form {
      flex-direction: column;
    }
  }
</style>
