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

<section class="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <h1 class="mb-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Login</h1>

    {#if successMessage}
        <div class="mb-4 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700">
            {successMessage}
        </div>
    {/if}

    {#if errorMessage}
        <div class="mb-4 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorMessage}
        </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
        <div>
            <label for="username" class="mb-1 block text-sm font-medium text-slate-700">Username or Email</label>
            <input 
                id="username" 
                type="text" 
                name="username" 
                bind:value={username}
                placeholder="Enter your username or email"
                required
                autocomplete="username"
                class="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
            />
        </div>
        <div>
            <label for="password" class="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input 
                id="password" 
                type="password" 
                name="password" 
                bind:value={password}
                placeholder="Enter your password"
                required
                autocomplete="current-password"
                class="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
            />
        </div>
        <button 
            type="submit" 
            disabled={!isReady || isSubmitting}
            class="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
    </form>
</section>
