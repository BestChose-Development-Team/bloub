<script setup lang="ts">
import BloubBot from '@/components/BloubBot.vue'
import { DEFAULT_EXPRESSION } from '@/bot/expressions'
import {
  DEFAULT_COLOR,
  DEFAULT_GRADIENT,
  DEFAULT_GRADIENT_TYPE,
  DEFAULT_SHAPE
} from '@/bot/skins'
import type { StateId } from '@/bot/states'
import type { AnimationAppearances } from '@/bot/appearance'

/**
 * Vignette cliquable de la barre de droite : un bot fige, son nom dessous, une
 * bordure quand elle est retenue. Sert aux formes, aux expressions et aux
 * animations — les trois grilles doivent rester identiques a l'oeil, d'ou le
 * composant partage plutot que la meme chaine de classes recopiee.
 *
 * `frozenAt` est obligatoire : une vignette animee ferait tourner autant de
 * boucles rAF qu'il y a de cases.
 */
const props = withDefaults(
  defineProps<{
    label: string
    selected: boolean
    frozenAt: number
    state?: StateId
    shape?: string
    presetIdle?: boolean
    color?: string
    gradient?: string
    gradientType?: 'linear' | 'radial'
    gradientAngle?: number
    expression?: string
    size?: number
    editable?: boolean
    editing?: boolean
    editLabel?: string
    animationAppearances?: AnimationAppearances
  }>(),
  {
    state: 'idle',
    shape: DEFAULT_SHAPE,
    color: DEFAULT_COLOR,
    gradient: DEFAULT_GRADIENT,
    gradientType: DEFAULT_GRADIENT_TYPE,
    gradientAngle: 135,
    expression: DEFAULT_EXPRESSION,
    size: 60,
    editable: false,
    editing: false,
    editLabel: '',
    animationAppearances: () => ({})
  }
)

const emit = defineEmits<{
  click: []
  edit: []
}>()
</script>

<template>
  <div class="group relative min-w-0">
    <button
      type="button"
      class="flex w-full cursor-pointer flex-col items-center rounded-xl border-2 p-1 transition"
      :class="
        selected || editing
          ? 'border-[var(--ink)]'
          : 'border-transparent hover:border-[var(--line)]'
      "
      :aria-label="label"
      :aria-pressed="selected"
      @click="emit('click')"
    >
      <BloubBot
        :state="state"
        :size="size"
        :shape="shape"
        :animation-appearances="animationAppearances"
        :preset-idle="presetIdle"
        :color="color"
        :gradient="gradient"
        :gradient-type="gradientType"
        :gradient-angle="gradientAngle"
        :expression="expression"
        :frozen-at="frozenAt"
      />
      <!-- 12 px : en dessous, une legende n'est plus lisible pour tout le monde -->
      <span class="text-center text-xs leading-tight text-[var(--muted)]">{{ label }}</span>
    </button>

    <button
      v-if="editable"
      type="button"
      class="absolute right-0.5 top-0.5 z-10 grid size-7 cursor-pointer place-items-center rounded-full border border-[var(--line)] bg-white/95 text-[var(--muted)] shadow-sm transition hover:border-[var(--ink)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
      :class="props.editing && 'border-[var(--ink)] bg-[var(--ink)] text-white hover:text-white'"
      :aria-label="editLabel || label"
      :aria-pressed="editing"
      @click.stop="emit('edit')"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="m10.8 2.2 3 3-7.7 7.7-3.7.7.7-3.7 7.7-7.7Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>
