import { useState } from 'react'
import Button from './ui/Button'
import { Input, Label, Textarea } from './ui/Form'
import { Badge, Banner } from './ui/Feedback'
import Modal from './ui/Modal'
import { Check, Sparkles, Target } from './Icons'

export const LANGUAGES = [
  { value: '', label: "Same as the VSL" },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'pt-PT', label: 'Português (Portugal)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'es-MX', label: 'Español (México)' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ja', label: '日本語' },
]

const PRODUCT_TYPES = [
  'e-book',
  'recipe e-book',
  'online course',
  'mini-course',
  'membership',
  'checklist / planner',
  'coaching program',
  'supplement',
  'physical product',
  'software / app',
]

export const EMPTY_SETTINGS = {
  language: '',
  country: '',
  product_name: '',
  product_type: '',
  price: '',
  payment_note: '',
  guarantee: '',
  cta_label: '',
  cta_url: '',
  audience_note: '',
  custom_instructions: '',
}

export function isEmptySettings(settings) {
  if (!settings) return true
  return Object.entries(settings)
    .filter(([key]) => key in EMPTY_SETTINGS)
    .every(([, value]) => !value)
}

/** Seed the form from the analysed VSL so the user only edits what changes. */
export function settingsFromAnalysis(analysis) {
  if (!analysis) return { ...EMPTY_SETTINGS }

  return {
    ...EMPTY_SETTINGS,
    language: analysis.language ?? '',
    product_name: analysis.offer_name ?? '',
    product_type: analysis.product_type ?? '',
    price: analysis.offer?.price ?? '',
    payment_note: analysis.offer?.payment_options ?? '',
    guarantee: analysis.offer?.guarantee ?? '',
    cta_label: analysis.cta?.primary_label ?? '',
    cta_url: analysis.cta?.url ?? '',
    audience_note: analysis.target_audience?.summary ?? '',
  }
}

const FIELD_LABELS = {
  product_name: 'Product',
  product_type: 'Type',
  price: 'Price',
  payment_note: 'Payment',
  language: 'Language',
  country: 'Market',
  guarantee: 'Guarantee',
  cta_label: 'CTA',
  cta_url: 'Link',
  audience_note: 'Audience',
}

/**
 * Target product overrides.
 *
 * The analysed VSL is often not the product being sold - an English $200
 * nutraceutical VSL can be the source for a R$37 Portuguese recipe e-book.
 * These settings live on the PROJECT, so the sales page and the quiz always
 * receive the same overrides and stay consistent with each other.
 */
