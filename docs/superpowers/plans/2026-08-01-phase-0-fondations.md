# Phase 0 — Fondations : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer un site Next.js déployé en production avec un thème light/dark sans clignotement, un kit de composants UI, une base Supabase migrée et sécurisée, et les utilitaires purs testés — la fondation sur laquelle les phases 1 à 5 s'appuient.

**Architecture :** Application Next.js 15 monolithique (App Router) déployée sur Vercel, parlant à un projet Supabase pour Postgres, Realtime et Storage. Les couleurs vivent dans un unique fichier de tokens CSS exposés à Tailwind v4 via `@theme inline`, ce qui permet de basculer le thème à l'exécution en changeant un seul attribut sur `<html>`. Toute la logique testable sans navigateur est isolée dans `lib/` et couverte par Vitest ; les composants sont vérifiés visuellement sur une page vitrine `/dev/ui`.

**Tech Stack :** Next.js 15 (App Router, TypeScript strict) · Tailwind CSS v4 · Vitest + jsdom + Testing Library · Supabase (Postgres, Storage, CLI) · Vercel (hébergement + cron)

## Contraintes globales

Ces règles s'appliquent implicitement à **chaque** tâche du plan.

- **Aucune valeur hexadécimale hors de `styles/theme.css`.** Aucun composant n'écrit `#FF5A1F` ni `bg-[#fff]`. Les couleurs passent toujours par une classe Tailwind sémantique (`bg-surface`, `text-muted`, `border-default`).
- **Aucune variante `dark:` dans un composant.** Le dark mode redéfinit des variables CSS, il ne duplique pas des classes.
- **Un fichier dépasse 200 lignes = il fait trop de choses.** Le découper.
- **Un composant de `components/ui/` ne connaît aucun concept métier.** Il ignore ce qu'est une scène, un joueur ou une prise. Props génériques uniquement.
- **Aucun appel Supabase dans un composant.** Les composants appellent des fonctions de `lib/`.
- **Tout accès aux fichiers passe par `lib/storage/index.ts`.** Aucun import direct de `supabase.storage` ailleurs.
- **TypeScript en mode strict.** Aucun `any` implicite, aucun `@ts-ignore`.
- **Light est le thème par défaut.** Pas de lecture de `prefers-color-scheme`.
- **Langue de l'interface : français.** Les identifiants du code sont en anglais.
- **Commit après chaque tâche**, message en français, préfixe conventionnel (`feat:`, `chore:`, `test:`, `docs:`).
- **Aucun co-auteur dans les messages de commit.**

## Note sur la stratégie de test

Le PRD pose la règle : *« Toute logique testable sans navigateur vit dans `lib/` et est couverte par des tests. »* Ce plan l'applique littéralement.

- **`lib/utils/*`, `lib/theme.ts`, `lib/storage/paths.ts`** → TDD strict avec Vitest. Test qui échoue, puis implémentation, puis test qui passe.
- **`components/ui/Dialog.tsx`** → tests Testing Library, parce que le piège de focus et la fermeture par `Échap` cassent silencieusement et qu'aucune vérification visuelle ne les attrape.
- **Les autres composants** → vérification visuelle sur `/dev/ui`, une page qui affiche chaque primitive dans tous ses états. Écrire des tests de rendu superficiel sur un `<Button>` produirait des tests qui ne détectent jamais rien tout en coûtant à maintenir. La page vitrine, elle, sert encore en Phase 5.
- **Schéma SQL et politiques RLS** → vérification par script de sondage exécuté contre la base réelle, avec assertions. C'est le seul moyen honnête de tester des politiques RLS.

## Ordre des tâches et fichiers produits

| # | Tâche | Produit principal |
|---|---|---|
| 1 | Échafaudage et harnais de test | `package.json`, `vitest.config.ts`, `lib/utils/cn.ts` |
| 2 | Tokens de design | `styles/theme.css` |
| 3 | Mécanisme de thème | `lib/theme.ts`, script anti-flash |
| 4 | Polices et coquille de l'application | `app/layout.tsx`, `components/layout/Header.tsx` |
| 5 | `lib/utils/time.ts` | Formatage et parsing de timecodes |
| 6 | `lib/utils/id.ts` | Génération de codes de salon |
| 7 | Primitives UI, lot 1 | `Button`, `IconButton`, `Panel` + `/dev/ui` |
| 8 | Primitives UI, lot 2 | `Input`, `Badge`, `Spinner`, `Timecode`, `EmptyState` |
| 9 | `Dialog` | Modale accessible, testée |
| 10 | `ThemeToggle` | Bascule light/dark branchée |
| 11 | Projet Supabase et schéma | `supabase/migrations/…_initial_schema.sql` |
| 12 | Politiques RLS | `…_rls_policies.sql` + script de sondage |
| 13 | Buckets et adaptateur de stockage | `lib/storage/` |
| 14 | Clients Supabase et types générés | `lib/supabase/`, `types/db.ts` |
| 15 | Page d'accueil | `app/page.tsx` |
| 16 | Déploiement et cron de maintien | `vercel.json`, `app/api/cron/keepalive/route.ts` |

---

## Task 1 : Échafaudage Next.js et harnais de test

**Files:**
- Create: tout l'échafaudage Next.js à la racine du projet
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Create: `lib/utils/cn.ts`, `lib/utils/cn.test.ts`
- Modify: `tsconfig.json`, `package.json`, `.gitignore`

**Interfaces:**
- Consomme : rien, c'est la première tâche
- Produit : `cn(...inputs: ClassValue[]): string` — fusion de classes Tailwind utilisée par tous les composants ; les scripts npm `dev`, `build`, `test`, `test:run`, `lint`

**Contexte :** le dossier contient déjà `.git`, `.gitignore` et `docs/`. `create-next-app` refuse de s'installer dans un dossier contenant un `.gitignore`, on échafaude donc dans un sous-dossier temporaire puis on remonte les fichiers.

- [ ] **Step 1: Échafauder Next.js dans un dossier temporaire**

```powershell
npx create-next-app@15 _scaffold --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --turbopack --use-npm
```

- [ ] **Step 2: Remonter les fichiers et supprimer le dossier temporaire**

Le `.gitignore` du projet est déjà écrit et doit être conservé : on ne remonte pas celui de l'échafaudage.

```powershell
Remove-Item _scaffold\.gitignore -Force
Get-ChildItem -Path _scaffold -Force | Move-Item -Destination . -Force
Remove-Item _scaffold -Recurse -Force
```

- [ ] **Step 3: Vérifier que le site démarre**

Run: `npm run dev`
Expected: le serveur démarre sur `http://localhost:3000` et la page par défaut de Next.js s'affiche. Arrêter avec `Ctrl+C`.

- [ ] **Step 4: Durcir la configuration TypeScript**

Remplacer le bloc `compilerOptions` de `tsconfig.json` par celui-ci (garder les sections `include` et `exclude` générées) :

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  }
}
```

- [ ] **Step 5: Installer les dépendances de test et d'utilitaires**

```powershell
npm i clsx tailwind-merge
npm i -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom @types/node
```

- [ ] **Step 6: Configurer Vitest**

Créer `vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
  },
})
```

Créer `vitest.setup.ts` :

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 7: Ajouter les scripts npm**

Dans `package.json`, remplacer la section `scripts` :

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 8: Écrire le test qui échoue pour `cn`**

Créer `lib/utils/cn.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('concatène des classes simples', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('ignore les valeurs falsy', () => {
    expect(cn('px-2', false, undefined, null, '', 'py-1')).toBe('px-2 py-1')
  })

  it('applique les classes conditionnelles', () => {
    expect(cn('base', { actif: true, inactif: false })).toBe('base actif')
  })

  it('résout les conflits Tailwind en gardant la dernière classe', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('ne fusionne pas des utilitaires de familles différentes', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })
})
```

- [ ] **Step 9: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test:run -- lib/utils/cn.test.ts`
Expected: ÉCHEC — `Failed to resolve import "./cn"`

- [ ] **Step 10: Écrire l'implémentation minimale**

Créer `lib/utils/cn.ts` :

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Fusionne des classes Tailwind en résolvant les conflits d'utilitaires. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 11: Lancer le test pour vérifier qu'il passe**

Run: `npm run test:run -- lib/utils/cn.test.ts`
Expected: SUCCÈS — 5 tests passent

- [ ] **Step 12: Vérifier que la compilation et le lint passent**

Run: `npm run typecheck; npm run lint`
Expected: aucune erreur

- [ ] **Step 13: Commit**

```powershell
git add -A
git commit -m "chore: echafaudage Next.js 15, TypeScript strict et harnais Vitest"
```

---

## Task 2 : Tokens de design

**Files:**
- Create: `styles/theme.css`
- Modify: `app/globals.css`

**Interfaces:**
- Consomme : l'échafaudage Tailwind v4 de la Task 1
- Produit : les classes Tailwind sémantiques utilisées par tous les composants — `bg-bg`, `bg-surface`, `bg-sunken`, `text-fg`, `text-muted`, `text-faint`, `border-default`, `border-strong`, `bg-accent`, `text-accent`, `bg-accent-soft`, `text-on-accent`, `bg-rec`, `bg-ok`, `bg-warn`, `text-player-1`, `text-player-2`, `rounded-token`, `rounded-token-lg`, `shadow-token`, `shadow-float`, `font-mono`

**Pourquoi `@theme inline` :** en Tailwind v4, `@theme` fige les valeurs à la compilation, ce qui empêcherait toute bascule de thème à l'exécution. Le mot-clé `inline` fait émettre à Tailwind la référence `var(...)` telle quelle plutôt que sa valeur résolue. Les utilitaires pointent alors vers des variables CSS que `[data-theme='dark']` peut redéfinir. C'est le mécanisme qui rend possible « aucun `dark:` dans les composants ».

- [ ] **Step 1: Écrire le fichier de tokens**

Créer `styles/theme.css` :

```css
/* ─────────────────────────────────────────────────────────────
   voiced.io — tokens de design « Studio Dub »
   SEUL fichier du projet autorisé à contenir des valeurs de couleur.
   Le thème sombre ne fait que redéfinir ces variables.
   ───────────────────────────────────────────────────────────── */

:root {
  /* Surfaces */
  --bg:             #FAFAF8;
  --surface:        #FFFFFF;
  --surface-sunken: #F1F1EF;
  --border:         #E4E4E7;
  --border-strong:  #C9C9CE;

  /* Texte */
  --text:           #101014;
  --text-muted:     #6B6B75;
  --text-faint:     #9A9AA3;

  /* Accent */
  --accent:         #FF5A1F;
  --accent-hover:   #E64E15;
  --accent-soft:    #FFF0E9;
  --on-accent:      #FFFFFF;

  /* États */
  --rec:            #E5484D;
  --ok:             #12B981;
  --warn:           #F5A524;

  /* Waveform */
  --wave-ref:       #C9C9CE;
  --wave-self:      #FF5A1F;
  --playhead:       #101014;

  /* Identité joueur */
  --player-1:       #0EA5E9;
  --player-2:       #F59E0B;

  /* Forme */
  --radius:         6px;
  --radius-lg:      10px;
  --shadow:         0 1px 2px rgb(16 16 20 / 0.06);
  --shadow-float:   0 8px 24px rgb(16 16 20 / 0.10);
}

[data-theme='dark'] {
  --bg:             #0B0B0D;
  --surface:        #16161A;
  --surface-sunken: #0F0F12;
  --border:         #26262B;
  --border-strong:  #3A3A42;

  --text:           #F2F2F4;
  --text-muted:     #9A9AA3;
  --text-faint:     #6B6B75;

  --accent-soft:    #2A1509;
  --wave-ref:       #3A3A42;
  --playhead:       #F2F2F4;

  --shadow:         none;
  --shadow-float:   0 8px 24px rgb(0 0 0 / 0.50);
}
```

