# Faire rouler SVG Converter en local

## Prérequis

- Node.js 22.12 ou une version plus récente
- npm, inclus avec Node.js

Pour vérifier les versions installées :

```sh
node --version
npm --version
```

## 1. Ouvrir le projet

Dans un terminal, aller dans le dossier de l’application :

```sh
cd svg-converter
```

## 2. Installer les dépendances

```sh
npm install
```

Cette commande installe Vue 3, Vite, Pinia, SASS et JSZip.

## 3. Démarrer l’application

```sh
npm run dev
```

Vite affichera une adresse locale, normalement :

```text
http://localhost:5173/
```

Ouvrir cette adresse dans un navigateur. Si le port 5173 est déjà utilisé, Vite choisira automatiquement un autre port et l’indiquera dans le terminal.

## 4. Utiliser SVG Converter

1. Glisser un ou plusieurs fichiers `.svg` dans la zone de dépôt, ou sélectionner un fichier `.zip` contenant des SVG.
2. Attendre la fin de la barre de progression.
3. Ajuster la couleur des logos dans la zone de prévisualisation.
4. Télécharger un SVG individuellement ou utiliser **Download all** pour récupérer une archive ZIP.

La conversion standard s’effectue localement dans le navigateur. Les fichiers ne sont pas envoyés vers un serveur dans cette première version.

## Vérifier le projet

Lancer les tests :

```sh
npm test
```

Créer une version optimisée pour la production :

```sh
npm run build
```

Le résultat sera généré dans le dossier `dist`.

Prévisualiser cette version de production :

```sh
npm run preview
```

## Arrêter le serveur local

Dans le terminal où l’application fonctionne, appuyer sur :

```text
Ctrl + C
```

## Problèmes fréquents

### La commande `npm` est introuvable

Installer une version récente de Node.js, puis fermer et rouvrir le terminal.

### Vite indique que la version de Node.js est trop ancienne

Mettre Node.js à jour vers la version 22.12 ou une version plus récente, puis relancer `npm install`.

### Le port 5173 est déjà utilisé

Utiliser l’autre adresse affichée par Vite, par exemple `http://localhost:5174/`.

### Réinitialiser l’installation

Supprimer le dossier `node_modules`, puis réinstaller les dépendances :

```sh
npm install
```
