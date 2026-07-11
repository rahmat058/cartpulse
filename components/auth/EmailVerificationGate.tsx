'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

/** Shows a toast on the login page when redirected from dashboard without a verified email. */
export function useVerificationRequiredToast() {
  const searchParams = useSearchParams()
  const toasted = useRef(false)

  useEffect(() => {
    if (searchParams.get('verify') !== 'required' || toasted.current) return
    toasted.current = true

    const email = searchParams.get('email')
    toast.error('Email verification required', {
      description: email
        ? `Verify ${email} before signing in to your dashboard.`
        : 'Verify your email before signing in to your dashboard.',
      duration: 6000,
    })
  }, [searchParams])
}
