// When using Caddy proxy, all requests are same-origin (no CORS issues)
// Use relative URLs so requests go through the same domain

type CsrfTokenResponse = {
    csrf_token?: string
    data?: { csrf_token?: string }
}

type LoginResponse = {
    success?: boolean
    errors?: string[]
    message?: string
    redirect?: string
}

type MeResponse = {
    success?: boolean
    data?: { id?: number; name?: string }
}

type ChallengeFile = string

type ChallengeTypeData = {
    id?: string
    name?: string
    templates?: Record<string, string>
    scripts?: Record<string, string>
}

type ChallengeHint = {
    id: number
    title?: string
    cost?: number
    content?: string
}

export type Challenge = {
    id: number
    name: string
    value: number
    description?: string
    category?: string
    type?: string
    type_data?: ChallengeTypeData
    connection_info?: string
    connection_type?: string
    image?: string
    internal_port?: number
    max_attempts?: number
    solves?: number
    solved_by_me?: boolean
    attempts?: number
    files?: ChallengeFile[]
    tags?: string[]
    hints?: ChallengeHint[]
    view?: string
}

type ChallengesListResponse = {
    success?: boolean
    data?: Challenge[]
    errors?: string[]
}

type ChallengeDetailResponse = {
    success?: boolean
    data?: Challenge
    errors?: string[]
}

type ChallengeAttemptResponse = {
    success?: boolean
    data?: {
        status?: 'correct' | 'incorrect' | 'already_solved' | 'ratelimited' | 'paused' | 'authentication_required'
        message?: string
    }
    errors?: string[]
}

export type ScoreboardEntry = {
    pos: number
    account_id: number
    account_url?: string
    account_type?: string
    oauth_id?: number | null
    name: string
    score: number
    bracket_id?: number | null
    bracket_name?: string | null
    members?: Array<{ id?: number; name?: string; score?: number }>
}

export type SolveEvent = {
    challenge_id: number | null
    account_id: number
    team_id?: number
    user_id?: number
    value: number
    date: string
}

export type TopScoreboardEntry = {
    id: number
    account_url?: string
    name: string
    score: number
    bracket_id?: number | null
    bracket_name?: string | null
    solves: SolveEvent[]
}

export type TeamDetail = {
    id: number
    name: string
    score: number
    email?: string | null
    affiliation?: string | null
    country?: string | null
    website?: string | null
    hidden?: boolean
    banned?: boolean
    captain_id?: number | null
    created?: string
    members?: number[]
}

export type PublicUser = {
    id: number
    name: string
    score: number
    team_id?: number | null
    email?: string | null
    affiliation?: string | null
    country?: string | null
    website?: string | null
    hidden?: boolean
    banned?: boolean
    created?: string
    type?: string
    place?: number | null
}

type ScoreboardResponse = {
    success?: boolean
    data?: ScoreboardEntry[]
    errors?: string[]
}

type TopScoreboardResponse = {
    success?: boolean
    data?: Record<string, TopScoreboardEntry>
    errors?: string[]
}

type TeamDetailResponse = {
    success?: boolean
    data?: TeamDetail
    errors?: string[]
}

type PublicUserResponse = {
    success?: boolean
    data?: PublicUser
    errors?: string[]
}

export type ContainerConnection = {
    host?: string
    port?: number
    ports?: Record<string, number>
    type?: string
    info?: string
    urls?: Array<{ label?: string; url: string }>
}

export type ContainerInstanceInfo = {
    status: 'created' | 'existing' | 'running' | 'provisioning' | 'not_found'
    connection?: ContainerConnection
    expires_at?: number
    renewal_count?: number
    max_renewals?: number
}

type ContainerInfoApiResponse = {
    status?: 'running' | 'provisioning' | 'not_found'
    connection?: ContainerConnection
    expires_at?: number
    renewal_count?: number
    error?: string
}

type ContainerRequestApiResponse = {
    status?: 'created' | 'existing'
    connection?: ContainerConnection
    expires_at?: number
    renewal_count?: number
    max_renewals?: number
    error?: string
}

type ContainerRenewApiResponse = {
    success?: boolean
    expires_at?: number
    renewal_count?: number
    error?: string
}

type ContainerStopApiResponse = {
    success?: boolean
    error?: string
}

interface CtfdState {
    isLoggedIn: boolean
    csrfToken?: string
}

export const state: CtfdState = $state({
    isLoggedIn: getStoredIsLoggedIn(),
})

export async function init() {
    await refreshCsrfToken()
}

export async function refreshCsrfToken(): Promise<string> {
    try {
        const response = await fetch('/api/v1/csrf_token', {
            method: 'GET',
            credentials: 'include',
        })

        if (!response.ok) {
            console.error('Failed to fetch CSRF token')
            return ''
        }

        const data = (await response.json()) as CsrfTokenResponse
        const token = data.data?.csrf_token ?? data.csrf_token

        if (!token) {
            console.error('CSRF token not found in response')
            return ''
        }

        state.csrfToken = token
        return token
    } catch (error) {
        console.error('Error fetching CSRF token:', error)
        return ''
    }
}

