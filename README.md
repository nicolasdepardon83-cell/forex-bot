# Forex Bot V3.5 — simulation uniquement

Mise à jour de sécurité du moteur, sans optimisation de stratégie.

- Arrêt global sur drawdown de 3 % **depuis le pic de valeur du portefeuille**, et non depuis 500 € seulement.
- Limite journalière de 1 % calculée sur la valeur du portefeuille en début de journée UTC.
- Surveillance des pertes réalisées, de l’ouverture, des extrêmes intrabougie et de la clôture.
- Interdiction de nouvelles entrées après déclenchement d’un coupe-circuit.
- Diagnostic du nombre de sorties forcées.
- Conservation du découpage 70/30, sans modification de la stratégie EMA20/EMA50 et ATR.

**Limites :** un stop ou coupe-circuit ne garantit pas une perte maximale de 3 % en cas de gap, glissement ou liquidité insuffisante. Les OHLC ne permettent pas de connaître l’ordre réel des extrêmes intrabougie. Le modèle conserve la convention stop prioritaire. La séparation chronologique produit des backtests indépendants : leur P&L n’est pas censé s’additionner exactement au P&L global.

## Mise en ligne
Remplacer `index.html`, `engine.js`, `sw.js` et `README.md` à la racine de GitHub Pages. Conserver `manifest.webmanifest` et `icon.svg`. Rafraîchir Safari après publication.

## Vérification
`node tests.js` (tests sans dépendance).
