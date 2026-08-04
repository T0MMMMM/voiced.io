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
| `npm run check:rls` | Sonde les politiques de sécurité contre la base réelle |

## Repères

- **`styles/theme.css`** : toutes les couleurs du projet. Aucune valeur hexadécimale ailleurs, aucune variante `dark:` dans un composant : le thème sombre ne fait que redéfinir des variables CSS.
- **`lib/storage/index.ts`** : seul point d'accès aux fichiers. Aucun import direct de `supabase.storage` ailleurs, ce qui permettra de migrer vers Cloudflare R2 en réécrivant ce seul fichier.
- **`/dev/ui`** : vitrine de toutes les primitives d'interface, dans tous leurs états. Sert de vérification visuelle à chaque ajout de composant.
- **`supabase/migrations/`** : schéma versionné.

## Modèle de sécurité

Il n'y a pas de comptes utilisateurs avant la Phase 3. La clé publique peut **lire** toutes les tables : c'est indispensable, sinon la synchronisation temps réel entre les deux joueurs ne reçoit rien, mais ne peut **rien écrire**. Toutes les écritures passent par des server actions utilisant la clé secrète, qui contourne RLS et applique les règles métier en TypeScript.

Limite assumée : deviner un identifiant permet de lire une partie. Acceptable pour un jeu entre amis, sans donnée personnelle, avec des salons qui expirent en 24 h.

`npm run check:rls` vérifie ce modèle contre la vraie base : il sème une ligne avec la clé secrète, tente de l'écraser avec la clé publique, et échoue si l'écriture aboutit.

## Après une modification du schéma

Les migrations s'appliquent via l'API de gestion Supabase (le CLI `db push` exige le mot de passe de la base, que le projet ne stocke pas).

```bash
npm run db:types    # régénère les types
npm run check:rls   # revérifie les politiques
```
