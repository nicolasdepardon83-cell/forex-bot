# Forex Bot V3.1 — application mobile autonome (simulation)

**Coût logiciel : 0 €**. Aucun compte, aucune API, aucun courtier et aucun ordre réel.

## Accès Android / iPad depuis une URL HTTPS gratuite

GitHub Pages est une possibilité gratuite **si vous acceptez un dépôt public**. Le code et les fichiers publiés seront accessibles à tous : ne publiez jamais de données personnelles, mots de passe, clés API ou historiques privés.

1. Créer un compte GitHub gratuit si nécessaire.
2. Créer un nouveau dépôt **public** (ex. `forex-sim-mobile`).
3. Ajouter à la racine du dépôt les fichiers `index.html`, `manifest.webmanifest`, `sw.js`, `icon.svg`, `.nojekyll`.
4. Ouvrir **Settings > Pages > Build and deployment > Deploy from a branch**, choisir `main` et `/ (root)`, puis enregistrer.
5. Une fois la publication terminée, ouvrir l'URL affichée par GitHub Pages sur Android et iPad.
6. Chrome Android : menu > Ajouter à l'écran d'accueil / Installer. Safari iPad : Partager > Sur l'écran d'accueil.

**Important :** ce ZIP n'est pas déjà hébergé. La publication nécessite une action dans votre compte GitHub. Sans hébergement, le HTML local peut ne pas fonctionner dans Safari.

## Import des données

CSV en ordre chronologique, 100 lignes minimum, colonnes exactes `time,open,high,low,close` et valeurs EUR/USD positives. Date ISO 8601 recommandée, par exemple `2025-01-02T09:00:00Z`. Vérifier la source, le fuseau horaire, les bougies manquantes et les conditions de licence.

Les sources publiques comme Dukascopy peuvent fournir des historiques Forex, mais la disponibilité et les conditions de téléchargement doivent être vérifiées directement. Aucun téléchargement automatique n'est inclus.

## Limites et précautions

- La démonstration utilise des cours **fictifs**.
- Modèle long-only EMA20/EMA50, ATR14, stops simulés. Il ne prouve aucune rentabilité.
- Le spread, le slippage et les exécutions bid/ask sont simplifiés. Les gaps peuvent dépasser les limites de perte.
- Les seuils 1 % / jour et 3 % global ne sont pas des garanties.
- Le cache hors ligne est disponible **après** la première visite HTTPS et ne synchronise pas les résultats entre appareils.
- L'application ne tourne pas 24/7 lorsque Safari/Chrome est fermé. Un moteur Python Android/PC séparé serait nécessaire pour la surveillance continue.
- Aucun backtest indépendant complet n'a été réalisé. Ne pas utiliser pour trading réel.
