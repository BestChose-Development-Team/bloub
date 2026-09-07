<script setup lang="ts">
import { computed } from 'vue'
import BotTile from '@/components/BotTile.vue'
import { EXPRESSIONS } from '@/bot/expressions'
import {
  COLORS,
  GRADIENTS,
  SHAPES,
  positionedGradient,
  gradientAnchors,
  mixHex,
  normalizeHex,
  resolveColor
} from '@/bot/skins'
import { t } from '@/i18n'

const shape = defineModel<string>('shape', { required: true })
const color = defineModel<string>('color', { required: true })
const gradient = defineModel<string>('gradient', { required: true })
const gradientType = defineModel<'linear' | 'radial'>('gradientType', { required: true })
const gradientAngle = defineModel<number>('gradientAngle', { required: true })
function setAngle(event: Event) {
  const raw = inputValue(event)
  if (raw.trim() && Number.isFinite(Number(raw))) gradientAngle.value = Math.round(Math.max(0, Math.min(360, Number(raw))))
}
const expression = defineModel<string>('expression', { required: true })

/**
 * Les vignettes sont figees a la meme date que la pose de repos : elles montrent
 * la forme et le visage tels qu'ils apparaitront, pas un aplat abstrait.
 */
const PREVIEW_AT = 1

const solidHex = computed(() => resolveColor(color.value))
const gradientStops = computed(() => {
  const stops = gradientAnchors(gradient.value)
  return stops.length ? stops : [{ color: solidHex.value, position: 0 }, { color: '#ffffff', position: 100 }]
})
const gradientPreview = computed(() => `linear-gradient(90deg, ${gradientStops.value.map(s => `${s.color} ${s.position}%`).join(', ')})`)

function inputValue(event: Event) {
  return (event.target as HTMLInputElement).value
}

function setSolid(raw: string) {
  const next = normalizeHex(raw)
  if (next) color.value = next
}

function setGradientStop(index: number, raw: string) {
  const next = normalizeHex(raw)
  if (!next) return
  const stops = gradientStops.value.map(s => ({ ...s }))
  stops[index]!.color = next
  gradient.value = positionedGradient(stops)
}

function swapGradientStops() {
  gradient.value = positionedGradient(gradientStops.value.map(s => ({ ...s, position: 100 - s.position })).reverse())
}
function setPosition(index: number, raw: string, sliding = false) {
  if (!raw.trim() || !Number.isFinite(Number(raw))) return
  const stops = gradientStops.value.map(s => ({ ...s }))
  stops[index]!.position = Math.round(Math.max(sliding ? stops[index - 1]?.position ?? 0 : 0, Math.min(sliding ? stops[index + 1]?.position ?? 100 : 100, Number(raw))) * 10) / 10
  gradient.value = positionedGradient(stops)
}
function addStop() {
  const stops = [...gradientStops.value]
  if (stops.length >= 20) return
  let index = 0
  for (let i = 1; i < stops.length - 1; i++) {
    if (stops[i + 1]!.position - stops[i]!.position > stops[index + 1]!.position - stops[index]!.position) index = i
  }
  const a = stops[index]!, b = stops[index + 1]!
  stops.splice(index + 1, 0, { color: mixHex(a.color, b.color, 0.5), position: Math.round((a.position + b.position) * 5) / 10 })
  gradient.value = positionedGradient(stops)
}
function removeStop(index: number) {
  if (gradientStops.value.length > 2) gradient.value = positionedGradient(gradientStops.value.filter((_, i) => i !== index))
}
</script>

