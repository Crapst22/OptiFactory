"use client"

import { useState, useEffect, useCallback } from "react"
import { AppConfig } from "@/types"
import { getConfig, updateConfig, subscribeToConfig } from "@/lib/store"

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(getConfig())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setConfig(getConfig())
    const unsub = subscribeToConfig(() => setConfig(getConfig()))
    return unsub
  }, [])

  const update = useCallback((partial: Partial<AppConfig>) => {
    updateConfig(partial)
    setConfig(getConfig())
  }, [])

  return { config: mounted ? config : getConfig(), updateConfig: update }
}
