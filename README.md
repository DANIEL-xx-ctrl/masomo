# EduGest — Gestion Scolaire Complète

Application Next.js 16 de gestion d'établissements scolaires : élèves, enseignants,
classes, notes, bulletins, présences, paiements, devoirs, communication, emploi du
temps, calendrier scolaire et administration multi-établissements.

## 📦 Contenu de cette archive

```
EduGest/
├── src/                     Code source (app, components, lib, hooks)
│   ├── app/                 Routes App Router (pages + API routes)
│   ├── components/          Composants React + shadcn/ui
│   ├── hooks/               Hooks React personnalisés
│   └── lib/                 Utilitaires (db, auth, types, permissions…)
├── prisma/                  Schéma Prisma + script seed
│   ├── schema.prisma        Modèle de données complet
│   └── seed.ts              Script de remplissage initial
├── public/                  Assets statiques (logo, avatars, fonts…)
├── db/                      (vide — la base est créée automatiquement)
├── upload/                  Dossier des uploads utilisateur
├── scripts/                 Scripts utilitaires
├── package.json             Dépendances + scripts npm
├── tsconfig.json            Configuration TypeScript
├── next.config.ts           Configuration Next.js
├── tailwind.config.ts       Configuration Tailwind CSS
├── postcss.config.mjs       Configuration PostCSS
├── eslint.config.mjs        Configuration ESLint
├── components.json          Configuration shadcn/ui
├── .env                     Variables d'environnement (DATABASE_URL)
├── .env.example             Modèle de variables d'environnement
└── .gitignore
```

## 🚀 Installation dans VSCode

### 1. Extraire l'archive
- Dans VSCode : `File → Open Folder…` puis sélectionnez le dossier `EduGest` extrait.
- Ou en ligne de commande :
  ```bash
  unzip EduGest_Source_Complet.zip
  cd EduGest
  code .
  ```

