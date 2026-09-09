<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BotTile from '@/components/BotTile.vue'
import { t } from '@/i18n'
import { EXPRESSIONS } from '@/bot/expressions'
import {
  COLORS,
  SHAPES,
  gradientAnchors,
  mixHex,
  normalizeHex,
  positionedGradient,
  resolveColor,
} from '@/bot/skins'
import { POSES, STATE_BY_ID, type StateId } from '@/bot/states'
import type { AnimationAppearance } from '@/bot/appearance'

const props = defineProps<{
  state: StateId
  shape: string
  overridden: boolean
  color: string
  gradient: string
  gradientType: 'linear' | 'radial'
  gradientAngle: number
  expression: string
  appearance?: AnimationAppearance
}>()

const emit = defineEmits<{
  close: []
  reset: []
  'update:shape': [shape: string]
  'update:color': [color: string]
  'update:gradient': [gradient: string]
  'update:gradient-type': [gradientType: 'linear' | 'radial']
  'update:gradient-angle': [gradientAngle: number]
  'update:expression': [expression: string]
}>()

const section = ref<'shape' | 'body' | 'expression'>('shape')
const solidHex = computed(() => resolveColor(props.color))
const lastGradient = ref(
  props.gradient === 'none'
    ? positionedGradient([
        { color: solidHex.value, position: 0 },
        { color: '#ffffff', position: 100 },
      ])
    : props.gradient
)
const gradientTrack = ref<HTMLElement | null>(null)
const draggingStop = ref<number | null>(null)
const gradientStops = computed(() => {
  const stops = gradientAnchors(props.gradient)
  return stops.length
    ? stops
    : [{ color: solidHex.value, position: 0 }, { color: '#ffffff', position: 100 }]
})
const gradientPreview = computed(() =>
  `linear-gradient(90deg, ${gradientStops.value.map((stop) => `${stop.color} ${stop.position}%`).join(', ')})`
)
const previewAt = computed(() =>
  Math.max(POSES[props.state], (STATE_BY_ID.get(props.state)?.duration ?? 0) - 0.15)
)

watch(
  () => props.gradient,
  (gradient) => {
    if (gradient !== 'none') lastGradient.value = gradient
  }
)

watch(
  () => props.color,
  (color) => {
    if (props.gradient !== 'none') return
    lastGradient.value = positionedGradient([
      { color: resolveColor(color), position: 0 },
      { color: '#ffffff', position: 100 },
    ])
  }
)

function inputValue(event: Event) {
  return (event.target as HTMLInputElement).value
}

function setSolid(raw: string) {
  const value = normalizeHex(raw)
  if (value) emit('update:color', value)
}

function setAngle(raw: string) {
  if (!raw.trim() || !Number.isFinite(Number(raw))) return
  emit('update:gradient-angle', Math.round(Math.max(0, Math.min(360, Number(raw)))))
}

function updateStops(stops: Array<{ color: string; position: number }>) {
  emit('update:gradient', positionedGradient(stops))
}

function toggleGradient() {
  emit('update:gradient', props.gradient === 'none' ? lastGradient.value : 'none')
}

function setGradientStop(index: number, raw: string) {
  const value = normalizeHex(raw)
  if (!value) return
  const stops = gradientStops.value.map((stop) => ({ ...stop }))
  stops[index]!.color = value
  updateStops(stops)
}

function setPosition(index: number, raw: string, sliding = false) {
  if (!raw.trim() || !Number.isFinite(Number(raw))) return
  const stops = gradientStops.value.map((stop) => ({ ...stop }))
  const lower = sliding ? stops[index - 1]?.position ?? 0 : 0
  const upper = sliding ? stops[index + 1]?.position ?? 100 : 100
  stops[index]!.position = Math.round(Math.max(lower, Math.min(upper, Number(raw))) * 10) / 10
  updateStops(stops)
}

function pointerPosition(event: PointerEvent) {
  const track = gradientTrack.value
  if (!track) return 0
  const rect = track.getBoundingClientRect()
  const percent = ((event.clientX - rect.left) / rect.width) * 100
  return Math.round(Math.max(0, Math.min(100, percent)) * 10) / 10
}

function startStopDrag(index: number, event: PointerEvent) {
  draggingStop.value = index
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  setPosition(index, String(pointerPosition(event)), true)
}

function moveStopDrag(index: number, event: PointerEvent) {
  if (draggingStop.value !== index) return
  setPosition(index, String(pointerPosition(event)), true)
}

function endStopDrag(index: number, event: PointerEvent) {
  if (draggingStop.value !== index) return
  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
  draggingStop.value = null
}

function moveStopByKeyboard(index: number, event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  const position = gradientStops.value[index]?.position
  if (position === undefined) return
  const direction = event.key === 'ArrowLeft' ? -1 : 1
  const step = event.shiftKey ? 10 : 1
  setPosition(index, String(position + direction * step), true)
}

