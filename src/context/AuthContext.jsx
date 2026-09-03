import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import { fetchProfile } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  /* -------------------------------------------------------------- */
  /* Session                                                         */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        setSession(data.session ?? null)
        setAuthReady(true)
      })
      .catch(() => active && setAuthReady(true))

    // NOTE: never await Supabase calls inside this callback - it runs on the
    // auth lock and awaiting here can deadlock. Profile loading happens in
    // the effect below instead.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession ?? null)
        setAuthReady(true)
      },
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  /* -------------------------------------------------------------- */
  /* Profile (role + approval status)                                */
  /* -------------------------------------------------------------- */
  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (!authReady) return

    if (!userId) {
      setProfile(null)
      setProfileError(null)
      setProfileLoading(false)
      return
    }

    let active = true
    setProfileLoading(true)

    fetchProfile(userId)
      .then((data) => {
        if (!active) return
        setProfile(data)
        setProfileError(data ? null : 'Your profile could not be found.')
      })
      .catch((error) => {
        if (!active) return
        console.error('Failed to load profile:', error)
        setProfileError(error.message)
      })
      .finally(() => active && setProfileLoading(false))

    return () => {
      active = false
    }
  }, [userId, authReady, reloadKey])

  const refreshProfile = useCallback(() => setReloadKey((key) => key + 1), [])

  /* -------------------------------------------------------------- */
  /* Actions                                                         */
  /* -------------------------------------------------------------- */
  const signUp = useCallback(async ({ email, password, fullName, company }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName?.trim() || null,
          company: company?.trim() || null,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (error) throw new Error(friendlyAuthError(error.message))

    return {
      needsEmailConfirmation: Boolean(data.user && !data.session),
      user: data.user,
    }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw new Error(friendlyAuthError(error.message))
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }, [])

  const requestPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` },
    )
    if (error) throw new Error(friendlyAuthError(error.message))
  }, [])

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(friendlyAuthError(error.message))
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      isAuthenticated: Boolean(session),
      isApproved: profile?.status === 'approved',
      isAdmin: profile?.role === 'admin',
      loading: !authReady || (Boolean(userId) && profileLoading && !profile),
      refreshProfile,
      signUp,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
    }),
    [
      session,
      profile,
      profileError,
      authReady,
      userId,
      profileLoading,
      refreshProfile,
      signUp,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

/** Turn Supabase's terse auth errors into something a customer can act on. */
function friendlyAuthError(message = '') {
  const lowered = message.toLowerCase()

  if (lowered.includes('invalid login credentials')) {
    return 'That email and password combination is not correct.'
  }
  if (lowered.includes('email not confirmed')) {
    return 'Please confirm your email address first - check your inbox.'
  }
  if (lowered.includes('user already registered') || lowered.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (lowered.includes('password should be at least')) {
    return 'Your password is too short - use at least 8 characters.'
  }
  if (lowered.includes('rate limit') || lowered.includes('too many requests')) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  if (lowered.includes('failed to fetch') || lowered.includes('network')) {
    return 'Could not reach the server. Check your connection and try again.'
  }

  return message || 'Something went wrong. Please try again.'
}
