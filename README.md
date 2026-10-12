# Forex Bot V3.4 — validation chronologique mobile

Usage personnel, simulation exclusivement, budget logiciel 0 €. Application statique GitHub Pages compatible Android et iPad.

## Mise à jour
Dans le dépôt GitHub `forex-bot`, remplacer `index.html`, `engine.js`, `sw.js`, `README.md`. Conserver `manifest.webmanifest` et `icon.svg`. Après publication, recharger la page (si besoin supprimer les données de site Safari pour forcer la mise à jour du service worker).

## Import historique réel
Importer un fichier CSV **EUR/USD H1** de source vérifiable : `time,open,high,low,close`, dates ISO UTC (exemple `2024-01-02T00:00:00Z`), ordre chronologique, minimum 200 lignes. Les données ne sont pas incluses, et aucune cotation en temps réel n'est intégrée.

## Nouveautés
- Découpage chronologique 70/30, 80/20 ou 60/40. Chaque période est simulée indépendamment avec un capital initial de 500 €, sans optimisation de paramètres.
- Contrôle des écarts temporels et rejet des grands trous hors week-end ; ce contrôle reste indicatif (jours fériés, horaires de marché et DST doivent être vérifiés).
- Comparaison des résultats par période, indicateurs existants, journal CSV.

## Limites
Les données OHLC ne permettent pas de reconstruire fidèlement bid/ask, spread variable, frais de financement, exécutions intrabougie ou gaps. La conversion de P&L est une approximation et les coupe-circuits ne garantissent pas les pertes. Les paramètres ne sont pas optimisés, et les performances ne sont pas prouvées. Ne pas utiliser pour trader en réel.