Les accents (`--accent`, `--rec`, `--ok`, `--warn`, `--player-*`) ne sont pas redéfinis en sombre : ils ont été choisis pour tenir le contraste sur `#FAFAF8` comme sur `#0B0B0D`.

- [ ] **Step 2: Exposer les tokens à Tailwind**

Remplacer intégralement le contenu de `app/globals.css` :

```css
@import 'tailwindcss';
@import '../styles/theme.css';

@theme inline {
  --color-bg:          var(--bg);
  --color-surface:     var(--surface);
  --color-sunken:      var(--surface-sunken);

  --color-fg:          var(--text);
  --color-muted:       var(--text-muted);
  --color-faint:       var(--text-faint);

  --color-default:     var(--border);
  --color-strong:      var(--border-strong);

  --color-accent:      var(--accent);
  --color-accent-hover:var(--accent-hover);
  --color-accent-soft: var(--accent-soft);
  --color-on-accent:   var(--on-accent);

  --color-rec:         var(--rec);
  --color-ok:          var(--ok);
  --color-warn:        var(--warn);

  --color-wave-ref:    var(--wave-ref);
  --color-wave-self:   var(--wave-self);
  --color-playhead:    var(--playhead);

  --color-player-1:    var(--player-1);
  --color-player-2:    var(--player-2);

  --radius-token:      var(--radius);
  --radius-token-lg:   var(--radius-lg);

  --shadow-token:      var(--shadow);
  --shadow-float:      var(--shadow-float);
}

@layer base {
  * {
    border-color: var(--border);
  }

  html {
    color-scheme: light;
  }

  html[data-theme='dark'] {
    color-scheme: dark;
  }

  body {
    background-color: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  /* Focus visible uniforme sur tout le site */
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}
```

- [ ] **Step 3: Vérifier visuellement que les tokens fonctionnent**

Remplacer temporairement le contenu de `app/page.tsx` par :

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-bg p-10">
      <div className="rounded-token border border-default bg-surface p-6 shadow-token">
        <h1 className="text-fg text-2xl font-semibold">Test des tokens</h1>
        <p className="text-muted mt-2">Texte secondaire sur surface.</p>
        <button className="bg-accent text-on-accent rounded-token mt-4 px-4 py-2">
          Action principale
        </button>
      </div>
    </main>
  )
}
```

Run: `npm run dev`
Expected: fond crème `#FAFAF8`, carte blanche avec bordure fine, bouton orange. Puis, dans la console du navigateur, exécuter `document.documentElement.dataset.theme = 'dark'` : le fond doit passer en quasi-noir et la carte en gris foncé **sans recharger la page**. C'est la vérification qui valide toute la mécanique.

- [ ] **Step 4: Vérifier la compilation**

Run: `npm run build`
Expected: build réussi

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: tokens de design Studio Dub, light et dark"
```

---

## Task 3 : Mécanisme de thème

**Files:**
- Create: `lib/theme.ts`, `lib/theme.test.ts`

**Interfaces:**
- Consomme : les tokens de la Task 2
- Produit :
  - `type Theme = 'light' | 'dark'`
  - `THEME_STORAGE_KEY: 'voiced-theme'`
  - `resolveTheme(stored: string | null | undefined): Theme` — fonction pure
  - `readStoredTheme(): Theme` — lit `localStorage`, tolère l'échec
  - `applyTheme(theme: Theme): void` — écrit l'attribut et persiste
  - `toggleTheme(current: Theme): Theme` — fonction pure
  - `THEME_INIT_SCRIPT: string` — script à injecter dans `<head>`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/theme.test.ts` :

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  toggleTheme,
} from './theme'

describe('resolveTheme', () => {
  it("retourne 'dark' pour la valeur exacte 'dark'", () => {
    expect(resolveTheme('dark')).toBe('dark')
  })

  it("retourne 'light' par défaut quand rien n'est stocké", () => {
    expect(resolveTheme(null)).toBe('light')
    expect(resolveTheme(undefined)).toBe('light')
  })

  it("retourne 'light' pour toute valeur inconnue", () => {
    expect(resolveTheme('DARK')).toBe('light')
    expect(resolveTheme('sombre')).toBe('light')
    expect(resolveTheme('')).toBe('light')
  })
})

describe('toggleTheme', () => {
  it('inverse le thème', () => {
    expect(toggleTheme('light')).toBe('dark')
    expect(toggleTheme('dark')).toBe('light')
  })
})