### 2. Installer les dépendances
Prérequis : [Node.js 20+](https://nodejs.org/) et [Bun](https://bun.sh) (recommandé).

```bash
# Avec Bun (recommandé — plus rapide)
bun install

# OU avec npm
npm install

# OU avec pnpm
pnpm install
```

### 3. Démarrer l'application
```bash
bun run dev
# ou : npm run dev
```

> ℹ️ **Le premier `bun run dev` est automatique :** le script `predev` s'exécute
> avant `next dev` et effectue trois actions :
> 1. `prisma generate` — génère le client Prisma
> 2. `prisma db push` — crée la base SQLite `db/custom.db` à partir du schéma
> 3. `bun run db:seed` — remplit la base avec les données de démonstration
>    (3 établissements, ~70 utilisateurs, ~48 élèves, ~13 enseignants, classes,
>    notes, paiements, annonces, etc.)
>
> Aucune base de données n'est livrée dans le ZIP : elle est **créée à partir de
> zéro** à chaque première exécution, ce qui élimine tout risque de corruption.

### 4. Ouvrir l'application
L'application démarre sur [http://localhost:3000](http://localhost:3000).

## 🔐 Comptes de démonstration

Une fois le seed terminé, utilisez ces identifiants sur la page de connexion :

| Rôle               | Identifiant              | Mot de passe |
|--------------------|--------------------------|--------------|
| Super-admin        | `superadmin`             | `admin123`   |
| Admin Établissement| `admin@polytech.cm`      | `admin123`   |
| Enseignant         | `teacher@polytech.cm`    | `teacher123` |
| Parent             | `parent@polytech.cm`     | `parent123`  |

> Les 3 établissements de démo sont : **Polytech**, **MASOMO Academy**,
> **Institut Yaoundé**. Sélectionnez l'établissement dans le menu déroulant.

## 🛠️ Scripts disponibles

| Script             | Description                                           |
|--------------------|-------------------------------------------------------|
| `bun run dev`      | Démarre le serveur de développement (avec predev)     |
| `bun run build`    | Build de production                                    |
| `bun run start`    | Démarre le serveur de production                       |
| `bun run lint`     | Vérifie la qualité du code avec ESLint                 |
| `bun run db:push`  | Synchronise le schéma Prisma avec la base              |
| `bun run db:seed`  | Remplit la base avec les données de démonstration      |
| `bun run db:reset` | Réinitialise complètement la base de données           |

## 🗄️ Base de données

- **Type** : SQLite (fichier local `db/custom.db`)
- **ORM** : Prisma 6
- **Schéma** : `prisma/schema.prisma`
- **Seed** : `prisma/seed.ts` (appelle `POST` de `src/app/api/seed/route.ts`)

### Recréer la base de zéro
Si la base est corrompue ou pour repartir proprement :
```bash
rm -f db/custom.db db/custom.db-wal db/custom.db-shm
bun run db:push
bun run db:seed
```

## ✨ Fonctionnalités principales

### Gestion des établissements
- Multi-établissements avec super-admin
- Bascule entre établissements
- Avatars et identité visuelle personnalisés

### Scolarité
- **Élèves** : inscription, statuts (actif / abandonné / migré / décédé),
  recherche, filtres, export PDF/Excel
- **Enseignants** : recrutement, statuts, date d'embauche, spécialités
- **Classes** : création, affectation enseignant principal, effectifs
- **Notes & Bulletins** : saisie, calcul automatique, export PDF/Excel,
  proclamation des résultats
- **Présences** : saisie par jour, calendrier, export
- **Emploi du temps** : création par glisser-déposer, gestion des salles

### Communication
- **Annonces** : publication par établissement, accusés de lecture
- **Messages** : communication interne
- **Notifications** : génération automatique, marquage comme lu
- **Devoirs** : assignation, soumission en ligne, suivi

### Administration
- **Paiements** : suivi, reçus PDF, statistiques
- **Calendrier scolaire** : événements, vacances, jours fériés
- **Paramètres** : configuration établissement, années scolaires
- **Tableau de bord** : statistiques, cas particuliers (élèves/enseignants
  non actifs avec raisons)

### Interface
- Design responsive (mobile, tablette, desktop)
- Mode sombre / clair
- PWA installable
- Composants shadcn/ui + Tailwind CSS 4

## 🎨 Cas particuliers (système de statuts)

Le système de statuts permet de suivre les élèves et enseignants ayant quitté
l'établissement sans pour autant les supprimer :

| Statut      | Signification                                  |
|-------------|------------------------------------------------|
| `active`    | Élève/enseignant actuellement dans l'établissement |
| `abandoned` | A abandonné (élève) / démissionnaire (enseignant)  |
| `migrated`  | A transféré vers un autre établissement            |
| `deceased`  | Décédé                                             |

Le tableau de bord affiche ces cas dans une section dédiée « Suivi des cas
particuliers » avec le nom, la classe et la raison.

## 🐛 Dépannage

### "database disk image is malformed"
La base n'est jamais livrée — elle est recréée par `predev`. Si l'erreur persiste :
```bash
rm -f db/custom.db db/custom.db-wal db/custom.db-shm
bun run dev   # predev recrée la base proprement
```

### "column X does not exist"
Le schéma a été mis à jour mais la base est ancienne :
```bash
bun run db:push --accept-data-loss
```

### Le port 3000 est déjà utilisé
Modifiez la commande : `bun run next dev -- -p 3001`

### Erreur Prisma lors de l'install
```bash
bun run db:generate   # régénère le client Prisma
```

## 📚 Stack technique

| Domaine        | Technologie                            |
|----------------|----------------------------------------|
| Framework      | Next.js 16 (App Router)                |
| Langage        | TypeScript 5                           |
| Runtime        | React 19                               |
| Style          | Tailwind CSS 4 + shadcn/ui (New York)  |
| Base de données| Prisma 6 + SQLite                      |
| État           | Zustand + TanStack Query               |
| Formulaires    | React Hook Form + Zod                  |
| Auth           | NextAuth.js v4                         |
| PDF            | jsPDF + jspdf-autotable                |
| Excel          | SheetJS (xlsx)                         |
| Animations     | Framer Motion                          |
| Icônes         | Lucide React                           |

## 📄 Licence
Projet privé — usage éducatif.

---
Généré automatiquement. Pour toute question, consultez le code source
documenté dans `src/`.
