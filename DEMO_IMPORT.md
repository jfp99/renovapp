# Projet de démonstration — RenovApp

Le fichier **`renovapp-demo.json`** contient un projet complet (dortoir d'étudiantes
aux Philippines) qui remplit **les 5 modules** pour tester toutes les fonctionnalités.

## Comment l'importer

1. Lance l'app : `npm install` puis `npm run dev`, et ouvre `http://localhost:3000`.
2. Sur le **Tableau de bord**, en haut à droite, clique sur **« Importer »**.
3. Sélectionne `renovapp-demo.json` (à la racine du dossier RenovApp).
4. Confirme — la page se recharge et tout est rempli.

> Pour repartir de zéro : ouvre la console du navigateur et exécute
> `localStorage.clear()` puis recharge, ou réimporte un fichier vide.

## Ce que contient la démo

| Module | Contenu |
|---|---|
| **Plans** | 9 pièces sur 2 étages (4 dortoirs, 2 SDB, cuisine, salle d'étude, rangement) avec portes & fenêtres |
| **Meubles** | 59 meubles placés (2 lits superposés + 4 casiers + 2 bureaux par dortoir, sanitaires, cuisine équipée) |
| **Blueprints** | 5 plans techniques générés : implantation, électrique, plomberie, menuiserie lit superposé, plan de masse |
| **Inspiration** | 6 références (lit superposé bois, casiers, bureau ergonomique, matelas Uratex, palette, agencement) avec **liens d'achat réels** et prix |
| **Coûts** | 20 dépenses (₱ + EUR + USD), 7 catégories budgétées, statuts prévu/payé/annulé, config ROI |

## Mobilier trouvé en ligne (adapté à un dortoir étudiant économique)

| Article | Prix indicatif | Où |
|---|---|---|
| Lit superposé bois massif (dortoir, 250 kg) | ~₱9 500 | Lazada — Wooden Bed Double Deck |
| Matelas mousse Uratex 90×200, 4 po | ~₱2 200 | uratex.com.ph |
| Casier individuel à serrure | ~₱2 800 | Manila Office Furniture Den |
| Bureau + chaise étudiant (bois) | ~₱2 500 | Lazada — Student Desk with Chair |

## Synthèse calculée (vérifiée par les tests)

- Surface totale planifiée : **~95 m²**
- Total dépensé (hors annulé) : **₱448 480** sur un budget de **₱505 000** (≈ 89 %)
- Revenu net estimé : **₱31 800 / mois** (16 lits, 85 % d'occupation)
- ROI annuel : **79,5 %** → retour sur investissement **~15 mois**

_24 tests d'intégrité passés : liens pièces/catégories/catalogue valides, aucun meuble
hors-limites, aucune collision, conversions de devises correctes, calculs ROI cohérents._
