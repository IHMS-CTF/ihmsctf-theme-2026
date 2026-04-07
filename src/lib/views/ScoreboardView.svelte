<script lang="ts">
  import { onMount } from 'svelte'
  import { Chart, type ChartConfiguration, registerables } from 'chart.js'
  import {
    getScoreboard,
    getTeam,
    getTopScoreboard,
    getPublicUser,
    init,
    type PublicUser,
    type ScoreboardEntry,
    type TeamDetail,
    type TopScoreboardEntry,
  } from '$lib/ctfd.svelte'
  import { 
    Trophy, 
    RefreshCw, 
    TrendingUp, 
    Users, 
    Medal,
    Loader,
    AlertTriangle,
    User,
    ExternalLink,
    X
  } from 'lucide-svelte'

  Chart.register(...registerables)

  let loading = $state(true)
  let errorMessage = $state('')
  let entries = $state<ScoreboardEntry[]>([])
  let topEntries = $state<TopScoreboardEntry[]>([])
  let chartCanvas = $state<HTMLCanvasElement | null>(null)
  let scoreChart: Chart | null = null
  let teamModalOpen = $state(false)
  let teamModalVisible = $state(false)
  let teamModalLoading = $state(false)
  let teamModalError = $state('')
  let selectedTeam = $state<TeamDetail | null>(null)
  let teamMembers = $state<PublicUser[]>([])

  const teamPalette = [
    '#00ff41',
    '#00d4ff',
    '#ff006e',
    '#ffb800',
    '#39ff6e',
    '#00a8cc',
    '#ff0044',
    '#9ae84f',
    '#00c8b4',
    '#ffd54a',
    '#7ad8ff',
    '#ff7a59',
  ]

  const getSolveTimestamp = (date: string): number | null => {
    const time = new Date(date).getTime()
    return Number.isFinite(time) ? time : null
  }

  const getSortedSolves = (entry: TopScoreboardEntry) => {
    return [...(entry.solves ?? [])]
      .filter((solve) => getSolveTimestamp(solve.date) !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getTimelineBounds = (data: TopScoreboardEntry[]) => {
    const times = data
      .flatMap((entry) => getSortedSolves(entry).map((solve) => getSolveTimestamp(solve.date)))
      .filter((time): time is number => time !== null)

    if (times.length === 0) {
      const now = Date.now()
      return { start: now - 60 * 60 * 1000, end: now }
    }

    const start = Math.min(...times)
    const end = Math.max(...times)

    if (start === end) {
      return { start, end: end + 60 * 1000 }
    }

    return { start, end }
  }

  const buildCumulativeSeries = (entry: TopScoreboardEntry, start: number, end: number) => {
    const solves = getSortedSolves(entry)

    if (solves.length === 0) {
      return [
        { x: start, y: entry.score },
        { x: end, y: entry.score },
      ]
    }

    const points: Array<{ x: number; y: number }> = [{ x: start, y: 0 }]
    let running = 0

    for (const solve of solves) {
      const solveTime = getSolveTimestamp(solve.date)
      if (solveTime === null) continue
      running += solve.value ?? 0
      points.push({ x: solveTime, y: running })
    }

    const lastPoint = points[points.length - 1]
    if (lastPoint && lastPoint.x < end) {
      points.push({ x: end, y: lastPoint.y })
    }

    return points
  }

  const formatTimelineTick = (value: number) => {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  }

  const getTeamColor = (index: number) => {
    return teamPalette[index % teamPalette.length]
  }

  const getTeamAccent = (accountId: number) => {
    const hue = (accountId * 53) % 360
    return `hsl(${hue} 75% 60%)`
  }

  const renderChart = () => {
    if (!chartCanvas || topEntries.length === 0) return

    const { start, end } = getTimelineBounds(topEntries)

    const datasets = topEntries.map((entry, index) => {
      const color = getTeamColor(index)
      const series = buildCumulativeSeries(entry, start, end)

      return {
        label: entry.name,
        data: series,
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: color,
        fill: false,
      }
    })

    scoreChart?.destroy()

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#4a8060',
              font: {
                family: "'JetBrains Mono', monospace",
                size: 10,
              },
              boxWidth: 12,
              padding: 15,
            },
          },
          tooltip: {
            backgroundColor: '#040d08',
            titleColor: '#00ff41',
            bodyColor: '#8af0a0',
            borderColor: '#0d2922',
            borderWidth: 1,
            titleFont: {
              family: "'JetBrains Mono', monospace",
              size: 11,
              weight: 'bold',
            },
            bodyFont: {
              family: "'JetBrains Mono', monospace",
              size: 11,
            },
            padding: 12,
            displayColors: true,
            boxPadding: 4,
            callbacks: {
              title: (items) => {
                const x = items[0]?.parsed?.x
                return typeof x === 'number' ? formatTimelineTick(x) : 'Time'
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            min: start,
            max: end,
            title: {
              display: true,
              text: 'TIME',
              color: '#4a8060',
              font: {
                family: "'Orbitron', sans-serif",
                size: 10,
                weight: 'bold',
              },
            },
            ticks: { 
              color: '#2d4a38',
              font: {
                family: "'JetBrains Mono', monospace",
                size: 10,
              },
              callback: (value) => formatTimelineTick(Number(value)),
              maxTicksLimit: 6,
            },
            grid: { 
              color: '#0d2922',
              lineWidth: 1,
            },
            border: {
              color: '#0d2922',
            },
          },
          y: {
            title: {
              display: true,
              text: 'POINTS',
              color: '#4a8060',
              font: {
                family: "'Orbitron', sans-serif",
                size: 10,
                weight: 'bold',
              },
            },
            ticks: { 
              color: '#2d4a38',
              font: {
                family: "'JetBrains Mono', monospace",
                size: 10,
              },
            },
            grid: { 
              color: '#0d2922',
              lineWidth: 1,
            },
            border: {
              color: '#0d2922',
            },
          },
        },
      },
    }

    scoreChart = new Chart(chartCanvas, config)
  }

  const refreshScoreboard = async () => {
    loading = true
    errorMessage = ''

    const [scoreboardResult, topResult] = await Promise.all([getScoreboard(), getTopScoreboard(10)])

    if (!scoreboardResult.success || !scoreboardResult.data) {
      errorMessage = scoreboardResult.error ?? 'Failed to load scoreboard'
      entries = []
      topEntries = []
      loading = false
      return
    }

    if (!topResult.success || !topResult.data) {
      errorMessage = topResult.error ?? 'Failed to load top 10 chart'
      entries = scoreboardResult.data
      topEntries = []
      loading = false
      return
    }

    entries = scoreboardResult.data

    const withTeamSolves = await Promise.all(
      topResult.data.map(async (entry) => {
        const teamResult = await getTeam(entry.id)
        if (teamResult.success && teamResult.data?.solves?.length) {
          return {
            ...entry,
            solves: teamResult.data.solves,
          }
        }
        return entry
      })
    )

    topEntries = withTeamSolves
    loading = false

    await Promise.resolve()
    renderChart()
  }

  const getMedalColor = (pos: number) => {
    if (pos === 1) return 'gold'
    if (pos === 2) return 'silver'
    if (pos === 3) return 'bronze'
    return ''
  }

  const openTeamDetails = async (entry: ScoreboardEntry) => {
    teamModalOpen = true
    teamModalVisible = false
    requestAnimationFrame(() => {
      teamModalVisible = true
    })
    teamModalLoading = true
    teamModalError = ''
    selectedTeam = null
    teamMembers = []
    document.body.style.overflow = 'hidden'

    const teamResult = await getTeam(entry.account_id)
    if (!teamResult.success || !teamResult.data) {
      teamModalError = teamResult.error ?? 'Failed to load team details'
      teamModalLoading = false
      return
    }

    selectedTeam = teamResult.data

    const memberIds = teamResult.data.members ?? []
    if (memberIds.length > 0) {
      const memberResults = await Promise.all(memberIds.map((id) => getPublicUser(id)))
      teamMembers = memberResults
        .filter((result): result is { success: true; data: PublicUser } => result.success === true && !!result.data)
        .map((result) => result.data)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    }

    teamModalLoading = false
  }

  const closeTeamDetails = () => {
    teamModalVisible = false
    document.body.style.overflow = ''
    setTimeout(() => {
      teamModalOpen = false
      teamModalLoading = false
      teamModalError = ''
      selectedTeam = null
      teamMembers = []
    }, 180)
  }

  onMount(() => {
    void (async () => {
      await init()
      await refreshScoreboard()
    })()

    return () => {
      scoreChart?.destroy()
      document.body.style.overflow = ''
    }
  })
