# Icônes Tauri — MASOMO

Ce dossier doit contenir les icônes utilisées par Tauri pour générer les
binaires natifs (`.msi`, `.dmg`, `.deb`, `.AppImage`, etc.).

## Fichiers requis

Avant de lancer `bun run tauri:build`, copiez (ou symlink) les icônes suivantes
depuis `../../public/icons/` vers ce dossier :

| Fichier requis         | Source dans `public/icons/`        | Usage                                    |
| ---------------------- | ---------------------------------- | ---------------------------------------- |
| `icon.ico`             | (à générer via `tauri icon`)       | Icône Windows (.exe / .msi)              |
| `icon.png`             | `icon-512x512.png`                 | Icône principale (512×512)               |
| `128x128.png`          | `icon-128x128.png`                 | Icône Linux 128×128                      |
| `32x32.png`            | `favicon-32x32.png`                | Icône Linux 32×32                        |

> **Note** : `bun run scripts/generate-icons.mjs` a déjà produit la plupart de
> ces fichiers dans `public/icons/`. Le fichier `icon.ico` (format Windows)
> n'est pas généré par ce script — utilisez la commande Tauri pour le produire :
>
> ```bash
> bunx @tauri-apps/cli icon ../../public/icons/icon-512x512.png \
>   --output ./icons
> ```
>
> Cette commande génère automatiquement toutes les tailles requises par Tauri
> (`icon.ico`, `icon.png`, `128x128.png`, `32x32.png`, etc.) dans ce dossier.

## Référence dans `tauri.conf.json`

Le fichier `../tauri.conf.json` référence les icônes via :

```json
"bundle": {
  "icon": [
    "icons/icon-512x512.png",
    "icons/icon-192x192.png"
  ]
}
```

Copiez donc également `icon-512x512.png` et `icon-192x192.png` ici, ou ajustez
les chemins dans `tauri.conf.json` pour pointer vers `../../public/icons/`.

## Commande rapide (copie)

```bash
# Depuis le dossier src-tauri/
cp ../../public/icons/icon-512x512.png  icons/icon-512x512.png
cp ../../public/icons/icon-192x192.png  icons/icon-192x192.png
cp ../../public/icons/icon-128x128.png  icons/128x128.png
cp ../../public/icons/favicon-32x32.png icons/32x32.png

# Génère icon.ico + toutes les tailles manquantes :
bunx @tauri-apps/cli icon ../../public/icons/icon-512x512.png --output ./icons
```