export async function getCsrfToken(): Promise<string> {
    if (!state.csrfToken) {
        return await refreshCsrfToken()
    }
    return state.csrfToken
}

function getStoredIsLoggedIn(): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('ctfd_isLoggedIn') === 'true'
}

function setStoredIsLoggedIn(isLoggedIn: boolean) {
    if (typeof window === 'undefined') return
    localStorage.setItem('ctfd_isLoggedIn', isLoggedIn.toString())
}

export function setIsLoggedIn(isLoggedIn: boolean) {
    state.isLoggedIn = isLoggedIn
    setStoredIsLoggedIn(isLoggedIn)
}

export async function login(
    name: string,
    password: string
): Promise<{ success: boolean; error?: string; redirect?: string }> {
    try {
        const csrfToken = await getCsrfToken()
        if (!csrfToken) {
            return { success: false, error: 'Failed to fetch CSRF token' }
        }

        const formData = new URLSearchParams({
            name,
            password,
            _submit: 'Submit',
            nonce: csrfToken,
        })

        const response = await fetch('/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'CSRF-Token': csrfToken,
            },
            body: formData.toString(),
        })

        const contentType = response.headers.get('content-type') ?? ''

        if (contentType.includes('application/json')) {
            const data = (await response.json()) as LoginResponse
            if (!response.ok || data.success === false) {
                const errorMsg = data.errors?.[0] ?? data.message ?? 'Login failed'
                return { success: false, error: errorMsg }
            }
        } else if (!response.ok && response.status !== 302) {
            return { success: false, error: `Login failed (${response.status})` }
        }

        const meResponse = await fetch('/api/v1/users/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'CSRF-Token': csrfToken,
            },
        })

        if (!meResponse.ok) {
            return { success: false, error: 'Login failed to establish session' }
        }

        const meData = (await meResponse.json()) as MeResponse
        if (!meData.success || !meData.data?.id) {
            return { success: false, error: 'Login session verification failed' }
        }

        // Refresh CSRF token after successful login
        await refreshCsrfToken()
        setIsLoggedIn(true)

        return { success: true }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Login failed'
        return { success: false, error: errorMsg }
    }
}

export async function logout(): Promise<void> {
    try {
        const csrfToken = await getCsrfToken()

        await fetch('/logout', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'CSRF-Token': csrfToken,
            },
        })

        setIsLoggedIn(false)
        await refreshCsrfToken()
    } catch (error) {
        console.error('Failed to log out:', error)
    }
}

export async function getChallenges(): Promise<{ success: boolean; data?: Challenge[]; error?: string }> {
    try {
        const response = await fetch('/api/v1/challenges', {
            method: 'GET',
            credentials: 'include',
        })

        if (!response.ok) {
            return { success: false, error: `Failed to load challenges (${response.status})` }
        }

        const data = (await response.json()) as ChallengesListResponse
        if (!data.success || !data.data) {
            return { success: false, error: data.errors?.[0] ?? 'Failed to load challenges' }
        }

        return { success: true, data: data.data }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to load challenges' }
    }
}

export async function getChallenge(challengeId: number): Promise<{ success: boolean; data?: Challenge; error?: string }> {
    try {
        const response = await fetch(`/api/v1/challenges/${challengeId}`, {
            method: 'GET',
            credentials: 'include',
        })

        if (!response.ok) {
            return { success: false, error: `Failed to load challenge (${response.status})` }
        }

        const data = (await response.json()) as ChallengeDetailResponse
        if (!data.success || !data.data) {
            return { success: false, error: data.errors?.[0] ?? 'Failed to load challenge' }
        }

        return { success: true, data: data.data }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to load challenge' }
    }
}

export async function submitFlag(challengeId: number, flag: string): Promise<{ success: boolean; status?: string; message?: string; error?: string }> {
    try {
        const csrfToken = await getCsrfToken()
        if (!csrfToken) {
            return { success: false, error: 'Failed to fetch CSRF token' }
        }

        const response = await fetch('/api/v1/challenges/attempt', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
            },
            body: JSON.stringify({
                challenge_id: challengeId,
                submission: flag,
            }),
        })

        if (!response.ok) {
            return { success: false, error: `Submit failed (${response.status})` }
        }

        const data = (await response.json()) as ChallengeAttemptResponse
        const status = data.data?.status
        const message = data.data?.message

        if (!data.success || !status) {
            return { success: false, error: data.errors?.[0] ?? message ?? 'Submit failed' }
        }

        return {
            success: true,
            status,
            message,
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Submit failed' }
    }
}

export async function getScoreboard(): Promise<{ success: boolean; data?: ScoreboardEntry[]; error?: string }> {
    try {
        const response = await fetch('/api/v1/scoreboard', {
            method: 'GET',
            credentials: 'include',
        })

        if (!response.ok) {
            return { success: false, error: `Failed to load scoreboard (${response.status})` }
        }

        const data = (await response.json()) as ScoreboardResponse
        if (!data.success || !data.data) {
            return { success: false, error: data.errors?.[0] ?? 'Failed to load scoreboard' }
        }

        const sorted = [...data.data].sort((a, b) => a.pos - b.pos)
        return { success: true, data: sorted }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to load scoreboard' }
    }
}

