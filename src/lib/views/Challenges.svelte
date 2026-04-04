<script lang="ts">
  import { onMount } from 'svelte'
  import { File, FileArchive, FileCode, FileText, Film, Image, Music } from 'lucide-svelte'
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

  type ChallengeGroup = {
    category: string
    colorClasses: string
    challenges: Challenge[]
  }

  const categoryColorClasses = [
    'border-sky-200 bg-sky-50 text-sky-800',
    'border-emerald-200 bg-emerald-50 text-emerald-800',
    'border-amber-200 bg-amber-50 text-amber-800',
    'border-rose-200 bg-rose-50 text-rose-800',
    'border-indigo-200 bg-indigo-50 text-indigo-800',
    'border-cyan-200 bg-cyan-50 text-cyan-800',
  ]

  let loading = $state(true)
  let errorMessage = $state('')
  let groups = $state<ChallengeGroup[]>([])

  let modalOpen = $state(false)
  let modalLoading = $state(false)
  let selectedChallenge = $state<Challenge | null>(null)
  let submitMessage = $state('')
  let submitError = $state('')
  let flagInput = $state('')
  let submittingFlag = $state(false)
  let isModalVisible = $state(false)
  let containerInfo = $state<ContainerInstanceInfo | null>(null)
  let containerLoading = $state(false)
  let containerActionLoading = $state(false)
  let containerMessage = $state('')
  let containerError = $state('')

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
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl
    }
    return `${ctfdurl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`
  }

  const getConnectionLabel = (challenge: Challenge) => {
    if (challenge.connection_info?.trim()) {
      return challenge.connection_info.trim()
    }

    if (challenge.type === 'container' && challenge.internal_port) {
      const protocol = challenge.connection_type === 'https' ? 'https' : 'http'
      return `${protocol}://<instance-host>:${challenge.internal_port}`
    }

    return ''
  }

  const formatExpiry = (timestampMs?: number) => {
    if (!timestampMs) {
      return ''
    }

    const secondsLeft = Math.ceil((timestampMs - Date.now()) / 1000)
    if (secondsLeft <= 0) {
      return 'Expired'
    }

    if (secondsLeft < 60) {
      return `Expires in ${secondsLeft} seconds`
    }

    return `Expires in ${Math.ceil(secondsLeft / 60)} minutes`
  }

  const resolveConnectionLinks = (connection?: ContainerConnection) => {
    if (!connection) {
      return [] as Array<{ label: string; href: string }>
    }

    if (connection.type === 'url_list' && Array.isArray(connection.urls)) {
      return connection.urls
        .filter((entry: { label?: string; url: string } | undefined) => !!entry?.url)
        .map((entry: { label?: string; url: string }) => ({
          label: entry.label || entry.url,
          href: entry.url,
        }))
    }

    if (connection.type === 'url' && connection.urls && connection.urls.length > 0) {
      return connection.urls
        .filter((entry: { label?: string; url: string } | undefined) => !!entry?.url)
        .map((entry: { label?: string; url: string }) => ({
          label: entry.label || entry.url,
          href: entry.url,
        }))
    }

    if (connection.type === 'http' || connection.type === 'web' || connection.type === 'https') {
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

    return [] as Array<{ label: string; href: string }>
  }

  const resolveConnectionCommands = (connection?: ContainerConnection) => {
    if (!connection || !connection.host) {
      return [] as string[]
    }

    if (connection.type === 'tcp' || connection.type === 'nc') {
      if (connection.ports && Object.keys(connection.ports).length > 0) {
        const portList = Object.values(connection.ports).join(', ')
        return [`nc ${connection.host} ${portList}`]
      }
      if (connection.port) {
        return [`nc ${connection.host} ${connection.port}`]
      }
    }

    if (connection.type === 'ssh') {
      if (connection.ports && Object.keys(connection.ports).length > 0) {
        return Object.values(connection.ports).map((externalPort) => `ssh -p ${externalPort} user@${connection.host}`)
      }
      if (connection.port) {
        return [`ssh -p ${connection.port} user@${connection.host}`]
      }
    }

    return [] as string[]
  }

  const refreshContainerInfo = async (challengeId: number) => {
    containerLoading = true
    containerError = ''

    const result = await getContainerInfo(challengeId)
    if (!result.success) {
      containerInfo = null
      containerError = result.error ?? 'Failed to fetch instance info'
      containerLoading = false
      return
    }

    containerInfo = result.data ?? null
    containerLoading = false
  }

  const handleContainerRequest = async () => {
    if (!selectedChallenge) {
      return
    }

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
    if (!selectedChallenge) {
      return
    }

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
    if (!selectedChallenge) {
      return
    }

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

  const getContainerManagePath = (challengeId: number) => `/containers/${challengeId}`

  const isContainerChallenge = (challenge: Challenge) => {
    const typeId = challenge.type_data?.id?.toLowerCase()
    return challenge.type === 'container' || typeId === 'container'
  }

  const buildGroups = (challenges: Challenge[]): ChallengeGroup[] => {
    const byCategory = new Map<string, Challenge[]>()

    for (const challenge of challenges) {
      const category = challenge.category?.trim() || 'Uncategorized'
      if (!byCategory.has(category)) {
        byCategory.set(category, [])
      }
      byCategory.get(category)?.push(challenge)
    }

    const sortedCategories = [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))

    return sortedCategories.map(([category, categoryChallenges], index) => ({
      category,
      colorClasses: categoryColorClasses[index % categoryColorClasses.length],
      challenges: [...categoryChallenges].sort((a, b) => (a.value ?? 0) - (b.value ?? 0)),
    }))
  }

  const refreshChallenges = async () => {
    loading = true
    errorMessage = ''

    const result = await getChallenges()
    if (!result.success || !result.data) {
      errorMessage = result.error ?? 'Failed to load challenges'
      groups = []
      loading = false
      return
    }

    groups = buildGroups(result.data)
    loading = false
  }

  const openChallenge = async (challenge: Challenge) => {
    modalOpen = true
    isModalVisible = false
    requestAnimationFrame(() => {
      isModalVisible = true
    })
    modalLoading = true
    selectedChallenge = null
    submitMessage = ''
    submitError = ''
    flagInput = ''
    containerInfo = null
    containerLoading = false
    containerActionLoading = false
    containerMessage = ''
    containerError = ''

    const detail = await getChallenge(challenge.id)
    if (!detail.success || !detail.data) {
      submitError = detail.error ?? 'Failed to load challenge details'
      selectedChallenge = challenge
      modalLoading = false
      return
    }

    selectedChallenge = detail.data
    modalLoading = false

    if (isContainerChallenge(detail.data)) {
      await refreshContainerInfo(detail.data.id)
    }
  }

  const closeModal = () => {
    isModalVisible = false
    modalOpen = false
    modalLoading = false
    selectedChallenge = null
    submitMessage = ''
    submitError = ''
    flagInput = ''
    containerInfo = null
    containerLoading = false
    containerActionLoading = false
    containerMessage = ''
    containerError = ''
  }

  const handleFlagSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (!selectedChallenge || !flagInput.trim()) {
      return
    }

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
      if (detail.success && detail.data) {
        selectedChallenge = detail.data
      }
    } else {
      submitError = result.message ?? `Submission result: ${status}`
    }
  }

  onMount(async () => {
    await init()
    await refreshChallenges()
  })