export default function GenerationSettings({ settings, analysis, saving, onSave, hasAssets }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_SETTINGS)

  const empty = isEmptySettings(settings)
  const current = { ...EMPTY_SETTINGS, ...(settings ?? {}) }

  const openEditor = () => {
    setForm(empty ? settingsFromAnalysis(analysis) : current)
    setOpen(true)
  }

  const update = (field) => (event) =>
    setForm((state) => ({ ...state, [field]: event.target.value }))

  const handleSave = async () => {
    const cleaned = Object.fromEntries(
      Object.keys(EMPTY_SETTINGS).map((key) => [key, (form[key] ?? '').trim()]),
    )
    await onSave(cleaned)
    setOpen(false)
  }

  const handleClear = async () => {
    await onSave({ ...EMPTY_SETTINGS })
    setOpen(false)
  }

  const languageLabel =
    LANGUAGES.find((item) => item.value === current.language)?.label || current.language

  return (
    <>
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Target product</h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-400">
                {empty
                  ? 'Both assets currently sell exactly what the VSL sells. Set a target product to adapt them — different offer, price, language or market — while keeping the VSL’s persuasion structure.'
                  : 'Both assets are generated for this product instead of the one in the VSL.'}
              </p>
            </div>
          </div>

          <Button variant={empty ? 'secondary' : 'outline'} size="sm" onClick={openEditor}>
            {empty ? 'Set target product' : 'Edit'}
          </Button>
        </div>

        {!empty && (
          <>
            <dl className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(FIELD_LABELS).map(([key, label]) => {
                const value = key === 'language' ? languageLabel : current[key]
                if (!value) return null

                return (
                  <div
                    key={key}
                    className="rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2"
                  >
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
                      {label}
                    </dt>
                    <dd className="mt-0.5 truncate text-sm text-ink-100" title={value}>
                      {value}
                    </dd>
                  </div>
                )
              })}
            </dl>

            {current.custom_instructions && (
              <div className="mt-3 rounded-lg border border-accent-500/25 bg-accent-500/5 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-accent-400">
                  Custom instructions
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-200">
                  {current.custom_instructions}
                </p>
              </div>
            )}

            {hasAssets && (
              <Banner tone="warning" className="mt-4">
                Assets generated before these settings still describe the old offer. Regenerate
                both the sales page and the quiz so they stay consistent with each other.
              </Banner>
            )}
          </>
        )}
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="Target product"
        description="Leave a field empty to keep whatever the VSL said."
        footer={
          <>
            {!empty && (
              <Button variant="ghost" onClick={handleClear} disabled={saving} className="mr-auto">
                Clear all
              </Button>
            )}
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              <Check className="h-4 w-4" />
              Save settings
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Banner tone="info">
            The VSL’s pain points, desires, mechanism and structure are kept. Everything specific
            to the product — name, price, currency, guarantee, language — is replaced with what
            you enter here, in both the sales page and the quiz.
          </Banner>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Product name"
              placeholder="Receitas Que Curam"
              value={form.product_name}
              onChange={update('product_name')}
              maxLength={120}
            />

            <div>
              <Label htmlFor="product-type">Product type</Label>
              <input
                id="product-type"
                list="product-type-options"
                value={form.product_type}
                onChange={update('product_type')}
                placeholder="recipe e-book"
                maxLength={80}
                className="h-11 w-full rounded-xl border border-ink-700 bg-ink-950/60 px-4 text-ink-50 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
              />
              <datalist id="product-type-options">
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>

            <div>
              <Label htmlFor="output-language" hint="Everything is written natively in it">
                Output language
              </Label>
              <select
                id="output-language"
                value={form.language}
                onChange={update('language')}
                className="h-11 w-full rounded-xl border border-ink-700 bg-ink-950/60 px-4 text-ink-50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
              >
                {LANGUAGES.map((item) => (
                  <option key={item.value || 'source'} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Market / country"
              placeholder="Brasil"
              hint="Currency and cultural cues"
              value={form.country}
              onChange={update('country')}
              maxLength={80}
            />

            <Input
              label="Price"
              placeholder="R$ 37"
              hint="Written exactly as shown"
              value={form.price}
              onChange={update('price')}
              maxLength={80}
            />

            <Input
              label="Payment options"
              placeholder="ou 3x de R$ 12,90"
              value={form.payment_note}
              onChange={update('payment_note')}
              maxLength={160}
            />

            <Input
              label="Guarantee"
              placeholder="7 dias de garantia incondicional"
              value={form.guarantee}
              onChange={update('guarantee')}
              maxLength={200}
              className="sm:col-span-2"
            />

            <Input
              label="CTA button text"
              placeholder="Quero minhas receitas agora"
              value={form.cta_label}
              onChange={update('cta_label')}
              maxLength={80}
            />

            <Input
              label="CTA link"
              type="url"
              placeholder="https://pay.hotmart.com/..."
              value={form.cta_url}
              onChange={update('cta_url')}
              maxLength={500}
            />
          </div>

          <Textarea
            label="Audience"
            rows={2}
            placeholder="Mulheres de 35 a 60 anos no Brasil que querem emagrecer sem dieta restritiva."
            value={form.audience_note}
            onChange={update('audience_note')}
            maxLength={1000}
          />

          <Textarea
            label="Custom instructions"
            hint="Highest priority — overrides everything else"
            rows={5}
            placeholder={
              'Anything the AI must follow. For example:\n' +
              '- Never promise medical results, this is an information product\n' +
              '- Mention the 3 bonus e-books in the offer stack\n' +
              '- Use informal "você", warm and maternal tone'
            }
            value={form.custom_instructions}
            onChange={update('custom_instructions')}
            maxLength={4000}
          />

          <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-950/40 p-3">
            <p className="text-sm text-ink-400">Start again from what the VSL says?</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setForm(settingsFromAnalysis(analysis))}
            >
              <Sparkles className="h-4 w-4" />
              Fill from VSL
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/** Small inline marker used on the asset tabs. */
export function AdaptedBadge({ settings }) {
  if (isEmptySettings(settings)) return null
  return <Badge tone="brand">Adapted</Badge>
}