export async function getTopScoreboard(limit = 10): Promise<{ success: boolean; data?: TopScoreboardEntry[]; error?: string }> {
    try {
        const response = await fetch(`/api/v1/scoreboard/top/${limit}`, {
            method: 'GET',
            credentials: 'include',
        })

        if (!response.ok) {
            return { success: false, error: `Failed to load top scoreboard (${response.status})` }
        }

        const data = (await response.json()) as TopScoreboardResponse
        if (!data.success || !data.data) {
            return { success: false, error: data.errors?.[0] ?? 'Failed to load top scoreboard' }
        }

        const entries = Object.values(data.data).sort((a, b) => b.score - a.score)
        return { success: true, data: entries }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to load top scoreboard' }
    }
}

export async function getTeam(teamId: number): Promise<{ success: boolean; data?: TeamDetail; error?: string }> {
    try {
        const response = await fetch(`/api/v1/teams/${teamId}`, {
            method: 'GET',
            credentials: 'include',
        })

        if (!response.ok) {
            return { success: false, error: `Failed to load team (${response.status})` }
        }

        const data = (await response.json()) as TeamDetailResponse
        if (!data.success || !data.data) {
            return { success: false, error: data.errors?.[0] ?? 'Failed to load team' }
        }

        return { success: true, data: data.data }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to load team' }
    }
}

export async function getPublicUser(userId: number): Promise<{ success: boolean; data?: PublicUser; error?: string }> {
    try {
        const response = await fetch(`/api/v1/users/${userId}`, {
            method: 'GET',
            credentials: 'include',
        })

        if (!response.ok) {
            return { success: false, error: `Failed to load user (${response.status})` }
        }

        const data = (await response.json()) as PublicUserResponse
        if (!data.success || !data.data) {
            return { success: false, error: data.errors?.[0] ?? 'Failed to load user' }
        }

        return { success: true, data: data.data }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to load user' }
    }
}

export async function getContainerInfo(challengeId: number): Promise<{ success: boolean; data?: ContainerInstanceInfo; error?: string }> {
    try {
        const csrfToken = await getCsrfToken()
        const response = await fetch(`/api/v1/containers/info/${challengeId}`, {
            method: 'GET',
            credentials: 'include',
            headers: csrfToken ? { 'CSRF-Token': csrfToken } : {},
        })

        if (!response.ok) {
            return { success: false, error: `Failed to fetch container info (${response.status})` }
        }

        const data = (await response.json()) as ContainerInfoApiResponse
        if (data.error) {
            return { success: false, error: data.error }
        }

        return {
            success: true,
            data: {
                status: data.status ?? 'not_found',
                connection: data.connection,
                expires_at: data.expires_at,
                renewal_count: data.renewal_count,
            },
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch container info' }
    }
}

export async function requestContainer(challengeId: number): Promise<{ success: boolean; data?: ContainerInstanceInfo; error?: string }> {
    try {
        const csrfToken = await getCsrfToken()
        if (!csrfToken) {
            return { success: false, error: 'Failed to fetch CSRF token' }
        }

        const response = await fetch('/api/v1/containers/request', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ challenge_id: challengeId }),
        })

        const data = (await response.json()) as ContainerRequestApiResponse
        if (!response.ok || data.error) {
            return { success: false, error: data.error ?? `Failed to request container (${response.status})` }
        }

        return {
            success: true,
            data: {
                status: data.status ?? 'created',
                connection: data.connection,
                expires_at: data.expires_at,
                renewal_count: data.renewal_count,
                max_renewals: data.max_renewals,
            },
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to request container' }
    }
}

export async function renewContainer(challengeId: number): Promise<{ success: boolean; data?: { expires_at?: number; renewal_count?: number }; error?: string }> {
    try {
        const csrfToken = await getCsrfToken()
        if (!csrfToken) {
            return { success: false, error: 'Failed to fetch CSRF token' }
        }

        const response = await fetch('/api/v1/containers/renew', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ challenge_id: challengeId }),
        })

        const data = (await response.json()) as ContainerRenewApiResponse
        if (!response.ok || data.success !== true) {
            return { success: false, error: data.error ?? `Failed to renew container (${response.status})` }
        }

        return {
            success: true,
            data: {
                expires_at: data.expires_at,
                renewal_count: data.renewal_count,
            },
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to renew container' }
    }
}

export async function stopContainer(challengeId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const csrfToken = await getCsrfToken()
        if (!csrfToken) {
            return { success: false, error: 'Failed to fetch CSRF token' }
        }

        const response = await fetch('/api/v1/containers/stop', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ challenge_id: challengeId }),
        })

        const data = (await response.json()) as ContainerStopApiResponse
        if (!response.ok || data.success !== true) {
            return { success: false, error: data.error ?? `Failed to stop container (${response.status})` }
        }

        return { success: true }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to stop container' }
    }
}
