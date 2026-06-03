const variants = {
  primary:   'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  ghost:     'hover:bg-gray-100 text-gray-600',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export function Button({ as: Tag = 'button', children, variant = 'primary', size = 'md', className = '', disabled, loading, ...props }) {
  const cls = `inline-flex items-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`

  if (Tag !== 'button') {
    // Rendu en tant que Link ou autre élément (pas de prop disabled)
    return (
      <Tag {...props} className={cls}>
        {children}
      </Tag>
    )
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cls}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
