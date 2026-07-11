'use client'

import { Component, type ReactNode } from 'react'
import { QueryErrorFallback } from '@/components/ui/QueryErrorFallback'

interface ErrorBoundaryProps {
  children: ReactNode
  title?: string
  compact?: boolean
  className?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

/** Catches uncaught render errors in child components (not async fetch — use QueryErrorFallback for those). */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Something went wrong while loading this section.',
    }
  }

  private reset = () => {
    this.setState({ hasError: false, message: '' })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <QueryErrorFallback
          title={this.props.title ?? 'Something went wrong'}
          message={
            process.env.NODE_ENV === 'development'
              ? this.state.message
              : 'This section failed to load. Please try again.'
          }
          onRetry={this.reset}
          compact={this.props.compact}
          className={this.props.className}
        />
      )
    }

    return this.props.children
  }
}
