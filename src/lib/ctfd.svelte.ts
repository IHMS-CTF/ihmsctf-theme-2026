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

        const response = await fetch('/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ name, password }),
        })

        const data = (await response.json()) as LoginResponse

        if (!response.ok || data.success === false) {
            const errorMsg = data.errors?.[0] ?? data.message ?? 'Login failed'
            return { success: false, error: errorMsg }
        }

        // Refresh CSRF token after successful login
        await refreshCsrfToken()
        setIsLoggedIn(true)

        return { success: true, redirect: data.redirect }
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
