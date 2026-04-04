<script lang="ts">
    import { onMount } from 'svelte'
    import { init, login } from '$lib/ctfd.svelte'

    let username = $state('')
    let password = $state('')
    let errorMessage = $state('')
    let successMessage = $state('')
    let isSubmitting = $state(false)
    let isReady = $state(false)

    onMount(async () => {
        await init()
        isReady = true
    })

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault()
        errorMessage = ''
        successMessage = ''
        isSubmitting = true

        try {
            const result = await login(username, password)

            if (result.success) {
                successMessage = 'Login successful! Redirecting...'
                window.location.hash = '#/home'
            } else {
                errorMessage = result.error ?? 'Login failed'
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Login failed'
        } finally {
            isSubmitting = false
        }
    }
</script>

<section class="mx-auto mt-10 max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40 sm:p-8">
    <h1 class="mb-6 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">Login</h1>

    {#if successMessage}
        <div class="mb-4 rounded-lg border border-emerald-900/60 bg-emerald-950/40 p-4 text-sm font-medium text-emerald-200">
            {successMessage}
        </div>
    {/if}

    {#if errorMessage}
        <div class="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 p-4 text-sm font-medium text-red-200">
            {errorMessage}
        </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
        <div>
            <label for="username" class="mb-1 block text-sm font-medium text-slate-300">Username or Email</label>
            <input 
                id="username" 
                type="text" 
                name="username" 
                bind:value={username}
                placeholder="Enter your username or email"
                required
                autocomplete="username"
                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
            />
        </div>
        <div>
            <label for="password" class="mb-1 block text-sm font-medium text-slate-300">Password</label>
            <input 
                id="password" 
                type="password" 
                name="password" 
                bind:value={password}
                placeholder="Enter your password"
                required
                autocomplete="current-password"
                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
            />
        </div>
        <button 
            type="submit" 
            disabled={!isReady || isSubmitting}
            class="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
    </form>
</section>