describe('applyTheme et readStoredTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it("pose l'attribut data-theme sur <html>", () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('persiste le thème dans localStorage', () => {
    applyTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('relit le thème persisté', () => {
    applyTheme('dark')
    expect(readStoredTheme()).toBe('dark')
  })

  it("retourne 'light' quand rien n'a jamais été persisté", () => {
    expect(readStoredTheme()).toBe('light')
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm run test:run -- lib/theme.test.ts`
Expected: ÉCHEC — `Failed to resolve import "./theme"`

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/theme.ts` :

```ts
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'voiced-theme'

/**
 * Light est le défaut assumé du produit : toute valeur qui n'est pas
 * exactement 'dark' retombe sur 'light'. Aucune lecture de
 * prefers-color-scheme, l'utilisateur choisit explicitement.
 */
export function resolveTheme(stored: string | null | undefined): Theme {
  return stored === 'dark' ? 'dark' : 'light'
}

export function toggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark'
}

export function readStoredTheme(): Theme {
  try {
    return resolveTheme(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    // localStorage indisponible (navigation privée stricte, iframe cloisonnée)
    return 'light'
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Le thème reste appliqué pour la session, il ne survivra pas au rechargement.
  }
}

/**
 * Injecté en synchrone dans <head>, avant le premier rendu, pour que la page
 * ne s'affiche jamais en clair pendant une fraction de seconde chez un
 * utilisateur en thème sombre.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})()`
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npm run test:run -- lib/theme.test.ts`
Expected: SUCCÈS — 8 tests passent

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: mecanisme de theme light/dark avec persistance"
```

---

## Task 4 : Polices et coquille de l'application

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `components/layout/Header.tsx`

**Interfaces:**
- Consomme : `THEME_INIT_SCRIPT` (Task 3), `cn` (Task 1)
- Produit : `<Header />` — en-tête du site, accepte `children` pour le contexte central ; les classes `font-sans` et `font-mono` branchées sur Inter et JetBrains Mono ; la classe utilitaire `.tnum` pour les chiffres tabulaires

- [ ] **Step 1: Brancher les polices dans le layout**

Remplacer `app/layout.tsx` :

```tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import { Header } from '@/components/layout/Header'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'voiced.io',
  description: 'Doublez une scène d’anime à deux, en direct, depuis votre navigateur.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Header />
        {children}
      </body>
    </html>
  )
}
```

`suppressHydrationWarning` sur `<html>` est nécessaire : le script modifie `data-theme` avant l'hydratation, React verrait sinon une divergence serveur/client.

- [ ] **Step 2: Déclarer les polices dans les tokens Tailwind**

Dans `app/globals.css`, ajouter à l'intérieur du bloc `@theme inline` :

```css
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;
```

Puis ajouter à la fin du bloc `@layer base` :

```css
  /* Chiffres à chasse fixe : indispensable pour les compteurs et timecodes,
     sinon la ligne tremble à chaque changement de chiffre. */
  .tnum {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
  }
```

- [ ] **Step 3: Écrire l'en-tête**

Créer `components/layout/Header.tsx` :

```tsx
import { cn } from '@/lib/utils/cn'

export function Header({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'border-default bg-surface sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-5',
        className,
      )}
    >
      <span className="text-fg text-[15px] font-semibold tracking-tight">
        voiced<span className="text-accent">.io</span>
      </span>
      <div className="text-muted flex flex-1 items-center justify-center text-[13px]">
        {children}
      </div>
    </header>
  )
}
```

L'emplacement à droite reste vide : le `<ThemeToggle />` viendra s'y loger en Task 10.

- [ ] **Step 4: Vérifier visuellement**

Run: `npm run dev`
Expected: en-tête blanc de 56 px avec la bordure basse, le mot-marque « voiced.io » dont le `.io` est orange. Le texte du corps doit être en Inter — vérifier dans l'inspecteur que `font-family` résout bien sur Inter et non sur une police système.

- [ ] **Step 5: Vérifier la compilation**

Run: `npm run typecheck; npm run build`
Expected: aucune erreur

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: polices Inter et JetBrains Mono, en-tete du site"
```

---

## Task 5 : Utilitaires de temps

**Files:**
- Create: `lib/utils/time.ts`, `lib/utils/time.test.ts`

**Interfaces:**
- Consomme : rien
- Produit :
  - `formatTimecode(seconds: number): string` — `"01:23.45"` (mm:ss.cc), utilisé par le composant `Timecode` et la timeline
  - `formatDuration(seconds: number): string` — `"1:23"`, pour les listes de scènes
  - `parseTimecode(value: string): number | null` — inverse de `formatTimecode`
  - `clamp(value: number, min: number, max: number): number`
  - `secondsToMs(seconds: number): number` et `msToSeconds(ms: number): number`
  - `overlaps(a: Interval, b: Interval): boolean` et `type Interval = { start: number; end: number }` — utilisés par la validation du découpage en Phase 1

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/utils/time.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import {
  clamp,
  formatDuration,
  formatTimecode,
  msToSeconds,
  overlaps,
  parseTimecode,
  secondsToMs,
} from './time'

describe('formatTimecode', () => {
  it('formate en mm:ss.cc', () => {
    expect(formatTimecode(83.45)).toBe('01:23.45')
  })

  it('remplit les zéros à gauche', () => {
    expect(formatTimecode(0)).toBe('00:00.00')
    expect(formatTimecode(4.2)).toBe('00:04.20')
  })

  it('gère les durées supérieures à 10 minutes', () => {
    expect(formatTimecode(725.03)).toBe('12:05.03')
  })

  it('tronque les centièmes au lieu d’arrondir', () => {
    // Arrondir ferait afficher une position déjà dépassée par la lecture.
    expect(formatTimecode(1.999)).toBe('00:01.99')
  })

  it('ramène les valeurs négatives à zéro', () => {
    expect(formatTimecode(-5)).toBe('00:00.00')
  })

  it('gère NaN sans planter', () => {
    expect(formatTimecode(Number.NaN)).toBe('00:00.00')
  })
})

describe('formatDuration', () => {
  it('formate en m:ss sans zéro initial sur les minutes', () => {
    expect(formatDuration(83)).toBe('1:23')
    expect(formatDuration(9)).toBe('0:09')
  })

  it('arrondit à la seconde supérieure', () => {
    // Une scène de 8.4 s annoncée « 0:08 » paraît plus courte qu'elle ne l'est.
    expect(formatDuration(8.4)).toBe('0:09')
  })
})

describe('parseTimecode', () => {
  it('lit un timecode complet', () => {
    expect(parseTimecode('01:23.45')).toBeCloseTo(83.45, 5)
  })

  it('accepte un timecode sans centièmes', () => {
    expect(parseTimecode('01:23')).toBeCloseTo(83, 5)
  })

  it('retourne null pour une entrée invalide', () => {
    expect(parseTimecode('abc')).toBeNull()
    expect(parseTimecode('')).toBeNull()
    expect(parseTimecode('1:2:3')).toBeNull()
  })

  it('fait un aller-retour avec formatTimecode', () => {
    expect(parseTimecode(formatTimecode(83.45))).toBeCloseTo(83.45, 2)
  })
})

describe('clamp', () => {
  it('borne la valeur dans l’intervalle', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })
})

describe('conversions', () => {
  it('convertit secondes vers millisecondes en entier', () => {
    expect(secondsToMs(1.234)).toBe(1234)
    expect(secondsToMs(1.2345)).toBe(1235)
  })

  it('convertit millisecondes vers secondes', () => {
    expect(msToSeconds(1234)).toBeCloseTo(1.234, 5)
  })
})

describe('overlaps', () => {
  it('détecte un chevauchement', () => {
    expect(overlaps({ start: 0, end: 5 }, { start: 3, end: 8 })).toBe(true)
  })

  it('ne considère pas deux intervalles adjacents comme chevauchants', () => {
    // Les scènes se touchent bord à bord par construction : ce n'est pas une erreur.
    expect(overlaps({ start: 0, end: 5 }, { start: 5, end: 8 })).toBe(false)
  })

  it('détecte un intervalle contenu dans un autre', () => {
    expect(overlaps({ start: 0, end: 10 }, { start: 2, end: 4 })).toBe(true)
  })

  it('retourne false pour deux intervalles disjoints', () => {
    expect(overlaps({ start: 0, end: 2 }, { start: 5, end: 8 })).toBe(false)
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm run test:run -- lib/utils/time.test.ts`
Expected: ÉCHEC — `Failed to resolve import "./time"`

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/utils/time.ts` :

```ts
export type Interval = { start: number; end: number }

const TIMECODE_PATTERN = /^(\d{1,3}):([0-5]\d)(?:\.(\d{1,2}))?$/

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0')
}

function safeSeconds(seconds: number): number {
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0
}

/** Position de lecture précise : `mm:ss.cc`. Tronque, n'arrondit pas. */
export function formatTimecode(seconds: number): string {
  const total = safeSeconds(seconds)
  const minutes = Math.floor(total / 60)
  const secs = Math.floor(total % 60)
  const centis = Math.floor((total * 100) % 100)
  return `${pad(minutes, 2)}:${pad(secs, 2)}.${pad(centis, 2)}`
}

/** Durée affichée dans les listes : `m:ss`. Arrondit au supérieur. */
export function formatDuration(seconds: number): string {
  const total = Math.ceil(safeSeconds(seconds))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${minutes}:${pad(secs, 2)}`
}

export function parseTimecode(value: string): number | null {
  const match = TIMECODE_PATTERN.exec(value.trim())
  if (!match) return null

  const [, minutes, secs, centis] = match
  return (
    Number(minutes) * 60 + Number(secs) + Number((centis ?? '0').padEnd(2, '0')) / 100
  )
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function secondsToMs(seconds: number): number {
  return Math.round(seconds * 1000)
}

export function msToSeconds(ms: number): number {
  return ms / 1000
}

/** Deux scènes adjacentes (`a.end === b.start`) ne se chevauchent pas. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npm run test:run -- lib/utils/time.test.ts`
Expected: SUCCÈS — 19 tests passent

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: utilitaires de temps, formatage et parsing de timecodes"
```

---

## Task 6 : Génération de codes de salon

**Files:**
- Create: `lib/utils/id.ts`, `lib/utils/id.test.ts`

**Interfaces:**
- Consomme : rien
- Produit :
  - `ROOM_CODE_ALPHABET: string` — 20 consonnes
  - `ROOM_CODE_LENGTH: 4`
  - `generateRoomCode(): string`
  - `isValidRoomCode(value: string): boolean`
  - `normalizeRoomCode(value: string): string` — met en majuscules et retire les espaces, pour la saisie utilisateur

**Choix de l'alphabet :** uniquement des consonnes. Cela retire d'un coup les caractères visuellement ambigus (`O`/`0`, `I`/`1`) et rend impossible la génération accidentelle d'un mot vulgaire — un code de salon s'affiche en grand et se lit à voix haute. 20⁴ = 160 000 combinaisons, largement au-dessus du nombre de salons vivants simultanément puisqu'ils expirent en 24 h.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/utils/id.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
} from './id'

describe('ROOM_CODE_ALPHABET', () => {
  it('ne contient aucune voyelle', () => {
    for (const vowel of 'AEIOUY') {
      expect(ROOM_CODE_ALPHABET).not.toContain(vowel)
    }
  })

  it('ne contient aucun chiffre', () => {
    expect(ROOM_CODE_ALPHABET).not.toMatch(/\d/)
  })

  it('ne contient aucun doublon', () => {
    expect(new Set(ROOM_CODE_ALPHABET).size).toBe(ROOM_CODE_ALPHABET.length)
  })

  it('offre assez de combinaisons', () => {
    expect(ROOM_CODE_ALPHABET.length ** ROOM_CODE_LENGTH).toBeGreaterThan(100_000)
  })
})

describe('generateRoomCode', () => {
  it('produit un code de la bonne longueur', () => {
    expect(generateRoomCode()).toHaveLength(ROOM_CODE_LENGTH)
  })

  it("n'utilise que des lettres de l'alphabet autorisé", () => {
    for (let i = 0; i < 200; i++) {
      for (const char of generateRoomCode()) {
        expect(ROOM_CODE_ALPHABET).toContain(char)
      }
    }
  })

  it('produit des codes variés', () => {
    const codes = new Set(Array.from({ length: 200 }, generateRoomCode))
    expect(codes.size).toBeGreaterThan(150)
  })

  it('produit des codes que isValidRoomCode accepte', () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidRoomCode(generateRoomCode())).toBe(true)
    }
  })
})

describe('normalizeRoomCode', () => {
  it('met en majuscules', () => {
    expect(normalizeRoomCode('bcdf')).toBe('BCDF')
  })

  it('retire les espaces internes et externes', () => {
    expect(normalizeRoomCode('  B C D F ')).toBe('BCDF')
  })

  it('retire les tirets, souvent tapés par habitude', () => {
    expect(normalizeRoomCode('BC-DF')).toBe('BCDF')
  })
})

describe('isValidRoomCode', () => {
  it('accepte un code valide', () => {
    expect(isValidRoomCode('BCDF')).toBe(true)
  })

  it('refuse une mauvaise longueur', () => {
    expect(isValidRoomCode('BCD')).toBe(false)
    expect(isValidRoomCode('BCDFG')).toBe(false)
  })

  it("refuse une lettre hors de l'alphabet", () => {
    expect(isValidRoomCode('BCDA')).toBe(false)
    expect(isValidRoomCode('BCD1')).toBe(false)
  })

  it('refuse les minuscules non normalisées', () => {
    expect(isValidRoomCode('bcdf')).toBe(false)
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm run test:run -- lib/utils/id.test.ts`
Expected: ÉCHEC — `Failed to resolve import "./id"`

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/utils/id.ts` :

```ts
/**
 * Uniquement des consonnes : cela élimine les confusions visuelles
 * (O/0, I/1) et rend impossible la génération accidentelle d'un mot,
 * ce qui compte pour un code affiché en grand et lu à voix haute.
 */
export const ROOM_CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ'
export const ROOM_CODE_LENGTH = 4

const ROOM_CODE_PATTERN = new RegExp(
  `^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`,
)

export function generateRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH)
  crypto.getRandomValues(bytes)

  let code = ''
  for (const byte of bytes) {
    code += ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length]
  }
  return code
}

export function normalizeRoomCode(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase()
}

export function isValidRoomCode(value: string): boolean {
  return ROOM_CODE_PATTERN.test(value)
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npm run test:run -- lib/utils/id.test.ts`
Expected: SUCCÈS — 15 tests passent

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: generation et validation de codes de salon"
```

---

## Task 7 : Primitives UI, lot 1 — Button, IconButton, Panel

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/IconButton.tsx`, `components/ui/Panel.tsx`, `components/ui/index.ts`
- Create: `app/dev/ui/page.tsx`

**Interfaces:**
- Consomme : `cn` (Task 1), les tokens (Task 2)
- Produit :
  - `<Button variant?: 'primary' | 'secondary' | 'ghost' | 'danger' size?: 'sm' | 'md' | 'lg' loading?: boolean fullWidth?: boolean {...ButtonHTMLAttributes} />`
  - `<IconButton label: string variant?: 'secondary' | 'ghost' | 'danger' size?: 'sm' | 'md' {...ButtonHTMLAttributes} />` — `label` est obligatoire et devient l'`aria-label`
  - `<Panel padded?: boolean sunken?: boolean {...HTMLAttributes<HTMLDivElement>} />`
  - `components/ui/index.ts` — point d'import unique : `import { Button, Panel } from '@/components/ui'`

- [ ] **Step 1: Écrire Button**

Créer `components/ui/Button.tsx` :

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'bg-surface text-fg border border-default hover:border-strong',
  ghost: 'bg-transparent text-muted hover:text-fg hover:bg-sunken',
  danger: 'bg-rec text-on-accent hover:opacity-90',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-[15px] gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'rounded-token inline-flex items-center justify-center font-medium transition-colors duration-150',
          'disabled:pointer-events-none disabled:opacity-40',
          VARIANTS[variant],
          SIZES[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
```

- [ ] **Step 2: Écrire IconButton**

Créer `components/ui/IconButton.tsx` :

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  secondary: 'bg-surface text-fg border border-default hover:border-strong',
  ghost: 'bg-transparent text-muted hover:text-fg hover:bg-sunken',
  danger: 'bg-transparent text-rec hover:bg-sunken',
}

