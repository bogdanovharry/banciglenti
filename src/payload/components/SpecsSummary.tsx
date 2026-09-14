'use client'

import { useFormFields } from '@payloadcms/ui'

/**
 * The made-to-measure sizes, as a work order rather than as JSON.
 *
 * This field used to render in a code editor, complete with line numbers and a
 * blinking cursor inside a field labelled read-only. To learn that a blade
 * needs no heat treatment you had to read `"heatTreatment": false`. Nobody in a
 * workshop should have to parse a data structure to cut a blade.
 *
 * The underlying JSON is untouched and still on the document — /api/checkout
 * writes it and re-prices from it. This only changes how a person reads it.
 */

const TABLE_LABEL: Record<string, string> = {
  'wood-h': 'Дърво · хоризонтален',
  'wood-v': 'Дърво · вертикален',
  'metal-bi': 'Метал · биметал',
  'metal-cs': 'Метал · въглеродна',
  meat: 'Месо и риба',
  bread: 'Хлебни изделия',
  textile: 'Други материали',
}

const PROCESSES: { key: string; label: string }[] = [
  { key: 'welding', label: 'Заваряване' },
  { key: 'setting', label: 'Чапраз' },
  { key: 'sharpening', label: 'Заточване' },
  { key: 'heatTreatment', label: 'Термообработка' },
]

export function SpecsSummary({ path }: { path?: string }) {
  // path is e.g. "items.0.specsSummary" — the sibling JSON sits next to it.
  const specsPath = (path ?? '').replace(/\.specsSummary$/, '.customSpecs')
  const value = useFormFields(([fields]) => fields?.[specsPath]?.value)

  const s = (typeof value === 'string' ? safeParse(value) : value) as Record<string, unknown> | null
  if (!s || typeof s !== 'object') return null

  const num = (k: string) => (typeof s[k] === 'number' ? (s[k] as number) : null)
  const length = num('length')
  const width = num('width')
  const thickness = num('thickness')

  const on = PROCESSES.filter((p) => s[p.key] === true)
  const off = PROCESSES.filter((p) => s[p.key] === false)

  const box: React.CSSProperties = {
    border: '1px solid var(--theme-elevation-150)',
    borderLeft: '3px solid #D97706',
    borderRadius: 4,
    background: 'var(--theme-elevation-50)',
    padding: '12px 14px',
  }
  const label: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--theme-elevation-500)',
    fontWeight: 600,
  }
  const val: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    marginTop: 2,
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ ...label, marginBottom: 6 }}>Размери за цеха</div>
      <div style={box}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26, marginBottom: on.length || off.length ? 12 : 0 }}>
          {length !== null && (
            <div>
              <div style={label}>Дължина</div>
              <div style={val}>{length.toLocaleString('bg-BG')} мм</div>
            </div>
          )}
          {width !== null && (
            <div>
              <div style={label}>Широчина</div>
              <div style={val}>{width} мм</div>
            </div>
          )}
          {thickness !== null && (
            <div>
              <div style={label}>Дебелина</div>
              <div style={val}>{thickness} мм</div>
            </div>
          )}
          {typeof s.pitch === 'string' && (
            <div>
              <div style={label}>Стъпка</div>
              <div style={val}>{s.pitch}</div>
            </div>
          )}
          {typeof s.brand === 'string' && (
            <div>
              <div style={label}>Материал</div>
              <div style={val}>{s.brand}</div>
            </div>
          )}
          {typeof s.table === 'string' && (
            <div>
              <div style={label}>Тип</div>
              <div style={val}>{TABLE_LABEL[s.table] ?? s.table}</div>
            </div>
          )}
        </div>

        {(on.length > 0 || off.length > 0) && (
          <div style={{ borderTop: '1px solid var(--theme-elevation-150)', paddingTop: 10 }}>
            <div style={{ ...label, marginBottom: 6 }}>Обработки</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {on.map((p) => (
                <span
                  key={p.key}
                  style={{
                    background: '#D1FAE5',
                    color: '#065F46',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  ✓ {p.label}
                </span>
              ))}
              {off.map((p) => (
                <span
                  key={p.key}
                  style={{
                    color: 'var(--theme-elevation-450)',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 12.5,
                    border: '1px dashed var(--theme-elevation-200)',
                    textDecoration: 'line-through',
                  }}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function safeParse(v: string): unknown {
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

export default SpecsSummary
