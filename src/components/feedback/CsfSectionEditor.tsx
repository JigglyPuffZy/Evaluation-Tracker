import {
  DEFAULT_CSF_SECTIONS,
  type CsfSectionConfig,
  type CsfSectionPartId,
} from '../../types/csfForm'

const PART_ORDER: CsfSectionPartId[] = ['part1', 'part2', 'part3', 'part4', 'part5']

type CsfSectionEditorProps = {
  value: CsfSectionConfig
  onChange: (value: CsfSectionConfig) => void
}

export function CsfSectionEditor({ value, onChange }: CsfSectionEditorProps) {
  function updatePart(partId: CsfSectionPartId, field: 'title' | 'description', text: string) {
    onChange({
      ...value,
      [partId]: {
        ...value[partId],
        [field]: text,
      },
    })
  }

  return (
    <div className="space-y-3 rounded-xl border border-line/70 bg-surface/30 p-4">
      <p className="text-sm font-semibold text-ink">Customize Part 1–5 (optional)</p>
      <p className="text-xs text-muted">
        Edit section titles and instructions shown on the public CSF form. Leave blank to use the
        DOST default text.
      </p>
      {PART_ORDER.map((partId) => {
        const defaults = DEFAULT_CSF_SECTIONS[partId]
        return (
          <details key={partId} className="rounded-lg border border-line/60 bg-card/80 px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium text-ink">
              {value[partId]?.title || defaults.title}
            </summary>
            <div className="mt-3 space-y-2 pb-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted">Section title</span>
                <input
                  value={value[partId]?.title ?? ''}
                  onChange={(event) => updatePart(partId, 'title', event.target.value)}
                  placeholder={defaults.title}
                  className="h-9 w-full rounded-lg border border-line bg-card px-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted">Instructions for respondents</span>
                <textarea
                  rows={2}
                  value={value[partId]?.description ?? ''}
                  onChange={(event) => updatePart(partId, 'description', event.target.value)}
                  placeholder={defaults.description}
                  className="w-full rounded-lg border border-line bg-card px-2 py-1.5 text-sm outline-none focus:border-accent"
                />
              </label>
            </div>
          </details>
        )
      })}
    </div>
  )
}