const SIZES: Record<Size, string> = {
  sm: 'size-8',
  md: 'size-10',
}

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Obligatoire : un bouton sans texte doit toujours être nommé pour les lecteurs d'écran. */
  label: string
  variant?: Variant
  size?: Size
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, variant = 'ghost', size = 'md', className, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          'rounded-token inline-flex shrink-0 items-center justify-center transition-colors duration-150',
          'disabled:pointer-events-none disabled:opacity-40',
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
```

- [ ] **Step 3: Écrire Panel**

Créer `components/ui/Panel.tsx` :

```tsx
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
  sunken?: boolean
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { padded = true, sunken = false, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-token-lg border-default border',
        sunken ? 'bg-sunken' : 'bg-surface shadow-token',
        padded && 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
```

- [ ] **Step 4: Créer le point d'import unique**

Créer `components/ui/index.ts` :

```ts
export { Button, type ButtonProps } from './Button'
export { IconButton, type IconButtonProps } from './IconButton'
export { Panel, type PanelProps } from './Panel'
```

- [ ] **Step 5: Créer la page vitrine**

Créer `app/dev/ui/page.tsx` :

```tsx
import { Button, IconButton, Panel } from '@/components/ui'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-faint text-[13px] font-medium tracking-widest uppercase">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function UiKitchenSink() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 p-10">
      <h1 className="text-fg text-2xl font-semibold">Kit UI</h1>

      <Section title="Button — variantes">
        <Button variant="primary">Enregistrer</Button>
        <Button variant="secondary">Rejouer</Button>
        <Button variant="ghost">Annuler</Button>
        <Button variant="danger">Supprimer</Button>
      </Section>

      <Section title="Button — tailles">
        <Button size="sm">Petit</Button>
        <Button size="md">Moyen</Button>
        <Button size="lg">Grand</Button>
      </Section>

      <Section title="Button — états">
        <Button disabled>Désactivé</Button>
        <Button loading>Chargement</Button>
        <Button variant="secondary" disabled>
          Désactivé secondaire
        </Button>
      </Section>

      <Section title="Button — pleine largeur">
        <div className="w-full">
          <Button fullWidth>Créer une partie</Button>
        </div>
      </Section>

      <Section title="IconButton">
        <IconButton label="Rejouer">⟲</IconButton>
        <IconButton label="Supprimer" variant="danger">
          ×
        </IconButton>
        <IconButton label="Options" variant="secondary">
          ⋯
        </IconButton>
        <IconButton label="Petit" size="sm" variant="secondary">
          +
        </IconButton>
      </Section>

      <Section title="Panel">
        <Panel className="flex-1">
          <p className="text-fg text-[15px]">Panneau standard sur surface.</p>
          <p className="text-muted mt-1 text-[15px]">Texte secondaire.</p>
        </Panel>
      </Section>

      <Section title="Panel — creusé">
        <Panel sunken className="flex-1">
          <p className="text-muted text-[15px]">Panneau creusé, sans ombre.</p>
        </Panel>
      </Section>
    </main>
  )
}
```

- [ ] **Step 6: Vérifier visuellement dans les deux thèmes**

Run: `npm run dev` puis ouvrir `http://localhost:3000/dev/ui`

Expected, en thème clair :
- Le bouton primaire est orange, le texte blanc, le contraste confortable
- Le bouton secondaire est blanc avec une bordure fine de 1 px qui fonce au survol
- Les boutons désactivés sont à 40 % d'opacité et ne réagissent pas au survol
- La tabulation au clavier fait apparaître un contour orange de 2 px avec un décalage de 2 px sur chaque bouton

Puis exécuter `document.documentElement.dataset.theme = 'dark'` dans la console.

Expected, en thème sombre : tout reste lisible, l'orange conserve son contraste sur le fond sombre, les panneaux se distinguent du fond par leur bordure et non par une ombre (`--shadow` vaut `none` en sombre).

- [ ] **Step 7: Vérifier compilation et lint**

Run: `npm run typecheck; npm run lint; npm run test:run`
Expected: aucune erreur, tous les tests existants passent

- [ ] **Step 8: Commit**

```powershell
git add -A
git commit -m "feat: primitives UI Button, IconButton, Panel et page vitrine"
```

---

## Task 8 : Primitives UI, lot 2 — Input, Badge, Spinner, Timecode, EmptyState

**Files:**
- Create: `components/ui/Input.tsx`, `components/ui/Badge.tsx`, `components/ui/Spinner.tsx`, `components/ui/Timecode.tsx`, `components/ui/EmptyState.tsx`
- Modify: `components/ui/index.ts`, `app/dev/ui/page.tsx`

**Interfaces:**
- Consomme : `cn` (Task 1), `formatTimecode` et `formatDuration` (Task 5)
- Produit :
  - `<Input label?: string hint?: string error?: string mono?: boolean {...InputHTMLAttributes} />`
  - `<Badge tone?: 'neutral' | 'accent' | 'rec' | 'ok' | 'warn' | 'player-1' | 'player-2' />`
  - `<Spinner size?: 'sm' | 'md' label?: string />`
  - `<Timecode seconds: number mode?: 'precise' | 'duration' />`
  - `<EmptyState title: string description?: string action?: React.ReactNode />`

- [ ] **Step 1: Écrire Input**

Créer `components/ui/Input.tsx` :

```tsx
import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  /** Chasse fixe pour les codes de salon et les timecodes saisis à la main. */
  mono?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, mono = false, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const message = error ?? hint

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-muted block text-[13px] font-medium">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          'rounded-token bg-surface text-fg placeholder:text-faint h-10 w-full border px-3 text-[15px]',
          'transition-colors duration-150 outline-none',
          mono && 'font-mono tnum',
          error ? 'border-rec' : 'border-default focus:border-strong',
          'disabled:opacity-40',
          className,
        )}
        {...props}
      />
      {message && (
        <p id={messageId} className={cn('text-[13px]', error ? 'text-rec' : 'text-faint')}>
          {message}
        </p>
      )}
    </div>
  )
})
```

- [ ] **Step 2: Écrire Badge**

Créer `components/ui/Badge.tsx` :

```tsx
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Tone = 'neutral' | 'accent' | 'rec' | 'ok' | 'warn' | 'player-1' | 'player-2'

const TONES: Record<Tone, string> = {
  neutral: 'bg-sunken text-muted',
  accent: 'bg-accent-soft text-accent',
  rec: 'bg-rec/10 text-rec',
  ok: 'bg-ok/10 text-ok',
  warn: 'bg-warn/10 text-warn',
  'player-1': 'bg-player-1/10 text-player-1',
  'player-2': 'bg-player-2/10 text-player-2',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'rounded-token inline-flex h-6 items-center px-2 text-[13px] font-medium',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 3: Écrire Spinner**

Créer `components/ui/Spinner.tsx` :

```tsx
import { cn } from '@/lib/utils/cn'

export interface SpinnerProps {
  size?: 'sm' | 'md'
  /** Annoncé aux lecteurs d'écran ; non affiché visuellement. */
  label?: string
  className?: string
}

export function Spinner({ size = 'md', label = 'Chargement', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'border-strong border-t-accent inline-block animate-spin rounded-full border-2',
        size === 'sm' ? 'size-4' : 'size-6',
        className,
      )}
    />
  )
}
```

- [ ] **Step 4: Écrire Timecode**

Créer `components/ui/Timecode.tsx` :

```tsx
import { cn } from '@/lib/utils/cn'
import { formatDuration, formatTimecode } from '@/lib/utils/time'

export interface TimecodeProps {
  seconds: number
  /** `precise` → 01:23.45 (position de lecture) · `duration` → 1:23 (listes) */
  mode?: 'precise' | 'duration'
  className?: string
}

export function Timecode({ seconds, mode = 'precise', className }: TimecodeProps) {
  const text = mode === 'precise' ? formatTimecode(seconds) : formatDuration(seconds)
  return (
    <span className={cn('tnum text-muted font-mono text-[13px] font-medium', className)}>
      {text}
    </span>
  )
}
```

- [ ] **Step 5: Écrire EmptyState**

Créer `components/ui/EmptyState.tsx` :

```tsx
import { cn } from '@/lib/utils/cn'

