/**
 * Verse la banque de questions en base.
 *
 * Le script est idempotent : il remplace le quiz de reference au lieu d'y
 * ajouter, sinon relancer le semis doublerait chaque question et fausserait
 * les tirages.
 *
 * Lancer avec : npm run seed:questions
 */
import { createClient } from '@supabase/supabase-js'
import { QUESTIONS } from '../supabase/seed/questions.mjs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis')
  process.exit(1)
}

/** Identifiant fixe : c'est ce qui rend le semis rejouable. */
const QUIZ_ID = '00000000-0000-4000-8000-000000000001'

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const { error: quizError } = await supabase.from('quizzes').upsert({
    id: QUIZ_ID,
    title: 'Culture générale',
    theme: 'Général',
    author_nickname: null,
    is_public: true,
  })
  if (quizError) throw new Error(quizError.message)

  const { error: clearError } = await supabase
    .from('questions')
    .delete()
    .eq('quiz_id', QUIZ_ID)
  if (clearError) throw new Error(clearError.message)

  const rows = QUESTIONS.map((question, index) => ({
    quiz_id: QUIZ_ID,
    idx: index,
    kind: question.kind,
    prompt: question.prompt,
    hint: question.hint,
    points: question.points,
    difficulty: question.difficulty,
    payload: question.payload,
    answer: question.answer,
  }))

  // Par lots : une insertion unique de plusieurs centaines de lignes fait
  // parfois trebucher PostgREST sur la taille du corps.
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await supabase.from('questions').insert(rows.slice(i, i + 50))
    if (error) throw new Error(error.message)
  }

  const themes = new Map()
  const kinds = new Map()
  const levels = new Map()
  for (const question of QUESTIONS) {
    themes.set(question.theme, (themes.get(question.theme) ?? 0) + 1)
    kinds.set(question.kind, (kinds.get(question.kind) ?? 0) + 1)
    levels.set(question.difficulty, (levels.get(question.difficulty) ?? 0) + 1)
  }

  console.log(`\n${rows.length} questions versées.\n`)
  console.log('Par thème :')
  for (const [theme, count] of [...themes].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(3)}  ${theme}`)
  }
  console.log('\nPar forme :')
  for (const [kind, count] of [...kinds].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(3)}  ${kind}`)
  }
  console.log()
}

main().catch((cause) => {
  console.error(`Semis interrompu : ${cause.message}`)
  process.exit(1)
})
