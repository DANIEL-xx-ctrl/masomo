import { defineConfig } from "prisma/config";

/**
 * Configuration Prisma (format moderne — remplace la section dépréciée
 * `package.json#prisma`).
 *
 * Prisma 6.14+ recommande d'utiliser un fichier `prisma.config.ts` à la racine
 * du projet plutôt que la propriété `prisma` dans `package.json` (qui sera
 * supprimée dans Prisma 7).
 *
 * Prisma charge automatiquement les variables d'environnement depuis `.env`,
 * donc il n'est **pas nécessaire** d'importer `dotenv/config`.
 */
export default defineConfig({
  // Chemin vers le schéma Prisma
  schema: "prisma/schema.prisma",

  migrations: {
    // Dossier où stocker les migrations
    path: "prisma/migrations",
    // Commande exécutée pour seed la base après les migrations
    seed: "bun run prisma/seed.ts",
  },
});