export interface EmptyStateProps {
  title: string
  description?: string
  /** Toujours proposer l'action suivante plutôt que de laisser l'écran mort. */
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-default rounded-token-lg flex flex-col items-center gap-2 border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <p className="text-fg text-[15px] font-medium">{title}</p>
      {description && <p className="text-muted max-w-sm text-[15px]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 6: Mettre à jour le point d'import**

Remplacer `components/ui/index.ts` :

```ts
export { Badge, type BadgeProps } from './Badge'
export { Button, type ButtonProps } from './Button'
export { EmptyState, type EmptyStateProps } from './EmptyState'
export { IconButton, type IconButtonProps } from './IconButton'
export { Input, type InputProps } from './Input'
export { Panel, type PanelProps } from './Panel'
export { Spinner, type SpinnerProps } from './Spinner'
export { Timecode, type TimecodeProps } from './Timecode'
```

- [ ] **Step 7: Étendre la page vitrine**

Dans `app/dev/ui/page.tsx`, remplacer la ligne d'import par :

```tsx
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  Input,
  Panel,
  Spinner,
  Timecode,
} from '@/components/ui'
```

Puis ajouter ces sections juste avant la fermeture `</main>` :

```tsx
      <Section title="Input">
        <div className="w-full space-y-4">
          <Input label="Pseudo" placeholder="Ton pseudo" />
          <Input label="Code du salon" mono placeholder="BCDF" maxLength={4} />
          <Input label="Avec aide" hint="4 lettres, sans accent" placeholder="BCDF" />
          <Input label="En erreur" error="Ce salon n'existe pas" defaultValue="ZZZZ" />
          <Input label="Désactivé" disabled defaultValue="Indisponible" />
        </div>
      </Section>

      <Section title="Badge">
        <Badge>Neutre</Badge>
        <Badge tone="accent">Ton tour</Badge>
        <Badge tone="rec">Enregistrement</Badge>
        <Badge tone="ok">Validé</Badge>
        <Badge tone="warn">Micro faible</Badge>
        <Badge tone="player-1">Tom</Badge>
        <Badge tone="player-2">Léa</Badge>
      </Section>

      <Section title="Spinner">
        <Spinner size="sm" />
        <Spinner />
      </Section>

      <Section title="Timecode">
        <Timecode seconds={83.45} />
        <Timecode seconds={4.2} />
        <Timecode seconds={83.45} mode="duration" />
        <Timecode seconds={8.4} mode="duration" />
      </Section>

      <Section title="EmptyState">
        <EmptyState
          className="flex-1"
          title="Aucune scène pour l'instant"
          description="Place un marqueur sur la timeline pour découper ton clip en scènes."
          action={<Button size="sm">Couper ici</Button>}
        />
      </Section>
```

- [ ] **Step 8: Vérifier visuellement dans les deux thèmes**

Run: `npm run dev` puis ouvrir `http://localhost:3000/dev/ui`

Expected :
- Le champ « Code du salon » affiche `BCDF` en JetBrains Mono, chiffres alignés
- Le champ en erreur a une bordure rouge et son message en rouge, et l'inspecteur montre `aria-invalid="true"` ainsi que `aria-describedby` pointant sur le message
- Les deux `Timecode` en mode `precise` (`01:23.45` et `00:04.20`) sont **exactement de la même largeur** — c'est ce que valide `tnum`
- Les badges `player-1` et `player-2` sont respectivement bleus et ambrés sur fond teinté
- Bascule en sombre : les fonds teintés des badges (`bg-rec/10`) restent subtils et le texte reste lisible

- [ ] **Step 9: Vérifier compilation et lint**

Run: `npm run typecheck; npm run lint; npm run test:run`
Expected: aucune erreur

- [ ] **Step 10: Commit**

```powershell
git add -A
git commit -m "feat: primitives UI Input, Badge, Spinner, Timecode, EmptyState"
```

---

## Task 9 : Dialog

**Files:**
- Create: `components/ui/Dialog.tsx`, `components/ui/Dialog.test.tsx`
- Modify: `components/ui/index.ts`, `app/dev/ui/page.tsx`

**Interfaces:**
- Consomme : `cn` (Task 1), `IconButton` (Task 7)
- Produit : `<Dialog open: boolean onClose: () => void title: string description?: string children?: React.ReactNode footer?: React.ReactNode />`

**Pourquoi ce composant est testé alors que les autres ne le sont pas :** le piège de focus et la fermeture par `Échap` sont du comportement, pas de l'apparence. Ils cassent silencieusement lors d'un refactor et aucune relecture visuelle ne les rattrape.

**Implémentation :** on s'appuie sur l'élément natif `<dialog>` et sa méthode `showModal()`, qui apporte gratuitement le piège de focus, l'inertie de l'arrière-plan et la couche de superposition. On n'ajoute que la fermeture au clic sur le fond et la synchronisation avec la prop `open`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `components/ui/Dialog.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

// jsdom n'implémente pas showModal/close : on les simule en pilotant
// l'attribut `open`, ce qui suffit pour tester notre logique.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})

describe('Dialog', () => {
  it("ne rend rien quand open vaut false", () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Confirmer">
        Contenu
      </Dialog>,
    )
    expect(screen.queryByText('Contenu')).not.toBeInTheDocument()
  })

  it('affiche le titre et le contenu quand open vaut true', () => {
    render(
      <Dialog open onClose={() => {}} title="Confirmer">
        Contenu
      </Dialog>,
    )
    expect(screen.getByText('Confirmer')).toBeInTheDocument()
    expect(screen.getByText('Contenu')).toBeInTheDocument()
  })

  it("appelle onClose sur l'événement cancel, que le navigateur émet sur Échap", () => {
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose} title="Confirmer">
        Contenu
      </Dialog>,
    )

    // jsdom n'implémente pas la conversion native Échap → événement `cancel`.
    // On émet donc l'événement directement : c'est exactement ce à quoi le
    // composant se branche. La chaîne complète (vraie touche Échap sur un
    // vrai <dialog>) est vérifiée à la main au Step 7.
    const dialog = screen.getByRole('dialog', { hidden: true })
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('appelle onClose au clic sur le bouton de fermeture', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Dialog open onClose={onClose} title="Confirmer">
        Contenu
      </Dialog>,
    )

    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('relie la description au dialogue via aria-describedby', () => {
    render(
      <Dialog open onClose={() => {}} title="Confirmer" description="Action irréversible.">
        Contenu
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog', { hidden: true })
    const describedBy = dialog.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      'Action irréversible.',
    )
  })

  it('affiche le pied de dialogue quand il est fourni', () => {
    render(
      <Dialog
        open
        onClose={() => {}}
        title="Confirmer"
        footer={<button type="button">Supprimer</button>}
      >
        Contenu
      </Dialog>,
    )
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm run test:run -- components/ui/Dialog.test.tsx`
Expected: ÉCHEC — `Failed to resolve import "./Dialog"`

- [ ] **Step 3: Écrire l'implémentation**

Créer `components/ui/Dialog.tsx` :

```tsx
'use client'

import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { IconButton } from './IconButton'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const baseId = useId()
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-description`

  // On utilise showModal() plutôt que l'attribut `open` : c'est lui qui
  // apporte le piège de focus, l'inertie de l'arrière-plan et la couche
  // de superposition, sans qu'on ait à les réimplémenter.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // `cancel` couvre la touche Échap, que le navigateur gère nativement.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={(event) => {
        // Le clic sur la zone sombre atteint <dialog> lui-même, jamais son contenu.
        if (event.target === ref.current) onClose()
      }}
      className={cn(
        'bg-surface rounded-token-lg border-default shadow-float m-auto w-[min(28rem,calc(100vw-2rem))] border p-0',
        'backdrop:bg-black/40',
        className,
      )}
    >
      {open && (
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 id={titleId} className="text-fg text-[15px] font-semibold">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-muted text-[15px]">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Fermer" size="sm" onClick={onClose}>
              ×
            </IconButton>
          </div>

          {children && <div className="text-fg mt-4 text-[15px]">{children}</div>}
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npm run test:run -- components/ui/Dialog.test.tsx`
Expected: SUCCÈS — 6 tests passent

- [ ] **Step 5: Exporter Dialog**

Dans `components/ui/index.ts`, ajouter en respectant l'ordre alphabétique, après la ligne `Button` :

```ts
export { Dialog, type DialogProps } from './Dialog'
```

- [ ] **Step 6: Ajouter Dialog à la page vitrine**

`Dialog` a besoin d'état local, la page vitrine devient donc un composant client.

Dans `app/dev/ui/page.tsx`, la directive `'use client'` doit être la **toute première ligne du fichier**, avant le moindre import. Le fichier commence donc désormais ainsi :

```tsx
'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  IconButton,
  Input,
  Panel,
  Spinner,
  Timecode,
} from '@/components/ui'
```

Puis, dans le corps du composant `UiKitchenSink`, avant le `return` :

```tsx
  const [dialogOpen, setDialogOpen] = useState(false)
```

Et cette section juste avant la fermeture `</main>` :

```tsx
      <Section title="Dialog">
        <Button variant="secondary" onClick={() => setDialogOpen(true)}>
          Ouvrir la modale
        </Button>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Supprimer cette scène ?"
          description="Les prises enregistrées pour cette scène seront perdues."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="danger" onClick={() => setDialogOpen(false)}>
                Supprimer
              </Button>
            </>
          }
        />
      </Section>
```

- [ ] **Step 7: Vérifier visuellement le comportement réel**

Run: `npm run dev` puis ouvrir `http://localhost:3000/dev/ui`

Expected :
- Ouvrir la modale, puis presser `Tab` de façon répétée : le focus **reste piégé** à l'intérieur de la modale et ne repart jamais sur la page derrière
- `Échap` ferme la modale
- Le clic sur la zone sombre ferme la modale ; le clic sur le panneau blanc ne la ferme pas
- L'arrière-plan est assombri et non défilable
- En thème sombre, le panneau se détache du fond grâce à `--shadow-float`

- [ ] **Step 8: Vérifier compilation, lint et suite complète**

Run: `npm run typecheck; npm run lint; npm run test:run`
Expected: aucune erreur, tous les tests passent

- [ ] **Step 9: Commit**

```powershell
git add -A
git commit -m "feat: composant Dialog accessible base sur l'element natif"
```

---

## Task 10 : ThemeToggle

**Files:**
- Create: `components/ui/ThemeToggle.tsx`
- Modify: `components/ui/index.ts`, `components/layout/Header.tsx`

**Interfaces:**
- Consomme : `applyTheme`, `readStoredTheme`, `toggleTheme`, `type Theme` (Task 3), `IconButton` (Task 7)
- Produit : `<ThemeToggle />` — sans props, placé dans l'en-tête

- [ ] **Step 1: Écrire le composant**

Créer `components/ui/ThemeToggle.tsx` :

```tsx
'use client'

import { useEffect, useState } from 'react'
import { applyTheme, readStoredTheme, toggleTheme, type Theme } from '@/lib/theme'
import { IconButton } from './IconButton'

export function ThemeToggle() {
  // Le rendu serveur ne connaît pas localStorage : on part sur 'light',
  // qui est aussi le défaut du produit, puis on se synchronise au montage.
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(readStoredTheme())
    setMounted(true)
  }, [])

  function handleToggle() {
    const next = toggleTheme(theme)
    setTheme(next)
    applyTheme(next)
  }

  const label = theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'

  return (
    <IconButton
      label={label}
      size="sm"
      onClick={handleToggle}
      // Avant le montage on ne sait pas quel thème est actif : on masque
      // l'icône plutôt que d'en afficher une fausse pendant un instant.
      className={mounted ? undefined : 'invisible'}
    >
      <span aria-hidden="true" className="text-[15px] leading-none">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
    </IconButton>
  )
}
```

- [ ] **Step 2: Exporter le composant**

Dans `components/ui/index.ts`, ajouter à la fin :

```ts
export { ThemeToggle } from './ThemeToggle'
```

- [ ] **Step 3: Placer le toggle dans l'en-tête**

Dans `components/layout/Header.tsx`, ajouter l'import :

```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle'
```

Puis ajouter juste après la `<div>` centrale, avant la fermeture `</header>` :

```tsx
      <ThemeToggle />
```

- [ ] **Step 4: Vérifier le comportement complet**

Run: `npm run dev`

Expected :
1. Le site s'affiche en clair au premier chargement, l'icône ☾ apparaît à droite de l'en-tête
2. Cliquer bascule tout le site en sombre, l'icône devient ☀
3. **Recharger la page (`F5`) : le site reste en sombre et à aucun moment un fond blanc ne clignote.** C'est ce que valide `THEME_INIT_SCRIPT` — le vérifier en rechargeant plusieurs fois de suite
4. `localStorage.getItem('voiced-theme')` renvoie `"dark"`
5. Aucun avertissement d'hydratation dans la console

- [ ] **Step 5: Vérifier compilation, lint et tests**

Run: `npm run typecheck; npm run lint; npm run test:run`
Expected: aucune erreur

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: bascule de theme dans l'en-tete, sans clignotement au chargement"
```

---

## Task 11 : Projet Supabase et schéma de base

**Files:**
- Create: `supabase/config.toml` (généré par le CLI)
- Create: `supabase/migrations/20260801120000_initial_schema.sql`
- Create: `.env.example`
- Create: `.env.local` (non versionné)

**Interfaces:**
- Consomme : rien
- Produit : les tables `clips`, `characters`, `scenes`, `rooms`, `players`, `assignments`, `takes` ; les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`

- [ ] **Step 1: Créer le projet Supabase**

Action manuelle sur [supabase.com](https://supabase.com) :
1. Créer un projet nommé `voiced-io`, région `eu-west` (Irlande), plan gratuit
2. Noter le mot de passe de la base
3. Dans **Settings → API**, relever l'URL du projet, la clé `anon public` et la clé `service_role`
4. Dans **Settings → General**, relever le *Reference ID*

- [ ] **Step 2: Écrire les fichiers d'environnement**

Créer `.env.example` (versionné, sans valeurs) :

```bash
# Supabase — Settings > API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Serveur uniquement : contourne RLS, ne jamais exposer au client
SUPABASE_SERVICE_ROLE_KEY=

# Protège la route de cron contre les appels externes
CRON_SECRET=
```

Créer `.env.local` avec les vraies valeurs. Vérifier qu'il est bien ignoré :

Run: `git check-ignore -v .env.local`
Expected: la règle `.env*.local` du `.gitignore` est affichée

- [ ] **Step 3: Initialiser et lier le CLI Supabase**

```powershell
npx supabase init
npx supabase login
npx supabase link --project-ref <REFERENCE_ID>
```

- [ ] **Step 4: Écrire la migration du schéma**

Créer `supabase/migrations/20260801120000_initial_schema.sql` :

```sql
-- ═══════════════════════════════════════════════════════════════
-- voiced.io — schéma initial
-- Décisions structurantes :
--   · Le découpage est non-destructif : une scène est un intervalle,
--     pas un fichier. Aucune colonne ne pointe vers une vidéo découpée.
--   · Une scène = UN personnage qui parle. Deux personnages dans un
--     même passage → deux scènes. Cela simplifie casting et tour de parole.
--   · Pas de table `users` : un joueur est un pseudo attaché à un salon.
--     La colonne players.user_id sera ajoutée en Phase 3.
-- ═══════════════════════════════════════════════════════════════

-- ── Clips ──────────────────────────────────────────────────────
create table public.clips (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  source       text not null check (source in ('library', 'custom')),
  storage_path text not null,
  thumb_path   text,
  duration_sec numeric(10, 3) not null check (duration_sec > 0),
  width        int,
  height       int,
  anime_title  text,
  peaks        jsonb,
  created_by   text,
  -- null pour la bibliothèque : ces clips ne périment jamais
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

comment on column public.clips.peaks is
  'Amplitudes de la waveform, capturées au premier visionnage puis mises en cache.';
comment on column public.clips.expires_at is
  'Les clips personnalisés expirent à 7 jours. null pour la bibliothèque.';

create index clips_expires_at_idx on public.clips (expires_at)
  where expires_at is not null;
create index clips_source_idx on public.clips (source);

-- ── Personnages ────────────────────────────────────────────────
create table public.characters (
  id      uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips (id) on delete cascade,
  name    text not null,
  -- Nom de token, jamais une valeur hexadécimale : 'player-1', 'player-2'
  color   text not null,
  sort    int  not null default 0
);

create index characters_clip_id_idx on public.characters (clip_id);

-- ── Scènes ─────────────────────────────────────────────────────
create table public.scenes (
  id           uuid primary key default gen_random_uuid(),
  clip_id      uuid not null references public.clips (id) on delete cascade,
  character_id uuid references public.characters (id) on delete set null,
  idx          int  not null,
  start_sec    numeric(10, 3) not null check (start_sec >= 0),
  end_sec      numeric(10, 3) not null,
  label        text,
  constraint scenes_interval_valid check (end_sec > start_sec),
  -- Durée minimale de scène : en dessous, on ne peut rien doubler
  constraint scenes_min_duration check (end_sec - start_sec >= 0.5),
  constraint scenes_unique_idx unique (clip_id, idx)
);

create index scenes_clip_id_idx on public.scenes (clip_id, idx);

-- ── Salons ─────────────────────────────────────────────────────
create table public.rooms (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[BCDFGHJKLMNPQRSTVWXZ]{4}$'),
  clip_id     uuid not null references public.clips (id) on delete cascade,
  status      text not null default 'lobby'
                check (status in ('lobby', 'casting', 'dubbing', 'review', 'done')),
  current_idx int  not null default 0,
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now()
);

comment on table public.rooms is
  'Source de vérité unique de l''état d''une partie. Les deux clients écoutent
   les changements de cette ligne via Realtime et se redessinent.';

create index rooms_code_idx on public.rooms (code);
create index rooms_expires_at_idx on public.rooms (expires_at);

-- ── Joueurs ────────────────────────────────────────────────────
create table public.players (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.rooms (id) on delete cascade,
  nickname     text not null check (length(trim(nickname)) between 1 and 20),
  slot         int  not null check (slot in (1, 2)),
  is_host      boolean not null default false,
  last_seen_at timestamptz not null default now(),
  constraint players_unique_slot unique (room_id, slot)
);

create index players_room_id_idx on public.players (room_id);

-- ── Attributions ───────────────────────────────────────────────
create table public.assignments (
  room_id      uuid not null references public.rooms (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  player_id    uuid not null references public.players (id) on delete cascade,
  primary key (room_id, character_id)
);

create index assignments_player_id_idx on public.assignments (player_id);

-- ── Prises ─────────────────────────────────────────────────────
create table public.takes (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.rooms (id) on delete cascade,
  scene_id     uuid not null references public.scenes (id) on delete cascade,
  player_id    uuid references public.players (id) on delete set null,
  storage_path text not null,
  mime_type    text not null,
  duration_ms  int  not null check (duration_ms > 0),
  -- Correction de la latence de MediaRecorder, mesurée puis ajustable à l'oreille
  offset_ms    int  not null default 0 check (offset_ms between -3000 and 3000),
  peaks        jsonb,
  is_selected  boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on column public.takes.mime_type is
  'Chrome et Firefox produisent du webm/opus, Safari du mp4/aac.
   Stocké pour que l''export sache quel décodeur utiliser.';

create index takes_room_scene_idx on public.takes (room_id, scene_id);

-- Une seule prise retenue par scène et par salon
create unique index takes_one_selected_per_scene
  on public.takes (room_id, scene_id)
  where is_selected;

-- ── Realtime ───────────────────────────────────────────────────
-- Les clients s'abonnent aux changements de ces tables pour rester synchronisés.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.takes;
```

- [ ] **Step 5: Appliquer la migration**

Run: `npx supabase db push`
Expected: la migration s'applique sans erreur

- [ ] **Step 6: Vérifier le schéma dans le tableau de bord**

Ouvrir **Table Editor** sur supabase.com.
Expected: les 7 tables sont présentes. Dans **Database → Publications → supabase_realtime**, les 4 tables `rooms`, `players`, `assignments`, `takes` sont cochées.

- [ ] **Step 7: Vérifier qu'une contrainte clé fonctionne**

Dans **SQL Editor**, exécuter :

```sql
insert into public.clips (title, source, storage_path, duration_sec)
values ('Test', 'custom', 'clips/test.mp4', 12.5)
returning id;

-- Doit ÉCHOUER : code de salon contenant une voyelle
insert into public.rooms (code, clip_id)
values ('ABCD', (select id from public.clips where title = 'Test'));
```

Expected: le premier insert réussit, le second échoue avec une violation de la contrainte `rooms_code_check`. Nettoyer ensuite :

```sql
delete from public.clips where title = 'Test';
```

- [ ] **Step 8: Commit**

```powershell
git add -A
git commit -m "feat: schema initial Supabase et configuration d'environnement"
```

---

## Task 12 : Politiques RLS

**Files:**
- Create: `supabase/migrations/20260801130000_rls_policies.sql`
- Create: `scripts/check-rls.ts`
- Modify: `package.json`

**Interfaces:**
- Consomme : le schéma de la Task 11
- Produit : RLS actif sur les 7 tables ; le script npm `check:rls`

**Modèle de sécurité de la Phase 0-2 :** il n'y a pas de comptes. La connaissance du code de salon donne l'accès. Concrètement : le rôle `anon` peut **lire** — c'est indispensable, Realtime ne délivre que les lignes que le client peut voir — mais ne peut **rien écrire**. Toutes les écritures passent par des server actions utilisant la clé `service_role`, qui contourne RLS et applique les règles métier en TypeScript.

C'est un modèle honnête pour un jeu entre amis, pas pour des données sensibles. Sa limite est explicite : quelqu'un qui devine un identifiant peut lire une partie. Avec des salons qui expirent en 24 h et aucune donnée personnelle stockée, le risque est accepté. Il sera resserré en Phase 3 quand l'authentification arrivera.

- [ ] **Step 1: Écrire la migration des politiques**

Créer `supabase/migrations/20260801130000_rls_policies.sql` :

```sql
-- ═══════════════════════════════════════════════════════════════
-- Politiques RLS — modèle Phase 0 à 2 (sans comptes)
--
--   anon : LECTURE seule sur tout. Nécessaire pour que Realtime
--          délivre les changements aux clients.
--   écritures : exclusivement via server actions en service_role,
--          qui contourne RLS et applique les règles métier.
--
-- Limite assumée : deviner un identifiant permet de lire une partie.
-- Acceptable pour un jeu entre amis, sans donnée personnelle, avec
-- des salons qui expirent en 24 h. Resserré en Phase 3 avec l'auth.
-- ═══════════════════════════════════════════════════════════════

alter table public.clips       enable row level security;
alter table public.characters  enable row level security;
alter table public.scenes      enable row level security;
alter table public.rooms       enable row level security;
alter table public.players     enable row level security;
alter table public.assignments enable row level security;
alter table public.takes       enable row level security;

create policy "lecture publique" on public.clips
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.characters
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.scenes
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.rooms
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.players
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.assignments
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.takes
  for select to anon, authenticated using (true);

-- Aucune politique d'écriture n'est déclarée : avec RLS actif, cela
-- équivaut à un refus total pour anon. C'est intentionnel.
```

- [ ] **Step 2: Appliquer la migration**

Run: `npx supabase db push`
Expected: la migration s'applique sans erreur

- [ ] **Step 3: Écrire le script de sondage**

Créer `scripts/check-rls.ts` :

```ts
/**
 * Sonde les politiques RLS contre la vraie base avec la clé anon.
 * Une politique RLS ne se teste honnêtement que de cette façon :
 * en essayant réellement de lire et d'écrire.
 *
 * Lancer avec : npm run check:rls
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requis')
  process.exit(1)
}

const supabase = createClient(url, anonKey)

const TABLES = [
  'clips',
  'characters',
  'scenes',
  'rooms',
  'players',
  'assignments',
  'takes',
] as const

let failures = 0

function report(ok: boolean, message: string) {
  console.log(`${ok ? '  OK  ' : ' ÉCHEC'} ${message}`)
  if (!ok) failures++
}

async function main() {
  console.log('\nLecture avec la clé anon — doit réussir sur toutes les tables\n')
  for (const table of TABLES) {
    const { error } = await supabase.from(table).select('*').limit(1)
    report(!error, `select sur ${table}${error ? ` → ${error.message}` : ''}`)
  }

  console.log('\nÉcriture avec la clé anon — doit échouer sur toutes les tables\n')

  const { error: clipError } = await supabase
    .from('clips')
    .insert({ title: 'rls-probe', source: 'custom', storage_path: 'x', duration_sec: 1 })
  report(clipError !== null, `insert sur clips refusé${clipError ? '' : ' → A RÉUSSI, faille'}`)

  const { error: roomError } = await supabase
    .from('rooms')
    .insert({ code: 'BCDF', clip_id: '00000000-0000-0000-0000-000000000000' })
  report(roomError !== null, `insert sur rooms refusé${roomError ? '' : ' → A RÉUSSI, faille'}`)

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ status: 'done' })
    .eq('code', 'BCDF')
    .select()
  const updateBlocked = updateError !== null
  report(updateBlocked, `update sur rooms refusé${updateBlocked ? '' : ' → A RÉUSSI, faille'}`)

  console.log(
    failures === 0
      ? '\nToutes les sondes RLS sont conformes.\n'
      : `\n${failures} sonde(s) non conforme(s).\n`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

void main()
```

- [ ] **Step 4: Installer le client Supabase et ajouter le script npm**

```powershell
npm i @supabase/supabase-js
npm i -D tsx dotenv-cli
```

Dans `package.json`, ajouter aux scripts :

```json
    "check:rls": "dotenv -e .env.local -- tsx scripts/check-rls.ts"
```

- [ ] **Step 5: Lancer le sondage**

Run: `npm run check:rls`
Expected : les 7 lectures affichent `OK`, les 3 écritures affichent `OK` (elles ont bien été refusées), et le script se termine sur « Toutes les sondes RLS sont conformes. » avec un code de sortie 0.

Si une écriture réussit, c'est une faille réelle : ne pas continuer, vérifier qu'aucune politique `for insert` ou `for all` n'a été créée par erreur.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: politiques RLS en lecture seule pour anon et script de sondage"
```

---

## Task 13 : Buckets de stockage et adaptateur

**Files:**
- Create: `lib/storage/paths.ts`, `lib/storage/paths.test.ts`, `lib/storage/index.ts`

**Interfaces:**
- Consomme : `lib/supabase/server` (créé dans cette tâche, finalisé en Task 14)
- Produit :
  - `type Bucket = 'clips' | 'takes' | 'thumbs'`
  - `clipPath(clipId: string, extension: string): string`
  - `takePath(roomId: string, takeId: string, extension: string): string`
  - `thumbPath(clipId: string): string`
  - `extensionFromMime(mimeType: string): string`
  - `upload(bucket, path, body, options?): Promise<void>`
  - `getUrl(bucket, path, expiresInSeconds?): Promise<string>`
  - `remove(bucket, paths: string[]): Promise<void>`
  - `exists(bucket, path): Promise<boolean>`

**Règle absolue :** c'est le seul module du projet autorisé à toucher `supabase.storage`. Toute la Phase 1 et l'export de la Phase 2 passent par ces quatre fonctions. C'est ce qui rendra la migration vers Cloudflare R2 possible en changeant un seul fichier.

- [ ] **Step 1: Créer les buckets**

Sur supabase.com, dans **Storage**, créer trois buckets :

| Nom | Public | Limite de taille | Types MIME autorisés |
|---|---|---|---|
| `clips` | non | 50 MB | `video/mp4` |
| `takes` | non | 10 MB | `audio/webm`, `audio/mp4`, `audio/ogg` |
| `thumbs` | **oui** | 1 MB | `image/jpeg`, `image/webp` |

`thumbs` est public parce que ce sont de simples vignettes affichées en grille : les servir par URL signée obligerait à un aller-retour serveur par image pour aucun bénéfice.

- [ ] **Step 2: Écrire les tests de construction de chemins**

Créer `lib/storage/paths.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { clipPath, extensionFromMime, takePath, thumbPath } from './paths'

const CLIP_ID = '3f2b8c1e-0000-4000-8000-000000000001'
const ROOM_ID = '3f2b8c1e-0000-4000-8000-000000000002'
const TAKE_ID = '3f2b8c1e-0000-4000-8000-000000000003'

describe('clipPath', () => {
  it("range le clip dans un dossier à son identifiant", () => {
    expect(clipPath(CLIP_ID, 'mp4')).toBe(`${CLIP_ID}/source.mp4`)
  })

  it("accepte une extension déjà préfixée d'un point", () => {
    expect(clipPath(CLIP_ID, '.mp4')).toBe(`${CLIP_ID}/source.mp4`)
  })
})

describe('takePath', () => {
  it('range la prise sous son salon', () => {
    expect(takePath(ROOM_ID, TAKE_ID, 'webm')).toBe(`${ROOM_ID}/${TAKE_ID}.webm`)
  })
})

describe('thumbPath', () => {
  it('produit un chemin de vignette stable', () => {
    expect(thumbPath(CLIP_ID)).toBe(`${CLIP_ID}/thumb.jpg`)
  })
})

describe('extensionFromMime', () => {
  it('reconnaît les formats produits par MediaRecorder', () => {
    expect(extensionFromMime('audio/webm')).toBe('webm')
    expect(extensionFromMime('audio/webm;codecs=opus')).toBe('webm')
    expect(extensionFromMime('audio/mp4')).toBe('mp4')
    expect(extensionFromMime('audio/mp4;codecs=mp4a.40.2')).toBe('mp4')
    expect(extensionFromMime('audio/ogg;codecs=opus')).toBe('ogg')
  })

  it('reconnaît les formats vidéo et image', () => {
    expect(extensionFromMime('video/mp4')).toBe('mp4')
    expect(extensionFromMime('image/jpeg')).toBe('jpg')
    expect(extensionFromMime('image/webp')).toBe('webp')
  })

  it('retombe sur bin pour un type inconnu', () => {
    expect(extensionFromMime('application/octet-stream')).toBe('bin')
    expect(extensionFromMime('')).toBe('bin')
  })
})
```

- [ ] **Step 3: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm run test:run -- lib/storage/paths.test.ts`
Expected: ÉCHEC — `Failed to resolve import "./paths"`

- [ ] **Step 4: Écrire les constructeurs de chemins**

Créer `lib/storage/paths.ts` :

```ts
export type Bucket = 'clips' | 'takes' | 'thumbs'

const MIME_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'video/mp4': 'mp4',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

function normalize(extension: string): string {
  return extension.startsWith('.') ? extension.slice(1) : extension
}

/** `audio/webm;codecs=opus` → `webm` */
export function extensionFromMime(mimeType: string): string {
  const base = mimeType.split(';')[0]?.trim().toLowerCase() ?? ''
  return MIME_EXTENSIONS[base] ?? 'bin'
}

/**
 * Un dossier par clip : supprimer un clip expiré revient à supprimer
 * son préfixe, sans avoir à énumérer des fichiers dispersés.
 */
export function clipPath(clipId: string, extension: string): string {
  return `${clipId}/source.${normalize(extension)}`
}

export function takePath(roomId: string, takeId: string, extension: string): string {
  return `${roomId}/${takeId}.${normalize(extension)}`
}

export function thumbPath(clipId: string): string {
  return `${clipId}/thumb.jpg`
}
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

Run: `npm run test:run -- lib/storage/paths.test.ts`
Expected: SUCCÈS — 7 tests passent

- [ ] **Step 6: Écrire l'adaptateur**

Créer `lib/storage/index.ts` :

```ts
/**
 * SEUL point d'accès aux fichiers du projet.
 *
 * Aucun autre module n'importe `supabase.storage`. C'est ce qui rendra la
 * migration vers Cloudflare R2 — prévue quand le gigaoctet gratuit de
 * Supabase sera atteint — possible en réécrivant ce seul fichier.
 */
import { createServiceClient } from '@/lib/supabase/server'
import type { Bucket } from './paths'

export type { Bucket } from './paths'
export { clipPath, extensionFromMime, takePath, thumbPath } from './paths'

const DEFAULT_URL_TTL_SECONDS = 60 * 60 // 1 h

export interface UploadOptions {
  contentType?: string
  /** Écrase un fichier existant au même chemin. */
  upsert?: boolean
}

export async function upload(
  bucket: Bucket,
  path: string,
  body: Blob | ArrayBuffer | Uint8Array,
  options: UploadOptions = {},
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: options.contentType,
    upsert: options.upsert ?? false,
  })
  if (error) {
    throw new Error(`Échec de l'envoi vers ${bucket}/${path} : ${error.message}`)
  }
}

/**
 * URL signée pour `clips` et `takes` (buckets privés),
 * URL publique directe pour `thumbs`.
 */
export async function getUrl(
  bucket: Bucket,
  path: string,
  expiresInSeconds: number = DEFAULT_URL_TTL_SECONDS,
): Promise<string> {
  const supabase = createServiceClient()

  if (bucket === 'thumbs') {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data) {
    throw new Error(`Échec de la signature de ${bucket}/${path} : ${error?.message}`)
  }
  return data.signedUrl
}

export async function remove(bucket: Bucket, paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const supabase = createServiceClient()
  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) {
    throw new Error(`Échec de la suppression dans ${bucket} : ${error.message}`)
  }
}

export async function exists(bucket: Bucket, path: string): Promise<boolean> {
  const supabase = createServiceClient()
  const lastSlash = path.lastIndexOf('/')
  const folder = lastSlash === -1 ? '' : path.slice(0, lastSlash)
  const filename = path.slice(lastSlash + 1)

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { search: filename, limit: 1 })

  if (error) return false
  return (data ?? []).some((entry) => entry.name === filename)
}
```

Ce fichier importe `@/lib/supabase/server`, qui est créé à la tâche suivante. La compilation échouera jusque-là : c'est attendu, les deux tâches se valident ensemble à la Task 14.

- [ ] **Step 7: Commit**

```powershell
git add -A
git commit -m "feat: adaptateur de stockage, point d'acces unique aux fichiers"
```

---

## Task 14 : Clients Supabase et types générés

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/env.ts`
- Create: `types/db.ts` (généré)
- Modify: `package.json`

**Interfaces:**
- Consomme : le schéma (Task 11), les politiques RLS (Task 12)
- Produit :
  - `createBrowserClient(): SupabaseClient<Database>` — clé anon, soumis à RLS, utilisé par les composants client et les abonnements Realtime
  - `createServiceClient(): SupabaseClient<Database>` — clé service_role, contourne RLS, **serveur uniquement**
  - `type Database` et les alias de lignes `Clip`, `Scene`, `Character`, `Room`, `Player`, `Assignment`, `Take`
  - le script npm `db:types`

- [ ] **Step 1: Écrire la lecture d'environnement**

Créer `lib/env.ts` :

```ts
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Voir .env.example.`,
    )
  }
  return value
}

