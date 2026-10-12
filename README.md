# Forex Bot V3.3 — Android / iPad

Prototype gratuit, usage personnel, simulation exclusivement. Aucune API ni ordre réel.

## Mise à jour GitHub Pages
Dans le dépôt `forex-bot`, remplacer `index.html`, `sw.js`, `README.md` et ajouter `engine.js` à la racine. Conserver `manifest.webmanifest`, `icon.svg`, `.nojekyll`. Valider chaque changement avec Commit changes. Ouvrir ensuite l’URL GitHub Pages et actualiser (éventuellement fermer et rouvrir l’application PWA).

## Historique
CSV avec en-tête `time,open,high,low,close`, séparateur virgule ou point-virgule, dates ISO avec UTC explicite (exemple `2024-01-02T10:00:00Z`). Bougies H1 croissantes, >=100 lignes. Les données doivent provenir d'une source documentée ; aucun jeu de prix réel n'est inclus. Le filtre d'espacement autorise certains gaps de weekend et les écarts DST de 2 heures, mais exige une revue manuelle des données.

## Hypothèses et limites
Long uniquement : croisement EMA20/EMA50 sur clôture, entrée à ouverture suivante ; ATR14, stop 2 ATR, objectif 3 ATR ; spread et slippage paramétrables ; risque cible 0,25 % du capital initial ; exposition sans levier ; seuil journalier 5 € et global 15 € ; arrêt définitif pour le backtest après déclenchement. Calcul EUR/USD approximatif via conversion au prix de sortie. Les stops, gaps, coûts et drawdowns intrabougie sont approximés à partir d'OHLC et ne garantissent aucun plafond de perte. Le backtest ne simule ni marge courtier, ni swap, ni commissions distinctes, ni carnet bid/ask. Aucun résultat n'autorise un passage en réel.
