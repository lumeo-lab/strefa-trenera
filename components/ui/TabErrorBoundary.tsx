'use client'

import { Component } from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  tabName?: string
}

interface State {
  hasError: boolean
}

export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {this.props.tabName ? `Nie udało się załadować: ${this.props.tabName}` : 'Coś poszło nie tak'}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Spróbuj odświeżyć stronę. Jeśli problem się powtarza, skontaktuj się z nami.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--orange)', color: 'white' }}
          >
            Spróbuj ponownie
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
