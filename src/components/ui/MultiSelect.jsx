import { useState, useRef, useEffect } from 'react'

export function MultiSelect({ label, options = [], value = [], onChange, error, placeholder = 'Sélectionner...' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(optValue) {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }

  const selectedOptions = options.filter(o => value.includes(o.value))

  // Grouper les options par `group` si défini
  const groups = options.reduce((acc, opt) => {
    const g = opt.group ?? ''
    if (!acc[g]) acc[g] = []
    acc[g].push(opt)
    return acc
  }, {})
  const hasGroups = Object.keys(groups).some(k => k !== '')
  const groupKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'Sans catégorie') return 1
    if (b === 'Sans catégorie') return -1
    return a.localeCompare(b, 'fr')
  })

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-xs text-gray-400">Sélection multiple possible</span>
        </div>
      )}
      <div
        className={`relative border rounded-lg px-3 py-2 text-sm bg-white cursor-pointer min-h-[42px] pr-8
          ${error ? 'border-red-400' : open ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300'}`}
        onClick={() => setOpen(o => !o)}
      >
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1 pr-2">
            {selectedOptions.map(o => (
              <span key={o.value} className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {o.label}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); toggle(o.value) }}
                  className="hover:text-primary-600 ml-0.5"
                >×</button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {open ? '▴' : '▾'}
        </span>
      </div>

      {open && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-xl max-h-64 overflow-y-auto z-50">
          {options.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-400">Aucune option disponible</p>
          )}
          {hasGroups ? (
            groupKeys.map(gKey => (
              <div key={gKey}>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100 sticky top-0">
                  {gKey || 'Sans catégorie'}
                </div>
                {groups[gKey].map(opt => (
                  <OptionRow key={opt.value} opt={opt} checked={value.includes(opt.value)} onToggle={toggle} />
                ))}
              </div>
            ))
          ) : (
            options.map(opt => (
              <OptionRow key={opt.value} opt={opt} checked={value.includes(opt.value)} onToggle={toggle} />
            ))
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function OptionRow({ opt, checked, onToggle }) {
  return (
    <label className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(opt.value)}
        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
      <span className={`text-sm ${checked ? 'font-medium text-primary-800' : 'text-gray-700'}`}>{opt.label}</span>
    </label>
  )
}
