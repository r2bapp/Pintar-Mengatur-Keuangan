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

  /** Fetch profile dari tabel user_profiles */
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
        console.log(
          "No profile found for user, assuming trigger will create or user needs to complete."
        )
        setProfile(null)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error("Profile fetch error:", error)
    }
  }, [])

  /** Sign out user */
  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      setUser(null)
      setProfile(null)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [router])

  /** Sign up user baru */
  const signUp = useCallback(
    async (email: string, password: string, fullName: string, userType: string) => {
      setLoading(true)
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName, // Metadata → trigger insert ke user_profiles
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
    []
  )

  /** Sign in user */
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

  /** Cek session saat mount */
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Initial session error:", error)
          await signOut()
          return
        }

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error("Initial auth check error:", error)
        await signOut()
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email)
        setUser(session?.user ?? null)

        if (event === "SIGNED_OUT" || !session?.user) {
          await signOut()
        } else if (session?.user) {
          await fetchProfile(session.user.id)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile, signOut])

  /** Update profile */
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
    [user, fetchProfile]
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
