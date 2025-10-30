import { useState, useEffect } from 'react'
import featureFlags from '../../lib/feature-flags.js'

/**
 * React hook for feature flags
 * Provides reactive feature flag state in React components
 */
export const useFeatureFlag = (flagName, userContext = {}) => {
  const [isEnabled, setIsEnabled] = useState(() =>
    featureFlags.isEnabled(flagName, userContext)
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const handleFlagChange = (changedFlagName, value) => {
      if (changedFlagName === flagName) {
        setIsEnabled(value)
      }
    }

    // Listen for flag changes
    featureFlags.addListener(handleFlagChange)

    // Cleanup listener
    return () => {
      featureFlags.removeListener(handleFlagChange)
    }
  }, [flagName])

  const enable = (value = true) => {
    setIsLoading(true)
    featureFlags.enable(flagName, value)
    setIsLoading(false)
  }

  const disable = () => {
    setIsLoading(true)
    featureFlags.disable(flagName)
    setIsLoading(false)
  }

  return {
    isEnabled,
    isLoading,
    enable,
    disable,
    toggle: () => isEnabled ? disable() : enable()
  }
}

/**
 * Higher-order component for feature flags
 */
export const withFeatureFlag = (flagName, userContext) => (Component) => {
  return (props) => {
    const { isEnabled } = useFeatureFlag(flagName, userContext)

    if (!isEnabled) {
      return null
    }

    return <Component {...props} />
  }
}

/**
 * Feature flag wrapper component
 */
export const FeatureFlag = ({
  flagName,
  children,
  fallback = null,
  userContext = {}
}) => {
  const { isEnabled } = useFeatureFlag(flagName, userContext)

  if (!isEnabled) {
    return fallback
  }

  return children
}

/**
 * Migration phase component
 * Shows content based on current migration phase
 */
export const MigrationPhase = ({
  phase,
  children,
  fallback = null
}) => {
  const phaseFlags = {
    1: 'migration-phase-1',
    2: 'migration-phase-2',
    3: 'migration-phase-3',
    'complete': 'migration-complete'
  }

  const flagName = phaseFlags[phase]
  if (!flagName) {
    console.warn(`Invalid migration phase: ${phase}`)
    return fallback
  }

  return (
    <FeatureFlag flagName={flagName} fallback={fallback}>
      {children}
    </FeatureFlag>
  )
}

export default useFeatureFlag