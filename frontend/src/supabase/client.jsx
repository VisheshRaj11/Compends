import { useMemo } from "react"
import { useAuth } from "@clerk/clerk-react"
import { createSupabaseClient } from "./useClerkSupabase"

export const useSupabase = () => {
  const { getToken } = useAuth()

  const supabase = useMemo(() => {
    return createSupabaseClient(getToken)
  }, [getToken])

  return supabase
}
