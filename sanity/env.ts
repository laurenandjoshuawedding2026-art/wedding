export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-05-23'

export const dataset = 'production'

export const projectId = '6utncmxh'

// Secret token for mutations (Server-side only)
export const token = 'skRWXaQq0iefnvFahpLyLxvt2j3RcZpkHkTANDeF39MLBt76gJ3i1kMYPOBbmlfZ8Sg86Z3vLg0IzdkBPklvkJoBRmbqO0wssXxW12kNEAAUPL18BSkOEypKaSstugOH3I4gabofMMiecNmZ5BGHWu2mBw5KNeJ1clp0MTqhJ3XRQKvtjQW0'

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
