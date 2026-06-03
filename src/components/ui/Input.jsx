export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        {...props}
        className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-400' : 'border-gray-300'}
          ${className}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