export const env = {
  supabaseUrl: () =>
    required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    required(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  supabaseServiceRoleKey: () =>
    required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  cronSecret: () => required('CRON_SECRET', process.env.CRON_SECRET),
}
```

Les valeurs sont lues à l'appel et non au chargement du module : sinon, le simple fait d'importer ce fichier ferait planter le build quand une variable manque.

- [ ] **Step 2: Générer les types depuis la base**

Ajouter à `package.json` :

```json
    "db:types": "supabase gen types typescript --linked > types/db.ts"
```

Run: `npm run db:types`
Expected: `types/db.ts` est créé et contient un type `Database` avec les 7 tables

- [ ] **Step 3: Ajouter les alias de lignes**

Créer `lib/supabase/types.ts` :

```ts
import type { Database } from '@/types/db'

type Tables = Database['public']['Tables']

export type Clip = Tables['clips']['Row']
export type Character = Tables['characters']['Row']
export type Scene = Tables['scenes']['Row']
export type Room = Tables['rooms']['Row']
export type Player = Tables['players']['Row']
export type Assignment = Tables['assignments']['Row']
export type Take = Tables['takes']['Row']

export type ClipInsert = Tables['clips']['Insert']
export type SceneInsert = Tables['scenes']['Insert']
export type RoomInsert = Tables['rooms']['Insert']
export type TakeInsert = Tables['takes']['Insert']

export type RoomStatus = Room['status']
```

- [ ] **Step 4: Écrire le client navigateur**

Créer `lib/supabase/client.ts` :

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/db'

let cached: SupabaseClient<Database> | null = null

/**
 * Client navigateur : clé anon, soumis à RLS, donc en lecture seule.
 * Sert aux lectures et aux abonnements Realtime. Toutes les écritures
 * passent par des server actions.
 *
 * Mis en cache : ouvrir plusieurs connexions Realtime pour un même
 * onglet consommerait le quota gratuit pour rien.
 */
export function createBrowserClient(): SupabaseClient<Database> {
  cached ??= createClient<Database>(env.supabaseUrl(), env.supabaseAnonKey(), {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 5 } },
  })
  return cached
}
```

- [ ] **Step 5: Écrire le client serveur**

Créer `lib/supabase/server.ts` :

```ts
import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/db'

/**
 * Client serveur : clé service_role, contourne RLS.
 *
 * L'import de `server-only` fait échouer la compilation si ce module est
 * jamais importé depuis un composant client — le garde-fou qui empêche
 * la clé de fuiter dans le bundle navigateur.
 *
 * Non mis en cache : chaque invocation serveur est isolée.
 */
export function createServiceClient(): SupabaseClient<Database> {
  return createClient<Database>(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
```

- [ ] **Step 6: Installer le garde-fou serveur**

```powershell
npm i server-only
```

- [ ] **Step 7: Vérifier que tout compile**

Run: `npm run typecheck`
Expected: aucune erreur — `lib/storage/index.ts` de la Task 13 résout maintenant son import

- [ ] **Step 8: Vérifier la connexion réelle à la base**

Créer temporairement `app/dev/db/page.tsx` :

```tsx
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DbCheck() {
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })

  return (
    <main className="p-10">
      <p className="text-fg text-[15px]">
        {error ? `Erreur : ${error.message}` : `Connexion établie — ${count ?? 0} clip(s)`}
      </p>
    </main>
  )
}
```

Run: `npm run dev` puis ouvrir `http://localhost:3000/dev/db`
Expected: « Connexion établie — 0 clip(s) »

Supprimer ensuite la page :

```powershell
Remove-Item app\dev\db -Recurse -Force
```

- [ ] **Step 9: Vérifier lint et tests**

Run: `npm run lint; npm run test:run`
Expected: aucune erreur, tous les tests passent

- [ ] **Step 10: Commit**

```powershell
git add -A
git commit -m "feat: clients Supabase navigateur et serveur, types generes"
```

---

## Task 15 : Page d'accueil

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consomme : `Button`, `Panel` (Task 7), `EmptyState` (Task 8)
- Produit : la page d'accueil, avec un bouton actif vers la création et un bouton désactivé vers la bibliothèque

Le bouton « Bibliothèque » est désactivé et le dit : la bibliothèque arrive en Phase 3. Annoncer une fonctionnalité absente en la grisant vaut mieux que la cacher, elle donne la mesure de ce qui vient.

- [ ] **Step 1: Écrire la page**

Remplacer intégralement `app/page.tsx` :

```tsx
import { Button, Panel } from '@/components/ui'

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
      <h1 className="text-fg text-2xl font-semibold tracking-tight">
        Doublez une scène d&apos;anime à deux
      </h1>
      <p className="text-muted mt-3 max-w-md text-[15px]">
        Importez un clip, découpez-le en scènes, et enregistrez vos voix chacun
        votre tour. Aucun compte, aucune installation.
      </p>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
        <Panel className="flex flex-col items-start gap-3 text-left">
          <div>
            <h2 className="text-fg text-[15px] font-medium">Créer une partie</h2>
            <p className="text-muted mt-1 text-[15px]">
              Importez votre propre clip MP4 et invitez un ami avec un code.
            </p>
          </div>
          <Button className="mt-auto" fullWidth>
            Commencer
          </Button>
        </Panel>

        <Panel sunken className="flex flex-col items-start gap-3 text-left">
          <div>
            <h2 className="text-muted text-[15px] font-medium">Bibliothèque</h2>
            <p className="text-faint mt-1 text-[15px]">
              Une sélection de scènes déjà découpées, prêtes à doubler.
            </p>
          </div>
          <Button variant="secondary" className="mt-auto" fullWidth disabled>
            Bientôt disponible
          </Button>
        </Panel>
      </div>

      <p className="text-faint mt-10 text-[13px]">
        L&apos;enregistrement nécessite un ordinateur avec un micro.
      </p>
    </main>
  )
}
```

Le bouton « Commencer » n'a pas encore de destination : `/create` est construit en Phase 1.

- [ ] **Step 2: Vérifier visuellement dans les deux thèmes**

Run: `npm run dev` puis ouvrir `http://localhost:3000`

Expected :
- Deux panneaux côte à côte au-dessus de 640 px de large, empilés en dessous
- Le panneau « Bibliothèque » est visiblement en retrait — fond creusé, titre en gris, bouton désactivé
- Basculer en sombre avec le toggle de l'en-tête : la hiérarchie entre les deux panneaux reste lisible
- Réduire la fenêtre à 375 px : aucun débordement horizontal

- [ ] **Step 3: Vérifier compilation, lint et tests**

Run: `npm run typecheck; npm run lint; npm run test:run; npm run build`
Expected: aucune erreur

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: page d'accueil"
```

---

## Task 16 : Déploiement et cron de maintien

**Files:**
- Create: `vercel.json`
- Create: `app/api/cron/keepalive/route.ts`
- Modify: `README.md`

**Interfaces:**
- Consomme : `createServiceClient` (Task 14), `env.cronSecret` (Task 14)
- Produit : le site déployé en production ; la route `GET /api/cron/keepalive`

**Pourquoi ce cron dès la Phase 0 alors que le PRD le range en 2.8 :** un projet Supabase gratuit est mis en pause après 7 jours d'inactivité. Sans ce cron, l'environnement se met en pause dès la première semaine calme du développement, et l'équipe perd du temps à comprendre pourquoi tout est cassé. Le nettoyage des données expirées, l'autre moitié de la tâche 2.8, reste en Phase 2 : il n'y a rien à nettoyer avant qu'on puisse créer des clips.

Le plan Hobby n'autorise que 2 crons, à fréquence journalière au maximum. C'est la raison pour laquelle les deux responsabilités partageront à terme un seul appel.

- [ ] **Step 1: Écrire la route de cron**

Créer `app/api/cron/keepalive/route.ts` :

```ts
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Touche la base une fois par jour.
 *
 * Un projet Supabase gratuit est mis en pause après 7 jours sans activité.
 * Cette requête triviale suffit à le maintenir éveillé.
 *
 * En Phase 2, cette même route se chargera aussi de supprimer les clips et
 * salons expirés : le plan Hobby limite à 2 crons journaliers, on regroupe.
 */
export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')
  if (authorization !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, clips: count ?? 0, at: new Date().toISOString() })
}
```

- [ ] **Step 2: Déclarer le cron**

Créer `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/keepalive",
      "schedule": "0 4 * * *"
    }
  ]
}
```

Le plan Hobby n'accepte qu'une exécution par jour et ne garantit pas l'heure exacte : `0 4 * * *` déclenche quelque part dans l'heure de 4 h UTC, ce qui convient parfaitement ici.

- [ ] **Step 3: Vérifier la route en local**

Run: `npm run dev`, puis dans un autre terminal :

```powershell
$secret = (Get-Content .env.local | Select-String '^CRON_SECRET=').ToString().Split('=')[1]
curl.exe -H "Authorization: Bearer $secret" http://localhost:3000/api/cron/keepalive
curl.exe http://localhost:3000/api/cron/keepalive
```

Expected: le premier appel renvoie `{"ok":true,"clips":0,...}`, le second renvoie `{"error":"Non autorisé"}` avec un statut 401.

- [ ] **Step 4: Pousser le dépôt sur GitHub**

```powershell
gh repo create voiced-io --private --source=. --remote=origin --push
```

- [ ] **Step 5: Déployer sur Vercel**

Sur [vercel.com](https://vercel.com) :
1. **Add New → Project**, importer le dépôt `voiced-io`
2. Framework détecté : Next.js. Ne rien modifier aux réglages de build.
3. Ajouter les 4 variables d'environnement pour les trois environnements (Production, Preview, Development) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
4. **Deploy**

- [ ] **Step 6: Vérifier le déploiement en production**

Ouvrir l'URL de production.

Expected :
1. La page d'accueil s'affiche en thème clair
2. Le toggle bascule le site en sombre
3. **Recharger : le site reste en sombre sans le moindre clignotement blanc** — c'est la vérification qui compte le plus, parce qu'en production le rendu serveur et la latence réseau rendent le flash bien plus visible qu'en local
4. `/dev/ui` affiche toutes les primitives correctement dans les deux thèmes
5. Aucune erreur dans la console du navigateur

- [ ] **Step 7: Vérifier le cron en production**

Dans le tableau de bord Vercel, onglet **Cron Jobs**, le cron `keepalive` est listé. Le déclencher manuellement avec **Run**.

Expected: exécution en succès, réponse `{"ok":true,...}` dans les logs.

- [ ] **Step 8: Écrire le README**

Remplacer `README.md` :

```markdown
# voiced.io