<template>
  <div>
    <h2 class="text-sm font-semibold">{{ t('panel.shape') }}</h2>
    <div class="mt-2 grid grid-cols-4 gap-1.5">
      <BotTile
        v-for="s in SHAPES"
        :key="s.id"
        :label="t(`shapes.${s.id}`)"
        :selected="s.id === shape"
        :shape="s.id"
        :color="color"
        :gradient="gradient"
        :gradient-type="gradientType"
        :gradient-angle="gradientAngle"
        :expression="expression"
        :frozen-at="PREVIEW_AT"
        @click="shape = s.id"
      />
    </div>

    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.expression') }}</h2>
    <div class="mt-2 grid grid-cols-4 gap-1.5">
      <BotTile
        v-for="e in EXPRESSIONS"
        :key="e.id"
        :label="t(`expressions.${e.id}`)"
        :selected="e.id === expression"
        :shape="shape"
        :color="color"
        :gradient="gradient"
        :gradient-type="gradientType"
        :gradient-angle="gradientAngle"
        :expression="e.id"
        :frozen-at="PREVIEW_AT"
        @click="expression = e.id"
      />
    </div>

    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.color') }}</h2>
    <div class="mt-2 grid grid-cols-6 gap-1.5">
      <button
        v-for="c in COLORS"
        :key="c.id"
        type="button"
        class="flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition"
        :class="
          c.id === color ? 'border-[var(--ink)]' : 'border-transparent hover:border-[var(--line)]'
        "
        :aria-label="t(`colors.${c.id}`)"
        :aria-pressed="c.id === color"
        @click="color = c.id"
      >
        <!-- liseré interne : sinon la pastille creme disparait sur fond clair -->
        <span
          class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
          :style="{ background: c.hex }"
        />
      </button>
    </div>

    <label class="mt-2 flex items-center gap-2">
      <span class="text-xs text-[var(--muted)]">{{ t('panel.colorHex') }}</span>
      <input
        type="color"
        class="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-[var(--line)] bg-transparent p-0.5"
        :value="solidHex"
        :aria-label="t('panel.colorPicker')"
        @input="setSolid(inputValue($event))"
      />
      <input
        type="text"
        class="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 font-mono text-xs uppercase outline-none transition focus:border-[var(--ink)]"
        :value="solidHex"
        maxlength="7"
        spellcheck="false"
        autocomplete="off"
        :aria-label="t('panel.colorHex')"
        @input="setSolid(inputValue($event))"
      />
    </label>

    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.gradient') }}</h2>
    <div class="mt-2 grid grid-cols-2 rounded-lg bg-black/[0.045] p-0.5">
      <button
        v-for="type in (['linear', 'radial'] as const)"
        :key="type"
        type="button"
        class="cursor-pointer rounded-md px-2 py-1.5 text-xs transition"
        :class="
          gradientType === type
            ? 'bg-white font-semibold text-[var(--ink)] shadow-sm'
            : 'text-[var(--muted)] hover:text-[var(--ink)]'
        "
        :aria-pressed="gradientType === type"
        @click="gradientType = type"
      >
        {{ t(type === 'linear' ? 'panel.gradientLinear' : 'panel.gradientRadial') }}
      </button>
    </div>
    <div class="mt-2 grid grid-cols-6 gap-1.5">
      <button
        type="button"
        class="flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition"
        :class="
          gradient === 'none'
            ? 'border-[var(--ink)]'
            : 'border-transparent hover:border-[var(--line)]'
        "
        :aria-label="t('gradients.none')"
        :aria-pressed="gradient === 'none'"
        @click="gradient = 'none'"
      >
        <span
          class="relative block h-[78%] w-[78%] overflow-hidden rounded-full bg-white ring-1 ring-black/10 ring-inset after:absolute after:top-1/2 after:left-[12%] after:h-px after:w-[76%] after:-rotate-45 after:bg-red-500"
        />
      </button>
      <button
        v-for="g in GRADIENTS"
        :key="g.id"
        type="button"
        class="flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition"
        :class="
          g.id === gradient
            ? 'border-[var(--ink)]'
            : 'border-transparent hover:border-[var(--line)]'
        "
        :aria-label="t(`gradients.${g.id}`)"
        :aria-pressed="g.id === gradient"
        @click="gradient = g.id"
      >
        <span
          class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
          :style="{
            background:
              gradientType === 'radial'
                ? `radial-gradient(circle, ${g.stops.join(', ')})`
                : `linear-gradient(${gradientAngle}deg, ${g.stops.join(', ')})`
          }"
        />
      </button>
    </div>
    <label v-if="gradientType === 'linear'" class="mt-3 flex items-center gap-2 text-xs">
      <span>{{ t('panel.gradientAngle') }}</span>
      <input type="range" min="0" max="360" step="1" class="min-w-0 flex-1 accent-[var(--ink)]" :value="gradientAngle" :aria-label="t('panel.gradientAngle')" @input="setAngle" />
      <input type="number" min="0" max="360" step="1" class="w-16 rounded border border-[var(--line)] bg-white px-2 py-1.5" :value="gradientAngle" :aria-label="t('panel.gradientAngle')" @input="setAngle" />°
    </label>
    <div class="mt-3">
      <div class="relative mx-2 mb-5 h-8 rounded-lg border border-[var(--line)]" :style="{ background: gradientPreview }">
        <span v-for="(stop, index) in gradientStops" :key="index"
          class="absolute -bottom-2 h-4 w-3 -translate-x-1/2 rounded-sm border-2 border-white shadow ring-1 ring-black/20"
          :style="{ left: `${stop.position}%`, background: stop.color }" />
      </div>
      <div class="mb-2 flex items-center justify-between text-xs">
        <span class="font-semibold">{{ t('panel.gradientStops') }}</span>
        <div class="flex gap-2">
          <button type="button" class="cursor-pointer rounded border border-[var(--line)] px-2 py-1" :aria-label="t('panel.gradientSwap')" @click="swapGradientStops">⇄</button>
          <button type="button" class="cursor-pointer rounded border border-[var(--line)] px-2 py-1 disabled:opacity-30" :disabled="gradientStops.length >= 20" @click="addStop">+ {{ t('panel.gradientAdd') }}</button>
        </div>
      </div>
      <div v-for="(stop, index) in gradientStops" :key="index" class="mb-2 rounded-lg border border-[var(--line)] bg-white p-2">
        <div class="flex items-center gap-1.5">
          <label class="flex w-20 shrink-0 items-center gap-0.5 text-xs">
            <input type="number" min="0" max="100" step="0.1" class="min-w-0 w-full rounded border border-[var(--line)] px-1 py-1.5" :value="stop.position" :aria-label="`${t('panel.gradientPosition')} ${index + 1}`" @change="setPosition(index, inputValue($event))" />%
          </label>
          <input type="color" class="h-8 w-7 shrink-0 cursor-pointer bg-transparent" :value="stop.color" :aria-label="`${t('panel.colorPicker')} ${index + 1}`" @input="setGradientStop(index, inputValue($event))" />
          <input type="text" class="min-w-0 flex-1 rounded border border-[var(--line)] px-1 py-1.5 font-mono text-xs uppercase" :value="stop.color" maxlength="7" spellcheck="false" :aria-label="`${t('panel.colorHex')} ${index + 1}`" @change="setGradientStop(index, inputValue($event))" />
          <button type="button" class="h-7 w-5 shrink-0 cursor-pointer disabled:opacity-25" :disabled="gradientStops.length <= 2" :aria-label="`${t('panel.gradientRemove')} ${index + 1}`" @click="removeStop(index)">−</button>
        </div>
        <input type="range" min="0" max="100" step="0.1" class="mt-2 block w-full accent-[var(--ink)]" :value="stop.position" :aria-label="`${t('panel.gradientPosition')} ${index + 1}`" @input="setPosition(index, inputValue($event), true)" />
      </div>
    </div>
  </div>
</template>
