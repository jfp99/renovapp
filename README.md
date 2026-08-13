# RenovApp

Pilotage du projet de dortoir étudiant : plans, aménagement, dépenses, rentabilité et location.

## Lancer l'application

Une seule fois, depuis ce dossier :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\Install-Desktop-Shortcut.ps1
```

Une icône **RenovApp** apparaît sur le Bureau. Double-clic : l'app s'ouvre dans sa propre fenêtre.
Le premier lancement installe les dépendances et construit l'app ; les suivants sont immédiats.

Pour forcer une reconstruction après avoir modifié le code, supprimez le dossier `out/`.

En développement : `npm run dev` puis http://localhost:3000

## Les modules

| Module | À quoi il sert |
|---|---|
| **Plans** | Dessiner les pièces à l'échelle, avec portes et fenêtres |
| **Meubles** | Placer lits, lockers et mobilier. **Les lits placés ici définissent la capacité** |
| **Blueprints** | Stocker les plans techniques et les annoter |
| **Inspiration** | Moodboard de références |
| **Coûts & ROI** | Dépenses, budget, rentabilité et projection pluriannuelle |
| **Location** | Occupation réelle par lit, contrats, loyers et retards |

### Le fil conducteur

Les lits dessinés dans **Meubles** deviennent des places louables dans **Location**, et alimentent
la capacité du modèle de **ROI**. Un lit superposé compte pour deux places. C'est ce qui empêche le
business plan de reposer sur un nombre de lits que le plan ne contient pas.

De même, chaque dépense enregistrée met à jour le ROI *réel*, affiché à côté du ROI *prévu*.

## Où sont mes données

Tout reste sur cette machine, rien n'est envoyé sur Internet.

- **Textes et chiffres** (pièces, dépenses, contrats) : `localStorage` du navigateur.
- **Images et PDF** (blueprints, inspirations, reçus) : IndexedDB, qui accepte des centaines de Mo.

Un bandeau rouge apparaît si une écriture échoue — dans ce cas, sauvegardez immédiatement.

### Sauvegarder

Le bouton **Sauvegarder** du tableau de bord exporte tout le projet, médias compris, dans un seul
fichier JSON. **Importer** restaure cette sauvegarde. Faites-le régulièrement : vider le cache du
navigateur efface les données textuelles.

## Commandes

```bash
npm run dev        # développement
npm run build      # export statique dans out/
npm run test       # tests unitaires (moteur financier, récurrences, location)
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

`python3 scripts/generate-icons.py` régénère les icônes après un changement de couleurs.

## Comprendre le modèle de ROI

L'onglet **Projection** calcule une trésorerie mois par mois plutôt qu'un ratio figé. Il tient
compte de :

- la **saisonnalité** de l'année scolaire philippine (creux en juin–juillet) ;
- la **montée en charge** : un dortoir n'ouvre pas plein ;
- les **impayés**, l'indexation des loyers et l'inflation des charges ;
- l'**électricité par lit occupé**, poste décisif pour la marge ;
- la **provision de renouvellement** (matelas, ventilateurs) et les aléas de chantier.

Il en sort la VAN, le TRI, le délai de retour, le point mort en lits et la **trésorerie minimale**
— le creux à financer avant les premiers loyers. Une alerte se déclenche si le retour sur
investissement dépasse la durée du bail principal : dans ce cas le projet n'est pas finançable en
l'état.

Le **tornado de sensibilité** classe les hypothèses par impact réel sur la VAN, ce qui indique où
négocier en priorité.

## Structure

```
src/
  app/          pages (une par module)
  components/   composants, groupés par module
  stores/       état Zustand persisté, un store par domaine
  lib/          logique métier pure — c'est ici que vivent les calculs testés
  types/        modèles de données
scripts/        serveur local, raccourci bureau, générateur d'icônes
public/         manifest PWA, service worker, icônes
```

La logique financière est isolée dans `src/lib/` (`roiEngine`, `recurrence`, `tenancy`) sans aucune
dépendance à React : c'est ce qui la rend testable, et elle l'est.

## Notes

- Les chiffres fiscaux et réglementaires doivent être validés par un comptable local.
- `SPEC_RenovApp.md` documente l'architecture d'origine et reste la référence de conception.
