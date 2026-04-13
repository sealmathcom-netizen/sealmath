import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { usePersistentState } from '../usePersistentState'

// Mock the dependencies to prevent real DB calls in unit tests
vi.mock('@/utils/supabase/client', () => ({
  createSupabaseClient: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false })),
}))

describe('usePersistentState', () => {
  it('should initialize with the default value provided', () => {
    const { result } = renderHook(() => usePersistentState('test_key', 'default_value'))
    
    // The hook returns: [state, setState, loading]
    expect(result.current[0]).toBe('default_value')
  })
})