Doublez une scène d'anime à deux, en direct, depuis votre navigateur.

Voir [docs/PRD.md](docs/PRD.md) pour la vision produit et le découpage en phases.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev
```

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `npm run test` | Vitest en mode veille |
| `npm run test:run` | Vitest une passe |
| `npm run db:types` | Régénère `types/db.ts` depuis Supabase |
| `npm run check:rls` | Sonde les politiques RLS contre la base réelle |

## Repères

- **`styles/theme.css`** — toutes les couleurs du projet. Aucune valeur hexadécimale ailleurs.
- **`lib/storage/index.ts`** — seul point d'accès aux fichiers. Aucun import direct de `supabase.storage` ailleurs.
- **`/dev/ui`** — vitrine de toutes les primitives d'interface, dans tous leurs états.
- **`supabase/migrations/`** — schéma versionné. Après une migration, relancer `npm run db:types`.

## Après une modification du schéma

```bash
npx supabase db push
npm run db:types
npm run check:rls
```
```

- [ ] **Step 9: Commit et pousser**

```powershell
git add -A
git commit -m "feat: deploiement Vercel, cron de maintien Supabase et README"
git push
```

- [ ] **Step 10: Vérifier que le déploiement automatique fonctionne**

Expected: le push déclenche un déploiement sur Vercel, qui réussit. C'est la boucle de livraison complète, validée de bout en bout.