</script>

<section class="animate-in rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40 sm:p-8">
  <div class="mb-6 flex items-center justify-between gap-3">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">Challenges</h1>
      <p class="mt-2 max-w-2xl text-sm text-slate-400">
        Challenges are grouped by category and sorted by point value.
      </p>
    </div>
    <button
      type="button"
      onclick={refreshChallenges}
      class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-700"
    >
      Refresh
    </button>
  </div>

  {#if loading}
    <p class="text-sm text-slate-400">Loading challenges...</p>
  {:else if errorMessage}
    <p class="rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-sm font-medium text-red-200">{errorMessage}</p>
  {:else if groups.length === 0}
    <p class="text-sm text-slate-400">No challenges found.</p>
  {:else}
    <div class="space-y-6">
      {#each groups as group}
        <section class="animate-in rounded-xl border border-slate-800 bg-slate-900/50 p-4" style="animation-delay: 80ms;">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-100">{group.category}</h2>
            <span class={`rounded-full border px-2.5 py-1 text-xs font-semibold ${group.colorClasses}`}>
              {group.challenges.length} challenge{group.challenges.length === 1 ? '' : 's'}
            </span>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each group.challenges as challenge}
              <button
                type="button"
                onclick={() => openChallenge(challenge)}
                class={`w-full rounded-xl border bg-slate-800/90 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-950/40 ${
                  challenge.solved_by_me ? 'border-emerald-600' : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <div class="mb-2 flex items-center justify-between gap-2">
                  <h3 class="line-clamp-2 text-sm font-semibold text-slate-100">{challenge.name}</h3>
                  <span class="rounded-md bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-100">
                    {challenge.value ?? 0} pts
                  </span>
                </div>
                <p class="text-xs text-slate-400">
                  {challenge.solves ?? 0} solves
                  {#if challenge.max_attempts}
                    · max {challenge.max_attempts} attempts
                  {/if}
                </p>
                {#if isContainerChallenge(challenge)}
                  <p class="mt-2 text-xs font-medium text-cyan-300">Docker Challenge</p>
                {/if}
                {#if challenge.solved_by_me}
                  <p class="mt-2 text-xs font-semibold text-emerald-400">Solved</p>
                {/if}
              </button>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</section>

{#if modalOpen}
  <div
    class={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md transition-opacity duration-200 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
    role="button"
    tabindex="0"
    aria-label="Close challenge modal"
    onclick={closeModal}
    onkeydown={(event) => event.key === 'Escape' && closeModal()}
  ></div>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <section class={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-black/50 transition-all duration-200 ${isModalVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
      {#if modalLoading}
        <p class="text-sm text-slate-400">Loading challenge...</p>
      {:else if selectedChallenge}
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-100">{selectedChallenge.name}</h2>
            <p class="mt-1 text-sm text-slate-400">
              {selectedChallenge.category ?? 'Uncategorized'} · {selectedChallenge.value ?? 0} pts · {selectedChallenge.solves ?? 0} solves
            </p>
          </div>
          <button
            type="button"
            onclick={closeModal}
            class="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div class="mb-6 rounded-lg border border-slate-700 bg-slate-800/70 p-4 text-sm leading-relaxed text-slate-200">
          {@html selectedChallenge.description ?? '<p>No description available.</p>'}
        </div>

        {#if isContainerChallenge(selectedChallenge)}
          <div class="mb-6 rounded-lg border border-cyan-800/60 bg-cyan-950/30 p-4">
            <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-200">Docker Instance</h3>

            <div class="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onclick={handleContainerRequest}
                disabled={containerActionLoading}
                class="rounded-lg border border-cyan-700 bg-cyan-900/40 px-3 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-800/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Launch
              </button>
              <button
                type="button"
                onclick={handleContainerRenew}
                disabled={containerActionLoading}
                class="rounded-lg border border-sky-700 bg-sky-900/40 px-3 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-800/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Renew
              </button>
              <button
                type="button"
                onclick={handleContainerStop}
                disabled={containerActionLoading}
                class="rounded-lg border border-rose-700 bg-rose-900/40 px-3 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-800/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Destroy
              </button>
            </div>

            {#if containerLoading}
              <p class="mb-2 text-sm text-cyan-100">Checking instance status...</p>
            {:else if containerInfo && containerInfo.status !== 'not_found'}
              <p class="mb-2 text-sm font-medium text-cyan-100">
                Status: {containerInfo.status}
                {#if containerInfo.expires_at}
                  · {formatExpiry(containerInfo.expires_at)}
                {/if}
              </p>

              {#if resolveConnectionLinks(containerInfo.connection).length > 0}
                <div class="mb-2 flex flex-col gap-1">
                  {#each resolveConnectionLinks(containerInfo.connection) as link}
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      class="break-all text-sm font-medium text-cyan-100 underline decoration-cyan-400/60 underline-offset-2 hover:text-white"
                    >
                      {link.label}
                    </a>
                  {/each}
                </div>
              {/if}

              {#if resolveConnectionCommands(containerInfo.connection).length > 0}
                <div class="mb-2 flex flex-col gap-1">
                  {#each resolveConnectionCommands(containerInfo.connection) as command}
                    <code class="rounded bg-slate-900/70 px-2 py-1 text-xs text-cyan-100">{command}</code>
                  {/each}
                </div>
              {/if}

              {#if containerInfo.connection?.info}
                <p class="mb-2 text-xs text-cyan-200">{containerInfo.connection.info}</p>
              {/if}
            {/if}

            {#if !containerInfo || containerInfo.status === 'not_found'}
              <p class="mb-2 text-sm text-cyan-100">No active instance. Launch one to get connection details.</p>
            {/if}

            {#if containerMessage}
              <p class="mt-2 rounded border border-emerald-700/60 bg-emerald-900/30 px-2 py-1 text-sm text-emerald-200">{containerMessage}</p>
            {/if}

            {#if containerError}
              <p class="mt-2 rounded border border-rose-700/60 bg-rose-900/30 px-2 py-1 text-sm text-rose-200">{containerError}</p>
            {/if}
          </div>
        {/if}

        <div class="mb-6">
          <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Files</h3>
          {#if selectedChallenge.files && selectedChallenge.files.length > 0}
            <div class="grid gap-2 sm:grid-cols-2">
              {#each selectedChallenge.files as fileUrl}
                {@const FileIcon = getFileIcon(fileUrl)}
                <a
                  href={normalizeFileUrl(fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  class="group flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-700"
                >
                  <FileIcon size={16} class="text-slate-300 group-hover:text-white" />
                  <span class="truncate">{truncateMiddle(getFileName(fileUrl))}</span>
                </a>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-slate-400">No files attached.</p>
          {/if}
        </div>

        <form class="space-y-3" onsubmit={handleFlagSubmit}>
          <label for="flag-submit" class="block text-sm font-semibold uppercase tracking-wide text-slate-300">
            Submit Flag
          </label>
          <div class="flex flex-col gap-2 sm:flex-row">
            <input
              id="flag-submit"
              type="text"
              bind:value={flagInput}
              placeholder="flag&#123;...&#125;"
              class="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
            <button
              type="submit"
              disabled={submittingFlag}
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingFlag ? 'Submitting...' : 'Submit'}
            </button>
          </div>

          {#if submitMessage}
            <p class="rounded-lg border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm font-medium text-emerald-200">
              {submitMessage}
            </p>
          {/if}

          {#if submitError}
            <p class="rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-sm font-medium text-red-200">
              {submitError}
            </p>
          {/if}
        </form>
      {:else}
        <p class="text-sm text-slate-400">No challenge selected.</p>
      {/if}
    </section>
  </div>
{/if}

<style>
  .animate-in {
    animation: fade-in-up 280ms ease-out;
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