function addStop() {
  const stops = gradientStops.value.map((stop) => ({ ...stop }))
  if (stops.length >= 20) return
  let index = 0
  for (let i = 1; i < stops.length - 1; i++) {
    if (stops[i + 1]!.position - stops[i]!.position > stops[index + 1]!.position - stops[index]!.position) {
      index = i
    }
  }
  const before = stops[index]!
  const after = stops[index + 1]!
  stops.splice(index + 1, 0, {
    color: mixHex(before.color, after.color, 0.5),
    position: Math.round((before.position + after.position) * 5) / 10,
  })
  updateStops(stops)
}

function removeStop(index: number) {
  if (gradientStops.value.length <= 2) return
  updateStops(gradientStops.value.filter((_, i) => i !== index))
}

function swapGradientStops() {
  updateStops(
    gradientStops.value
      .map((stop) => ({ ...stop, position: 100 - stop.position }))
      .reverse()
  )
}
</script>

<template>
  <section class="flex min-h-0 w-full flex-col" :aria-label="t('panel.animationEditTitle')">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          {{ t('panel.animationPersonalize') }}
        </p>
        <h2 class="mt-1 text-base font-semibold">
          {{ t('panel.animationEditFor', { state: t(`states.${state}`) }) }}
        </h2>
      </div>
      <button
        type="button"
        class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
        :aria-label="t('panel.animationEditClose')"
        @click="emit('close')"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="m2.5 2.5 7 7m0-7-7 7"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <div class="mt-5 grid grid-cols-3 rounded-xl bg-black/[0.045] p-1">
      <button
        v-for="item in (['shape', 'body', 'expression'] as const)"
        :key="item"
        type="button"
        class="cursor-pointer rounded-lg px-1 py-2 text-xs transition"
        :class="
          section === item
            ? 'bg-white font-semibold text-[var(--ink)] shadow-sm'
            : 'text-[var(--muted)] hover:text-[var(--ink)]'
        "
        :aria-pressed="section === item"
        @click="section = item"
      >
        {{ t(item === 'body' ? 'panel.color' : `panel.${item}`) }}
      </button>
    </div>

    <template v-if="section === 'shape'">
      <div class="mt-5 grid min-h-0 grid-cols-2 gap-1 overflow-y-auto pr-1">
        <BotTile
          v-for="item in SHAPES"
          :key="item.id"
          :label="t(`shapes.${item.id}`)"
          :selected="item.id === shape"
          :frozen-at="previewAt"
          :state="state"
          :animation-appearances="{ [state]: { ...appearance, shape: item.id } }"
          :shape="item.id"
          preset-idle
          :color="color"
          :gradient="gradient"
          :gradient-type="gradientType"
          :gradient-angle="gradientAngle"
          :expression="expression"
          :size="54"
          @click="emit('update:shape', item.id)"
        />
      </div>
    </template>

    <template v-else-if="section === 'body'">
      <h3 class="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {{ t('panel.solidColor') }}
      </h3>
      <div class="mt-5 grid grid-cols-6 gap-1.5">
        <button
          v-for="item in COLORS"
          :key="item.id"
          type="button"
          class="flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition"
          :class="
            item.id === color
              ? 'border-[var(--ink)]'
              : 'border-transparent hover:border-[var(--line)]'
          "
          :aria-label="t(`colors.${item.id}`)"
          :aria-pressed="item.id === color"
          @click="emit('update:color', item.id)"
        >
          <span
            class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
            :style="{ background: item.hex }"
          />
        </button>
      </div>
      <label class="mt-4 flex items-center gap-2">
        <input
          type="color"
          class="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-[var(--line)] bg-transparent p-0.5"
          :value="solidHex"
          :aria-label="t('panel.colorPicker')"
          @input="setSolid(inputValue($event))"
        />
        <input
          type="text"
          class="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 font-mono text-xs uppercase outline-none transition focus:border-[var(--ink)]"
          :value="solidHex"
          maxlength="7"
          spellcheck="false"
          autocomplete="off"
          :aria-label="t('panel.colorHex')"
          @input="setSolid(inputValue($event))"
        />
      </label>
      <p class="mt-3 text-xs leading-relaxed text-[var(--muted)]">
        {{ t('panel.animationColorHint') }}
      </p>

      <div class="mt-5 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            {{ t('panel.gradient') }}
          </h3>
          <label
            class="relative inline-flex cursor-pointer rounded-full focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ink)]"
            :title="t(gradient === 'none' ? 'panel.gradientApply' : 'panel.gradientCancel')"
          >
            <input
              type="checkbox"
              class="sr-only"
              :checked="gradient !== 'none'"
              :aria-label="t(gradient === 'none' ? 'panel.gradientApply' : 'panel.gradientCancel')"
              @change="toggleGradient"
            />
            <span
              class="relative h-5 w-9 rounded-full transition-colors"
              :class="gradient === 'none' ? 'bg-black/15' : 'bg-[var(--ink)]'"
              aria-hidden="true"
            >
              <span
                class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform"
                :class="gradient !== 'none' && 'translate-x-4'"
              />
            </span>
          </label>
        </div>
        <div class="grid grid-cols-2 rounded-lg bg-black/[0.045] p-0.5">
          <button
            v-for="type in (['linear', 'radial'] as const)"
            :key="type"
            type="button"
            class="cursor-pointer rounded-md px-2 py-1 text-xs transition"
            :class="gradientType === type ? 'bg-white font-semibold shadow-sm' : 'text-[var(--muted)]'"
            :aria-pressed="gradientType === type"
            @click="emit('update:gradient-type', type)"
          >
            {{ t(type === 'linear' ? 'panel.gradientLinear' : 'panel.gradientRadial') }}
          </button>
        </div>
      </div>
      <label v-if="gradientType === 'linear'" class="mt-3 flex items-center gap-2 text-xs">
        <span>{{ t('panel.gradientAngle') }}</span>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          class="min-w-0 flex-1 accent-[var(--ink)]"
          :value="gradientAngle"
          :aria-label="t('panel.gradientAngle')"
          @input="setAngle(inputValue($event))"
        />
        <input
          type="number"
          min="0"
          max="360"
          step="1"
          class="w-16 rounded border border-[var(--line)] bg-white px-2 py-1.5"
          :value="gradientAngle"
          :aria-label="t('panel.gradientAngle')"
          @input="setAngle(inputValue($event))"
        />°
      </label>

      <div class="mt-4">
        <div
          ref="gradientTrack"
          class="relative mx-2 mb-5 h-8 rounded-lg border border-[var(--line)]"
          :style="{ background: gradientPreview }"
        >
          <button
            v-for="(stop, index) in gradientStops"
            :key="index"
            type="button"
            role="slider"
            class="absolute -bottom-2 h-5 w-4 touch-none -translate-x-1/2 cursor-ew-resize rounded-sm border-2 border-white shadow ring-1 ring-black/20 transition-transform focus:outline-none focus:ring-2 focus:ring-[var(--ink)]"
            :class="draggingStop === index && 'scale-125 ring-2 ring-[var(--ink)]'"
            :style="{ left: `${stop.position}%`, background: stop.color }"
            :aria-label="`${t('panel.gradientPosition')} ${index + 1}`"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="stop.position"
            @pointerdown.prevent="startStopDrag(index, $event)"
            @pointermove.prevent="moveStopDrag(index, $event)"
            @pointerup="endStopDrag(index, $event)"
            @pointercancel="endStopDrag(index, $event)"
            @keydown="moveStopByKeyboard(index, $event)"
          />
        </div>
        <div class="mb-2 flex items-center justify-between text-xs">
          <span class="font-semibold">{{ t('panel.gradientStops') }}</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="cursor-pointer rounded border border-[var(--line)] px-2 py-1"
              :aria-label="t('panel.gradientSwap')"
              @click="swapGradientStops"
            >
              ⇄
            </button>
            <button
              type="button"
              class="cursor-pointer rounded border border-[var(--line)] px-2 py-1 disabled:opacity-30"
              :disabled="gradientStops.length >= 20"
              @click="addStop"
            >
              + {{ t('panel.gradientAdd') }}
            </button>
          </div>
        </div>
        <div
          v-for="(stop, index) in gradientStops"
          :key="index"
          class="mb-2 rounded-lg border border-[var(--line)] bg-white p-2"
        >
          <div class="flex items-center gap-1.5">
            <input
              type="color"
              class="h-8 w-8 shrink-0 cursor-pointer rounded bg-transparent"
              :value="stop.color"
              :aria-label="`${t('panel.colorPicker')} ${index + 1}`"
              @input="setGradientStop(index, inputValue($event))"
            />
            <input
              type="text"
              class="min-w-0 flex-1 rounded border border-[var(--line)] px-1 py-1.5 font-mono text-xs uppercase"
              :value="stop.color"
              maxlength="7"
              spellcheck="false"
              :aria-label="`${t('panel.colorHex')} ${index + 1}`"
              @change="setGradientStop(index, inputValue($event))"
            />
            <button
              type="button"
              class="h-7 w-5 shrink-0 cursor-pointer disabled:opacity-25"
              :disabled="gradientStops.length <= 2"
              :aria-label="`${t('panel.gradientRemove')} ${index + 1}`"
              @click="removeStop(index)"
            >
              −
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="mt-5 grid min-h-0 grid-cols-2 gap-1 overflow-y-auto pr-1">
        <BotTile
          v-for="item in EXPRESSIONS"
          :key="item.id"
          :label="t(`expressions.${item.id}`)"
          :selected="item.id === expression"
          :frozen-at="previewAt"
          :state="state"
          :animation-appearances="{ [state]: { ...appearance, expression: item.id } }"
          :shape="shape"
          preset-idle
          :color="color"
          gradient="none"
          :expression="item.id"
          :size="54"
          @click="emit('update:expression', item.id)"
        />
      </div>
    </template>

    <button
      type="button"
      class="mt-4 w-full cursor-pointer rounded-xl border border-[var(--line)] px-3 py-2 text-sm transition hover:border-[var(--muted)] disabled:cursor-default disabled:opacity-45"
      :disabled="!overridden"
      @click="emit('reset')"
    >
      {{ t('panel.animationAppearanceReset') }}
    </button>
  </section>
</template>