---

## Fin de Phase 0 — critères d'acceptation

Cocher chaque point avant de passer à la Phase 1 :

- [ ] Le site est en ligne sur une URL Vercel de production
- [ ] Le thème clair est le défaut ; la bascule fonctionne ; **recharger en thème sombre ne produit aucun clignotement blanc**, en local comme en production
- [ ] `/dev/ui` affiche les 9 primitives dans tous leurs états, correctes dans les deux thèmes
- [ ] `npm run test:run` passe — 60 tests sur 6 fichiers (cn 5 · theme 8 · time 19 · id 15 · Dialog 6 · paths 7)
- [ ] `npm run typecheck`, `npm run lint` et `npm run build` passent sans erreur ni avertissement
- [ ] `npm run check:rls` confirme : lecture autorisée partout, écriture refusée partout avec la clé anon
- [ ] Les 7 tables existent, et `rooms`, `players`, `assignments`, `takes` sont dans la publication Realtime
- [ ] Les 3 buckets existent avec leurs limites de taille et de types MIME
- [ ] Le cron `keepalive` est listé dans Vercel et son exécution manuelle réussit
- [ ] `git log --format='%an'` ne fait apparaître que `Tom Fuster`
- [ ] Aucune valeur hexadécimale hors de `styles/theme.css` — vérifier avec : `git grep -nE "#[0-9a-fA-F]{3,8}\b" -- "*.tsx" "*.ts"`
- [ ] Aucune variante `dark:` dans un composant — vérifier avec : `git grep -n "dark:" -- "*.tsx"`

## Ce que la Phase 1 consommera

Récapitulatif des interfaces stables produites par cette phase, pour que le plan de la Phase 1 s'y branche sans avoir à relire le code :

| Module | Exports utilisés en Phase 1 |
|---|---|
| `@/components/ui` | `Badge`, `Button`, `Dialog`, `EmptyState`, `IconButton`, `Input`, `Panel`, `Spinner`, `ThemeToggle`, `Timecode` |
| `@/lib/utils/time` | `formatTimecode`, `formatDuration`, `parseTimecode`, `clamp`, `secondsToMs`, `msToSeconds`, `overlaps`, `type Interval` |
| `@/lib/utils/id` | `generateRoomCode`, `isValidRoomCode`, `normalizeRoomCode` |
| `@/lib/utils/cn` | `cn` |
| `@/lib/storage` | `upload`, `getUrl`, `remove`, `exists`, `clipPath`, `takePath`, `thumbPath`, `extensionFromMime`, `type Bucket` |
| `@/lib/supabase/client` | `createBrowserClient` |
| `@/lib/supabase/server` | `createServiceClient` |
| `@/lib/supabase/types` | `Clip`, `Character`, `Scene`, `Room`, `Player`, `Assignment`, `Take`, `ClipInsert`, `SceneInsert`, `RoomInsert`, `TakeInsert`, `RoomStatus` |
| `@/lib/theme` | `applyTheme`, `readStoredTheme`, `resolveTheme`, `toggleTheme`, `type Theme` |
```
