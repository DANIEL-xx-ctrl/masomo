# MASOMO - Workflow avec auto-fix frontendDist (v8)

## 🎯 PROBLÈME

Erreur Windows : `Unable to find your web assets... frontendDist is set to "../src-tauri/resources/placeholder"`

## 🔍 CAUSE

Sur GitHub, `src-tauri/tauri.conf.json` a ENCORE l'ancien chemin `"../src-tauri/resources/placeholder"`. Le workflow précédent ne le corrigeait pas automatiquement.

## ✅ SOLUTION

Ce workflow contient une nouvelle étape **"FORCE fix frontendDist"** qui :
1. Lit `src-tauri/tauri.conf.json`
2. Remplace AUTOMATIQUEMENT n'importe quelle valeur de `frontendDist` par `"resources/placeholder"` (le bon chemin)
3. Crée `placeholder/index.html` s'il manque

**Avantage** : Même si votre `tauri.conf.json` local a le mauvais chemin, le workflow le corrigera sur GitHub Actions avant le build.

---

## 📦 CONTENU DU ZIP

```
masomo-force-fix/
├── README.md
└── .github/workflows/
    └── build-native.yml     ← Workflow avec auto-fix
```

---

## 🚀 INSTALLATION

### Étape 1 — Extrayez le ZIP à la racine de votre projet

Le fichier `.github/workflows/build-native.yml` est remplacé.

### Étape 2 — Commandes Git (PowerShell)

```powershell
git add -A
```

```powershell
git commit -m "fix: workflow auto-corrige frontendDist avant le build Tauri"
```

```powershell
git push origin main --force
```

### Étape 3 — Relancez le workflow

1. GitHub → votre dépôt → Actions
2. "Build Native Apps" → "Run workflow"
3. server_url : `http://localhost:3000`
4. build_type : `release`
5. Run workflow

---

## 🔧 CE QUE FAIT LA NOUVELLE ÉTAPE

Avant le build Tauri, le workflow exécute :

```bash
sed -i 's|"frontendDist": *"[^"]*"|"frontendDist": "resources/placeholder"|' src-tauri/tauri.conf.json
```

Cette commande :
- Cherche la ligne `"frontendDist": "..."`
- Remplace la valeur par `"resources/placeholder"` (le bon chemin relatif à `src-tauri/`)
- Crée aussi `placeholder/index.html` s'il n'existe pas

**Résultat** : le build Tauri trouvera toujours les web assets, peu importe ce qu'il y a dans `tauri.conf.json` au départ.

---

## ✅ RÉSULTAT ATTENDU

Tous les jobs VERTS :
- Desktop (Windows) 🟢
- Desktop (macOS) 🟢
- Desktop (Linux) 🟢
- Android 🟢
- iOS 🟢