</script>

<div class="scoreboard-view">
  <!-- Header -->
  <header class="page-header">
    <div class="header-content">
      <div class="header-title">
        <Trophy size={24} strokeWidth={1.5} />
        <h1>SCOREBOARD</h1>
      </div>
      <p class="header-subtitle">Live ranking and score progression</p>
    </div>
    
    <div class="header-actions">
      <div class="stat-card">
        <Users size={16} />
        <span class="stat-value">{entries.length}</span>
        <span class="stat-label">TEAMS</span>
      </div>
      <button type="button" class="btn btn-sm" onclick={refreshScoreboard}>
        <RefreshCw size={14} />
        <span>REFRESH</span>
      </button>
    </div>
  </header>

  {#if loading}
    <div class="loading-state">
      <Loader size={24} class="spinner" />
      <span>Loading scoreboard...</span>
    </div>
  {:else}
    {#if errorMessage}
      <div class="error-state">
        <AlertTriangle size={24} />
        <span>{errorMessage}</span>
      </div>
    {/if}

    <!-- Chart Section -->
    <section class="chart-section panel">
      <div class="panel-header">
        <div class="panel-title">
          <TrendingUp size={14} />
          TOP 10 PROGRESSION
        </div>
      </div>
      <div class="panel-body">
        {#if topEntries.length > 0}
          <div class="chart-container">
            <canvas bind:this={chartCanvas}></canvas>
          </div>
        {:else}
          <div class="empty-chart">
            <TrendingUp size={32} strokeWidth={1} />
            <span>No progression data available</span>
          </div>
        {/if}
      </div>
    </section>

    <!-- Leaderboard Table -->
    <section class="leaderboard-section panel">
      <div class="panel-header">
        <div class="panel-title">
          <Medal size={14} />
          LEADERBOARD
        </div>
        <span class="panel-meta">{entries.length} teams ranked</span>
      </div>
      
      {#if entries.length === 0}
        <div class="empty-table">
          <Users size={32} strokeWidth={1} />
          <span>No teams on the board yet</span>
        </div>
      {:else}
        <div class="table-container">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th class="col-rank">RANK</th>
                <th class="col-team">TEAM</th>
                <th class="col-score">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {#each entries as entry, i}
                {@const medalColor = getMedalColor(entry.pos)}
                <tr 
                  class="team-row"
                  class:gold={medalColor === 'gold'}
                  class:silver={medalColor === 'silver'}
                  class:bronze={medalColor === 'bronze'}
                  style="animation-delay: {i * 20}ms; --team-accent: {getTeamAccent(entry.account_id)}"
                  role="button"
                  tabindex="0"
                  onclick={() => openTeamDetails(entry)}
                  onkeydown={(event) => (event.key === 'Enter' || event.key === ' ') && openTeamDetails(entry)}
                >
                  <td class="col-rank">
                    <div class="rank-display" class:medal={medalColor}>
                      {#if medalColor}
                        <Medal size={14} />
                      {/if}
                      <span>#{entry.pos}</span>
                    </div>
                  </td>
                  <td class="col-team">
                    <span class="team-name-wrap">
                      <span class="team-color-dot" aria-hidden="true"></span>
                      <span class="team-name">{entry.name}</span>
                    </span>
                  </td>
                  <td class="col-score">
                    <span class="score-value">{entry.score.toLocaleString()}</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    {#if teamModalOpen}
      <div
        class="team-modal-backdrop"
        class:visible={teamModalVisible}
        onclick={closeTeamDetails}
        onkeydown={(event) => event.key === 'Escape' && closeTeamDetails()}
        role="button"
        tabindex="0"
        aria-label="Close team details"
      ></div>

      <section class="team-modal" class:visible={teamModalVisible} aria-label="Team details">
        {#if teamModalLoading}
          <div class="team-modal-loading">
            <Loader size={20} class="spinner" />
            <span>Fetching team intel...</span>
          </div>
        {:else if teamModalError}
          <div class="team-modal-error">
            <AlertTriangle size={18} />
            <span>{teamModalError}</span>
          </div>
        {:else if selectedTeam}
          <header class="team-modal-header">
            <div>
              <h2>{selectedTeam.name}</h2>
              <div class="team-modal-meta">
                <span>TEAM #{selectedTeam.id}</span>
                <span>{selectedTeam.score} PTS</span>
                <span>{teamMembers.length} MEMBERS</span>
              </div>
            </div>
            <div class="team-modal-actions">
              <a class="btn btn-sm" href={`/teams/${selectedTeam.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
                <span>TEAM PAGE</span>
              </a>
              <button type="button" class="btn btn-icon" onclick={closeTeamDetails} aria-label="Close team modal">
                <X size={16} />
              </button>
            </div>
          </header>

          <div class="team-members-grid">
            {#if teamMembers.length === 0}
              <div class="team-empty-members">No public member data available.</div>
            {:else}
              {#each teamMembers as member, idx}
                <article class="member-card" style="animation-delay: {idx * 30}ms">
                  <div class="member-left">
                    <span class="member-rank">#{idx + 1}</span>
                    <User size={14} />
                    <span class="member-name">{member.name}</span>
                  </div>
                  <span class="member-score">{member.score ?? 0}</span>
                </article>
              {/each}
            {/if}
          </div>
        {/if}
      </section>
    {/if}
  {/if}
</div>

<style>
  .scoreboard-view {
    animation: fade-in-up 0.4s ease forwards;
  }
  
  /* Header */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-xl);
    margin-bottom: var(--space-xl);
    padding-bottom: var(--space-lg);
    border-bottom: 1px solid var(--color-border);
  }
  
  .header-title {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    color: var(--color-amber);
  }
  
  .header-title h1 {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin: 0;
    color: var(--text-primary);
  }
  
  .header-subtitle {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin: var(--space-sm) 0 0;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--text-tertiary);
  }
  
  .stat-card .stat-value {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--color-terminal);
  }
  
  .stat-card .stat-label {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }
  
  /* Loading/Error states */
  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-3xl);
    color: var(--text-tertiary);
  }
  
  .error-state {
    color: var(--color-red);
  }
  
  /* Chart section */
  .chart-section {
    margin-bottom: var(--space-xl);
    animation: fade-in-up 0.4s ease 0.1s forwards;
    opacity: 0;
  }
  
  .chart-container {
    height: 350px;
    position: relative;
  }
  
  .empty-chart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    height: 200px;
    color: var(--text-tertiary);
  }
  
  /* Leaderboard section */
  .leaderboard-section {
    animation: fade-in-up 0.4s ease 0.2s forwards;
    opacity: 0;
  }
  
  .panel-meta {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  .empty-table {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-3xl);
    color: var(--text-tertiary);
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .leaderboard-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .leaderboard-table th {
    padding: var(--space-md) var(--space-lg);
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-muted);
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-abyss);
  }
  
  .leaderboard-table td {
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--color-border);
  }
  
  .col-rank {
    width: 100px;
  }
  
  .col-score {
    width: 150px;
    text-align: right;
  }
  
  .team-row {
    animation: fade-in-up 0.3s ease forwards;
    opacity: 0;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    cursor: pointer;
  }
  
  .team-row:hover {
    background: var(--color-surface);
    box-shadow: inset 0 0 0 1px rgba(0, 255, 65, 0.12);
  }

  .team-row:focus-visible {
    outline: 2px solid var(--color-terminal);
    outline-offset: -2px;
  }
  
  /* Medal rows */
  .team-row.gold {
    background: rgba(255, 184, 0, 0.05);
  }
  
  .team-row.gold:hover {
    background: rgba(255, 184, 0, 0.1);
  }
  
  .team-row.silver {
    background: rgba(192, 192, 192, 0.03);
  }
  
  .team-row.silver:hover {
    background: rgba(192, 192, 192, 0.06);
  }
  
  .team-row.bronze {
    background: rgba(205, 127, 50, 0.03);
  }
  
  .team-row.bronze:hover {
    background: rgba(205, 127, 50, 0.06);
  }
  
  .rank-display {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-tertiary);
  }
  
  .rank-display.medal {
    color: var(--color-amber);
  }
  
  .team-row.silver .rank-display.medal {
    color: #c0c0c0;
  }
  
  .team-row.bronze .rank-display.medal {
    color: #cd7f32;
  }
  
  .team-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--team-accent, var(--text-primary));
    text-decoration: underline;
    text-decoration-color: transparent;
    transition: text-decoration-color var(--transition-fast);
  }

  .team-name-wrap {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .team-color-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: var(--team-accent, var(--color-terminal));
    box-shadow: 0 0 8px color-mix(in srgb, var(--team-accent, var(--color-terminal)) 55%, transparent);
  }

  .team-row:hover .team-name {
    text-decoration-color: color-mix(in srgb, var(--team-accent, var(--color-terminal)) 42%, transparent);
  }
  
  .score-value {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-terminal);
  }
  
  .team-row.gold .score-value {
    color: var(--color-amber);
    text-shadow: 0 0 10px rgba(255, 184, 0, 0.3);
  }

  .team-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 88;
    background: rgba(0, 0, 0, 0.84);
    backdrop-filter: blur(8px);
    opacity: 0;
    transition: opacity 0.18s ease;
  }

  .team-modal-backdrop.visible {
    opacity: 1;
  }

  .team-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.96);
    width: min(760px, calc(100vw - 2rem));
    max-height: min(82vh, 760px);
    z-index: 89;
    display: flex;
    flex-direction: column;
    background: linear-gradient(160deg, rgba(3, 10, 7, 0.98), rgba(7, 20, 16, 0.96));
    border: 1px solid var(--color-border-bright);
    box-shadow: 0 20px 90px rgba(0, 0, 0, 0.8), 0 0 45px rgba(0, 255, 65, 0.12);
    opacity: 0;
    transition: opacity 0.18s ease, transform 0.18s ease;
  }

  .team-modal.visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  .team-modal-header {
    display: flex;
    justify-content: space-between;
    gap: var(--space-md);
    align-items: flex-start;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .team-modal-header h2 {
    margin: 0;
    font-family: var(--font-display);
    letter-spacing: 0.08em;
    font-size: 1.2rem;
    color: var(--text-primary);
  }

  .team-modal-meta {
    margin-top: 0.4rem;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .team-modal-meta span {
    font-size: 0.64rem;
    letter-spacing: 0.12em;
    color: var(--text-tertiary);
    border: 1px solid var(--color-border);
    background: var(--color-abyss);
    padding: 4px 6px;
  }

  .team-modal-actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .team-members-grid {
    padding: var(--space-lg);
    overflow: auto;
    display: grid;
    gap: var(--space-sm);
    background-image: linear-gradient(transparent 95%, rgba(0, 255, 65, 0.03) 100%);
    background-size: 100% 38px;
  }

  .member-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border);
    background: rgba(4, 13, 8, 0.9);
    animation: fade-in-up 0.25s ease forwards;
    opacity: 0;
  }

  .member-left {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    color: var(--text-secondary);
  }

  .member-rank {
    width: 2.25rem;
    font-family: var(--font-display);
    color: var(--color-cyan);
    font-size: 0.8rem;
  }

  .member-name {
    color: var(--text-primary);
    font-size: 0.86rem;
  }

  .member-score {
    font-family: var(--font-display);
    color: var(--color-terminal);
    font-size: 1rem;
    letter-spacing: 0.06em;
  }

  .team-empty-members,
  .team-modal-loading,
  .team-modal-error {
    padding: var(--space-xl);
    text-align: center;
    color: var(--text-tertiary);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-sm);
  }

  .team-modal-error {
    color: var(--color-red);
  }
  
  /* Animations */
  :global(.spinner) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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
  
  /* Responsive */
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      gap: var(--space-md);
    }
    
    .header-actions {
      width: 100%;
      justify-content: space-between;
    }
    
    .chart-container {
      height: 250px;
    }
    
    .leaderboard-table th,
    .leaderboard-table td {
      padding: var(--space-sm) var(--space-md);
    }
    
    .col-rank {
      width: 60px;
    }
    
    .col-score {
      width: 80px;
    }

    .team-modal {
      width: calc(100vw - 1rem);
      max-height: 84vh;
    }

    .team-modal-header {
      flex-direction: column;
      align-items: stretch;
    }

    .team-modal-actions {
      justify-content: space-between;
    }
  }
</style>
