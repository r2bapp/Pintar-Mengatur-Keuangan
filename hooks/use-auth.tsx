"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        console.error("Profile fetch error:", error)
        return
      }

      if (!data) {
        console.log("No profile found yet, waiting for trigger or manual completion.")
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
      router.push("/") // Redirect ke halaman login
    } catch (error) {
      console.error("Sign out error:", error)
      setUser(null)
      setProfile(null)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [router])

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, userType: string) => {
      setLoading(true)
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              user_type: userType,
            },
          },
        })

        if (error) throw error

        if (data.user) {
          setUser(data.user)
        }
        return { success: true, user: data.user }
      } catch (error: any) {
        console.error("Sign up error:", error)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },
    [],
  )

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
          setUser(null)
          setProfile(null)
          return
        }

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error("Initial auth check error:", error)
        setUser(null)
        setProfile(null)
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
        setUser(null)
        setProfile(null)
        router.push("/") // langsung redirect, tanpa signOut loop
      } else if (session?.user) {
        await fetchProfile(session.user.id)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, router])

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return false

      setLoading(true)
      try {
        const { error } = await supabase
          .from("user_profiles")
          .update(updates)
          .eq("id", user.id)

        if (error) throw error

        await fetchProfile(user.id)
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
