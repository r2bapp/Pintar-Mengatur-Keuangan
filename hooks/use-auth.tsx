"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase"
import { useRouter } from "next/navigation" // Import useRouter

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]

export function useAuth() {
  const router = useRouter() // Initialize useRouter
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle()

      if (error) {
        console.error("Profile fetch error:", error)
        return
      }

      if (!data) {
        console.log("No profile found for user, assuming trigger will create or user needs to complete.")
        setProfile(null)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error("Profile fetch error:", error)
    }
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
      router.push("/") // Redirect to login page after sign out
    } catch (error) {
      console.error("Sign out error:", error)
      // Even if sign out fails, clear local state and redirect to prevent loop
      setUser(null)
      setProfile(null)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [router])

  const signUp = useCallback(async (email: string, password: string, fullName: string, userType: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName, // Pass to metadata for trigger
            user_type: userType, // Pass to metadata for trigger
          },
        },
      })

      if (error) throw error

      // The trigger 'on_auth_user_created' will handle initial profile creation.
      // No need for client-side profile insert here.

      if (data.user) {
        setUser(data.user)
        // Profile will be fetched by onAuthStateChange or after successful login
      }
      return { success: true, user: data.user }
    } catch (error: any) {
      console.error("Sign up error:", error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        setUser(data.user)
        // Profile will be fetched by onAuthStateChange
      }
      return { success: true, user: data.user }
    } catch (error: any) {
      console.error("Sign in error:", error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Initial session error:", error)
          await signOut() // Force sign out on initial session error
          return
        }

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error("Initial auth check error:", error)
        await signOut() // Force sign out on any initial auth check error
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
      setUser(session?.user ?? null)

      if (event === "SIGNED_OUT" || !session?.user) {
        await signOut() // Use the centralized signOut function
      } else if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, signOut]) // Add fetchProfile and signOut to dependencies

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return false

      setLoading(true)
      try {
        const { error } = await supabase.from("user_profiles").update(updates).eq("id", user.id)

        if (error) throw error

        await fetchProfile(user.id) // Refresh profile
        return true
      } catch (error) {
        console.error("Profile update error:", error)
        return false
      } finally {
        setLoading(false)
      }
    },
    [user, fetchProfile],
  )

  return {
    user,
    profile,
    loading,
    refetch: () => user && fetchProfile(user.id),
    updateProfile,
    signUp,
    signIn,
    signOut,
  }
}
