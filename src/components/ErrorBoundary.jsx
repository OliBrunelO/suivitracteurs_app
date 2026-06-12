import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fff1f0', border: '2px solid #ff4d4f', margin: 16, borderRadius: 8 }}>
          <h2 style={{ color: '#cf1322', marginBottom: 8 }}>Erreur de rendu</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#333' }}>{this.state.error.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#666', marginTop: 8 }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
