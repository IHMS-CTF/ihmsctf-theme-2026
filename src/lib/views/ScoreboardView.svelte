<script lang="ts">
  import { onMount } from 'svelte'
  import { Chart, type ChartConfiguration, registerables } from 'chart.js'
  import {
    getScoreboard,
    getTopScoreboard,
    init,
    type ScoreboardEntry,
    type TopScoreboardEntry,
  } from '$lib/ctfd.svelte'

  Chart.register(...registerables)

  let loading = $state(true)
  let errorMessage = $state('')
  let entries = $state<ScoreboardEntry[]>([])
  let topEntries = $state<TopScoreboardEntry[]>([])
  let chartCanvas = $state<HTMLCanvasElement | null>(null)
  let scoreChart: Chart | null = null

  const buildCumulativeSeries = (entry: TopScoreboardEntry) => {
    const solves = [...(entry.solves ?? [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const points: number[] = []
    let running = 0
    for (const solve of solves) {
      running += solve.value ?? 0
      points.push(running)
    }

    if (points.length === 0) {
      points.push(entry.score)
    }

    return points
  }

  const renderChart = () => {
    if (!chartCanvas || topEntries.length === 0) {
      return
    }

    const maxSolveCount = Math.max(
      1,
      ...topEntries.map((entry) => Math.max(1, entry.solves?.length ?? 0)),
    )

    const labels = Array.from({ length: maxSolveCount }, (_, i) => `Solve ${i + 1}`)
    const palette = [
      '#60a5fa',
      '#34d399',
      '#f59e0b',
      '#f472b6',
      '#a78bfa',
      '#22d3ee',
      '#fb7185',
      '#facc15',
      '#2dd4bf',
      '#c084fc',
    ]

    const datasets = topEntries.map((entry, index) => {
      const series = buildCumulativeSeries(entry)
      const padded = [...series]
      while (padded.length < maxSolveCount) {
        padded.push(padded[padded.length - 1] ?? entry.score)
      }

      return {
        label: entry.name,
        data: padded,
        borderColor: palette[index % palette.length],
        backgroundColor: `${palette[index % palette.length]}33`,
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 2,
      }
    })

    scoreChart?.destroy()

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
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
            labels: {
              color: '#cbd5e1',
              boxWidth: 14,
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#e2e8f0',
            bodyColor: '#cbd5e1',
          },
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: '#1e293b' },
          },
          y: {
            ticks: { color: '#94a3b8' },
            grid: { color: '#1e293b' },
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
    topEntries = topResult.data
    loading = false

    await Promise.resolve()
    renderChart()
  }

  onMount(() => {
    void (async () => {
      await init()
      await refreshScoreboard()
    })()

    return () => {
      scoreChart?.destroy()
    }
  })
</script>

<section class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40 sm:p-8">
  <div class="mb-6 flex items-center justify-between gap-3">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">Scoreboard</h1>
      <p class="mt-2 text-sm text-slate-400">Team rankings and top-10 score progression.</p>
    </div>
    <button
      type="button"
      onclick={refreshScoreboard}
      class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-700"
    >
      Refresh
    </button>
  </div>

  {#if loading}
    <p class="text-sm text-slate-400">Loading scoreboard...</p>
  {:else}
    {#if errorMessage}
      <p class="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-sm font-medium text-red-200">{errorMessage}</p>
    {/if}

    <div class="mb-6 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
      <h2 class="mb-3 text-lg font-semibold text-slate-100">Top 10 Team Score Progression</h2>
      {#if topEntries.length > 0}
        <div class="h-80 w-full">
          <canvas bind:this={chartCanvas}></canvas>
        </div>
      {:else}
        <p class="text-sm text-slate-400">No top-10 history data available.</p>
      {/if}
    </div>

    <div class="rounded-xl border border-slate-700 bg-slate-900/70">
      <div class="grid grid-cols-12 border-b border-slate-700 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span class="col-span-2">Place</span>
        <span class="col-span-7">Team</span>
        <span class="col-span-3 text-right">Points</span>
      </div>

      {#if entries.length === 0}
        <p class="px-4 py-4 text-sm text-slate-400">No teams found.</p>
      {:else}
        <ul>
          {#each entries as entry}
            <li class="grid grid-cols-12 items-center border-b border-slate-800 px-4 py-3 text-sm last:border-b-0">
              <span class="col-span-2 font-semibold text-slate-200">#{entry.pos}</span>
              <span class="col-span-7 truncate text-slate-100">{entry.name}</span>
              <span class="col-span-3 text-right font-semibold text-sky-300">{entry.score}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</section>
