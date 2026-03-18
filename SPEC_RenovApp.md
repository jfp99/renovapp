# RenovApp — Spécification Technique & Plan de Mise en Œuvre

**Projet** : Application web de gestion de rénovation immobilière & planification de dortoirs étudiants (Philippines)
**Auteur** : Jeff
**Date** : 18 mars 2026
**Usage** : Personnel / Professionnel

---

## 1. Reformulation du Projet

### Contexte

Tu souhaites rénover une maison aux Philippines pour la transformer en maison de location type dortoirs pour étudiants. Pour mener ce projet de A à Z, tu as besoin d'un outil unique qui centralise la planification spatiale, le suivi visuel et le suivi financier.

### Objectif

Créer une **application web (Next.js)** à usage personnel, stockage local, utilisable principalement sur PC. L'application doit être un **hub central** regroupant 5 modules interconnectés :

| Module | Rôle |
|--------|------|
| **Plan Editor** | Dessiner les pièces en 2D avec dimensions, portes, fenêtres |
| **Furniture Planner** | Agencer les meubles (lits, rangements, bureaux) dans les pièces créées |
| **Blueprint Vault** | Stocker et annoter les blueprints/plans techniques avec dimensions |
| **Inspiration Board** | Collecter et organiser des photos/images de référence |
| **Cost Tracker** | Suivre les coûts de rénovation et calculer le ROI locatif |

### Contraintes clés

- **Stockage local uniquement** (localStorage + IndexedDB), pas de backend/cloud
- **Usage PC principal** — interface optimisée pour grand écran
- **Cohérence inter-modules** — les pièces créées dans le Plan Editor sont directement accessibles dans le Furniture Planner
- **Pas de surcharge** — interface simple et pratique, pas un logiciel d'architecte

---

## 2. Recherche — Ce qui existe en Open Source

### 2.1 Éditeur de plans 2D

| Projet | Stack | Stars | État | Pertinence |
|--------|-------|-------|------|------------|
| [react-planner](https://github.com/cvdlab/react-planner) | React, Three.js | ~1.2K | Dernière mise à jour 2024 (forks actifs) | ⭐⭐⭐ Composant React complet pour plans 2D avec catalogue d'objets et vue 3D |
| [Arcada](https://github.com/mehanix/arcada) | React, PixiJS, Zustand, Mantine | ~récent | Actif | ⭐⭐⭐ App complète de design intérieur, la plus proche de notre besoin |
| [react-konva](https://konvajs.org/) | React, Canvas HTML5 | ~6K | Très actif | ⭐⭐⭐ Bibliothèque canvas la plus mature pour React — base idéale pour un éditeur custom |
| [floorplan-canvas](https://github.com/iancometa/floorplan-canvas) | React, Konva | Petit | Démo | ⭐⭐ Simple mais bonne démonstration de l'approche Konva pour les plans |
| [FloorspaceJS](https://nrel.github.io/floorspace.js/) | JavaScript | NREL | Stable | ⭐ Orienté énergie des bâtiments, pas design intérieur |

**Décision recommandée** : Utiliser **react-konva** comme couche de rendu canvas, en s'inspirant de la logique de **react-planner** et **Arcada** pour les interactions (murs, portes, fenêtres). React-konva est activement maintenu, très bien documenté, et offre le meilleur contrôle pour un éditeur sur mesure.

### 2.2 Agencement de meubles

| Projet | Stack | Pertinence |
|--------|-------|------------|
| [react-planner](https://github.com/cvdlab/react-planner) | React | ⭐⭐⭐ Catalogue d'objets drag & drop intégré |
| [room-planner](https://github.com/JasonGoemaat/room-planner) | React | ⭐⭐ Minimaliste mais fonctionnel pour le layout de meubles |
| [Sweet Home 3D](https://www.sweethome3d.com/) | Java | ⭐ Référence en open source mais pas web |

**Décision recommandée** : Intégrer le Furniture Planner comme une **extension du Plan Editor** — même canvas react-konva, avec un catalogue de meubles en sidebar. Les pièces créées dans le module Plan sont automatiquement disponibles ici.

### 2.3 Stockage de blueprints

Aucune solution open-source web spécifique n'existe pour le stockage/annotation de blueprints de construction. Les solutions existantes sont soit des logiciels desktop (LibreCAD, FreeCAD) soit des outils commerciaux (Bluebeam Revu).

**Décision recommandée** : Module custom avec :
- Upload de fichiers (images, PDF)
- Visualiseur avec zoom/pan (via react-konva ou une lib PDF comme react-pdf)
- Annotations de base (texte, flèches, cotations) par-dessus les images
- Tags et catégorisation par pièce/zone

### 2.4 Tableau d'inspiration

| Projet | Stack | Pertinence |
|--------|-------|------------|
| [React-Konva-moodboard](https://github.com/Zlvsky/React-Konva-moodboard) | React, Konva | ⭐⭐⭐ Exactement un moodboard avec drag & drop d'images sur canvas |
| [moodboard](https://github.com/jackielfu/moodboard) | React | ⭐⭐ Simple agrégateur d'images avec disposition automatique |
| [moodboard-react](https://github.com/irisyann/moodboard-react) | React | ⭐ Recherche d'images via API Pexels |

**Décision recommandée** : S'inspirer de **React-Konva-moodboard** pour le canvas libre, avec ajout de catégories/tags liés aux pièces. Utilise la même base react-konva que le Plan Editor, ce qui assure la cohérence technique.

### 2.5 Suivi des coûts & ROI

| Projet | Stack | Pertinence |
|--------|-------|------------|
| [React-Expense-Tracker](https://github.com/HamzaAbouJaib/React-Expense-Tracker-App) | React, TypeScript, Mantine | ⭐⭐ Bonne structure de base pour le suivi de dépenses |
| [react-budget-calculator](https://github.com/tedwu13/react-budget-calculator) | React | ⭐ Calculatrice de budget basique |
| [Remodelum](https://www.remodelum.com/) | Web app | ⭐⭐ Référence commerciale pour le suivi de rénovation (non open source) |

**Décision recommandée** : Module custom avec tableur intégré (basé sur une lib comme **AG Grid** Community ou **TanStack Table**) comprenant :
- Catégories de dépenses (matériaux, main d'œuvre, meubles, permis, etc.)
- Suivi budget prévu vs réel
- Calcul ROI : revenus locatifs mensuels estimés vs coût total de rénovation
- Export CSV

---

## 3. Architecture Technique

### 3.1 Stack Technologique

```
Framework      : Next.js 14+ (App Router, React Server Components)
UI Library     : Tailwind CSS + shadcn/ui (composants accessibles et élégants)
Canvas         : react-konva (rendu 2D pour plans, meubles, annotations)
State          : Zustand (léger, compatible avec persist pour localStorage)
Stockage       : IndexedDB (via idb ou Dexie.js) pour les fichiers/images
                 localStorage (via Zustand persist) pour les données structurées
PDF Viewer     : react-pdf (pour les blueprints PDF)
Tableaux       : TanStack Table v8 (gratuit, headless, très flexible)
Graphiques     : Recharts (pour les visualisations de coûts/ROI)
Icons          : Lucide React
```

### 3.2 Structure du Projet

```
renovapp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Layout principal avec sidebar
│   │   ├── page.tsx                  # Dashboard / vue d'ensemble
│   │   ├── plans/
│   │   │   └── page.tsx              # Plan Editor
│   │   ├── furniture/
│   │   │   └── page.tsx              # Furniture Planner
│   │   ├── blueprints/
│   │   │   └── page.tsx              # Blueprint Vault
│   │   ├── inspiration/
│   │   │   └── page.tsx              # Inspiration Board
│   │   └── costs/
│   │       └── page.tsx              # Cost Tracker
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Navigation principale
│   │   │   └── Header.tsx
│   │   ├── plan-editor/
│   │   │   ├── Canvas.tsx            # Canvas Konva principal
│   │   │   ├── WallTool.tsx          # Outil de dessin de murs
│   │   │   ├── DoorTool.tsx          # Placement de portes
│   │   │   ├── WindowTool.tsx        # Placement de fenêtres
│   │   │   ├── DimensionLabel.tsx    # Affichage des cotations
│   │   │   ├── RoomShape.tsx         # Forme de pièce avec propriétés
│   │   │   └── Toolbar.tsx           # Barre d'outils du plan
│   │   ├── furniture/
│   │   │   ├── FurnitureCanvas.tsx   # Canvas avec pièce + meubles
│   │   │   ├── FurnitureCatalog.tsx  # Catalogue drag & drop
│   │   │   ├── FurnitureItem.tsx     # Élément meuble (redimensionnable, rotatif)
│   │   │   └── RoomSelector.tsx      # Sélecteur de pièce depuis le Plan Editor
│   │   ├── blueprints/
│   │   │   ├── BlueprintViewer.tsx   # Visualiseur avec zoom/pan
│   │   │   ├── AnnotationLayer.tsx   # Couche d'annotations
│   │   │   ├── BlueprintUpload.tsx   # Upload de fichiers
│   │   │   └── BlueprintGrid.tsx     # Grille de tous les blueprints
│   │   ├── inspiration/
│   │   │   ├── MoodBoard.tsx         # Canvas libre type moodboard
│   │   │   ├── ImageUpload.tsx       # Upload d'images
│   │   │   ├── CategoryFilter.tsx    # Filtrage par catégorie/tag
│   │   │   └── ImageCard.tsx         # Carte d'image avec métadonnées
│   │   └── costs/
│   │       ├── CostTable.tsx         # Tableau de suivi des dépenses
│   │       ├── BudgetSummary.tsx     # Résumé budget prévu vs réel
│   │       ├── ROICalculator.tsx     # Calculateur de retour sur investissement
│   │       └── CostChart.tsx         # Graphiques de répartition
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── planStore.ts              # État des plans (pièces, murs, dimensions)
│   │   ├── furnitureStore.ts         # État des meubles placés
│   │   ├── blueprintStore.ts         # Métadonnées des blueprints
│   │   ├── inspirationStore.ts       # Métadonnées des images d'inspiration
│   │   └── costStore.ts             # Données financières
│   │
│   ├── lib/
│   │   ├── db.ts                     # Configuration IndexedDB (Dexie)
│   │   ├── export.ts                 # Export/Import des données (JSON/ZIP)
│   │   ├── calculations.ts           # Fonctions de calcul (surfaces, ROI, etc.)
│   │   └── constants.ts              # Dimensions de meubles standards, etc.
│   │
│   └── types/
│       ├── plan.ts                   # Types pour les plans
│       ├── furniture.ts              # Types pour les meubles
│       ├── blueprint.ts              # Types pour les blueprints
│       ├── inspiration.ts            # Types pour les images
│       └── cost.ts                   # Types pour les coûts
│
├── public/
│   └── furniture-icons/              # Icônes SVG des meubles (vue du dessus)
│
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### 3.3 Modèle de Données

#### Plans & Pièces

```typescript
interface Project {
  id: string;
  name: string;              // "Maison Philippines"
  createdAt: Date;
  updatedAt: Date;
}

interface Floor {
  id: string;
  projectId: string;
  name: string;              // "Rez-de-chaussée", "1er étage"
  order: number;
}

interface Room {
  id: string;
  floorId: string;
  name: string;              // "Dortoir A", "Cuisine", "Salle de bain"
  type: RoomType;            // 'bedroom' | 'bathroom' | 'kitchen' | 'common' | 'storage'
  walls: Wall[];
  color: string;             // Couleur de remplissage sur le plan
}

interface Wall {
  id: string;
  startX: number;            // Coordonnées en cm
  startY: number;
  endX: number;
  endY: number;
  thickness: number;         // Épaisseur en cm (typiquement 15-30)
  openings: Opening[];
}

interface Opening {
  id: string;
  type: 'door' | 'window';
  position: number;          // Position le long du mur (0-1)
  width: number;             // Largeur en cm
  height: number;            // Hauteur en cm
  sillHeight?: number;       // Hauteur d'allège (fenêtres)
}
```

#### Meubles

```typescript
interface FurniturePlacement {
  id: string;
  roomId: string;            // Lien vers la pièce du Plan Editor
  catalogItemId: string;
  x: number;
  y: number;
  rotation: number;          // Degrés
  scaleX: number;
  scaleY: number;
  customLabel?: string;      // "Lit étudiant #3"
}

interface CatalogItem {
  id: string;
  name: string;              // "Lit simple", "Armoire 2 portes"
  category: 'bed' | 'storage' | 'desk' | 'chair' | 'table' | 'bathroom' | 'kitchen';
  defaultWidth: number;      // cm
  defaultHeight: number;     // cm (profondeur vue de dessus)
  icon: string;              // Chemin vers l'icône SVG
  color: string;
}
```

#### Blueprints

```typescript
interface Blueprint {
  id: string;
  name: string;
  description: string;
  fileType: 'image' | 'pdf';
  fileId: string;            // Référence IndexedDB pour le fichier binaire
  thumbnailId: string;       // Référence IndexedDB pour la miniature
  tags: string[];            // ["électricité", "plomberie", "dortoir-A"]
  linkedRoomIds: string[];   // Lien vers les pièces concernées
  annotations: Annotation[];
  createdAt: Date;
}

interface Annotation {
  id: string;
  type: 'text' | 'arrow' | 'dimension' | 'rectangle';
  x: number;
  y: number;
  content: string;           // Texte ou dimension
  color: string;
  // Propriétés spécifiques selon le type
  endX?: number;
  endY?: number;
}
```

#### Inspiration

```typescript
interface InspirationImage {
  id: string;
  fileId: string;            // Référence IndexedDB
  thumbnailId: string;
  tags: string[];            // ["cuisine", "style-moderne", "carrelage"]
  linkedRoomIds: string[];
  note: string;              // Note personnelle
  source?: string;           // URL d'origine si applicable
  createdAt: Date;
}

interface InspirationBoard {
  id: string;
  name: string;              // "Idées Salle de Bain", "Palette Couleurs"
  imageIds: string[];
}
```

#### Coûts & ROI

```typescript
interface CostCategory {
  id: string;
  name: string;              // "Matériaux", "Main d'œuvre", "Meubles"
  color: string;
  budgetAllocation: number;  // Budget prévu en PHP
}

interface CostEntry {
  id: string;
  categoryId: string;
  description: string;       // "Carrelage salle de bain"
  amount: number;            // Montant en PHP
  currency: 'PHP' | 'EUR' | 'USD';
  exchangeRate?: number;     // Taux vers PHP si devise étrangère
  date: string;
  vendor?: string;
  linkedRoomIds: string[];
  receiptFileId?: string;    // Photo du reçu dans IndexedDB
  status: 'planned' | 'paid' | 'cancelled';
}

interface ROIConfig {
  totalRenovationBudget: number;    // PHP
  monthlyRentPerBed: number;        // PHP par lit par mois
  numberOfBeds: number;
  occupancyRate: number;            // 0-1 (ex: 0.85 pour 85%)
  monthlyExpenses: number;          // Charges mensuelles (eau, électricité, etc.)
  propertyPurchasePrice?: number;   // Prix d'achat si applicable
}

// Calcul ROI:
// Revenu mensuel net = (monthlyRentPerBed × numberOfBeds × occupancyRate) - monthlyExpenses
// ROI annuel = (Revenu mensuel net × 12) / totalRenovationBudget × 100
// Retour sur investissement = totalRenovationBudget / (Revenu mensuel net × 12) années
```

---

## 4. Cohérence Inter-Modules

C'est le point le plus critique du projet. Voici comment les modules communiquent :

### 4.1 Le fil conducteur : les Pièces (Rooms)

Les pièces créées dans le **Plan Editor** sont la donnée partagée centrale :

```
Plan Editor  ──crée──>  Room { id, name, type, walls, dimensions }
                              │
                ┌─────────────┼─────────────────┐
                ▼             ▼                  ▼
        Furniture        Blueprint          Cost Tracker
        Planner          Vault
     (agencer les     (lier les plans     (associer les
      meubles dans     techniques à       dépenses par
      chaque pièce)    chaque pièce)      pièce/zone)
                              │
                              ▼
                      Inspiration Board
                      (tagger les images
                       par pièce)
```

### 4.2 Scénarios d'usage concrets

**Scénario 1 — Planifier un dortoir**
1. Dans **Plan Editor** : tu dessines la pièce "Dortoir A" avec ses dimensions (6m × 4m), 2 fenêtres, 1 porte
2. Dans **Furniture Planner** : tu sélectionnes "Dortoir A" et places 4 lits simples, 4 casiers, 2 bureaux. L'app affiche la surface restante disponible
3. Dans **Cost Tracker** : tu ajoutes les coûts liés au "Dortoir A" — peinture, carrelage, lits, casiers

**Scénario 2 — Comparer des inspirations**
1. Dans **Inspiration Board** : tu uploades 5 photos de dortoirs étudiants trouvées en ligne, taggées "dortoir"
2. Tu lies ces images aux pièces "Dortoir A" et "Dortoir B"
3. Depuis le **Furniture Planner**, un bouton "Voir inspirations" affiche les images liées à la pièce courante

**Scénario 3 — Suivre l'avancement**
1. Le **Dashboard** affiche : budget total utilisé (45%), nombre de pièces planifiées (8/12), ROI estimé (18 mois)
2. Tu cliques sur une pièce pour voir son état : plan ✅, meubles ✅, blueprint plomberie ❌, coûts en cours

---

## 5. Plan de Mise en Œuvre — Phases

### Phase 1 : Fondations (Semaine 1-2)

- [ ] Initialiser le projet Next.js + Tailwind + shadcn/ui
- [ ] Mettre en place Zustand stores avec persist (localStorage)
- [ ] Configurer IndexedDB via Dexie.js
- [ ] Créer le layout (sidebar, navigation, header)
- [ ] Créer le Dashboard avec vue d'ensemble vide

### Phase 2 : Plan Editor — Le cœur (Semaine 3-5)

- [ ] Intégrer react-konva avec un canvas redimensionnable
- [ ] Implémenter le dessin de murs (clic-clic ou drag)
- [ ] Ajouter les cotations automatiques (dimensions en cm/m)
- [ ] Implémenter les portes et fenêtres (placement sur les murs)
- [ ] Gestion des pièces (créer, nommer, colorer, supprimer)
- [ ] Gestion des étages
- [ ] Zoom, pan, grille magnétique (snap-to-grid)
- [ ] Sauvegarde/chargement depuis le store

### Phase 3 : Furniture Planner (Semaine 6-7)

- [ ] Créer le catalogue de meubles avec icônes SVG (vue du dessus)
- [ ] Sélecteur de pièce (charge la pièce depuis le Plan Editor)
- [ ] Drag & drop des meubles sur le canvas de la pièce
- [ ] Rotation, redimensionnement, suppression des meubles
- [ ] Détection de collision basique (chevauchement)
- [ ] Affichage surface restante disponible
- [ ] Compteur de meubles par type (utile pour le budget)

### Phase 4 : Blueprint Vault (Semaine 8-9)

- [ ] Upload de fichiers (images + PDF) vers IndexedDB
- [ ] Génération automatique de miniatures
- [ ] Grille de blueprints avec filtres par tags
- [ ] Visualiseur plein écran avec zoom/pan
- [ ] Couche d'annotations (texte, flèches, cotations)
- [ ] Liaison aux pièces

### Phase 5 : Inspiration Board (Semaine 9-10)

- [ ] Upload d'images vers IndexedDB
- [ ] Grille masonry avec filtres par tags
- [ ] Vue moodboard (canvas libre, positionnement drag & drop)
- [ ] Tags et liaison aux pièces
- [ ] Notes sur chaque image

### Phase 6 : Cost Tracker (Semaine 11-12)

- [ ] Tableau de dépenses avec TanStack Table (tri, filtre, recherche)
- [ ] Catégories de dépenses avec budgets
- [ ] Formulaire d'ajout/édition de dépenses
- [ ] Calcul automatique budget prévu vs réel
- [ ] Calculateur ROI avec paramètres configurables
- [ ] Graphiques (camembert par catégorie, barres budget vs réel, courbe ROI)
- [ ] Export CSV

### Phase 7 : Intégration & Polish (Semaine 13-14)

- [ ] Dashboard avec métriques globales
- [ ] Liens croisés entre modules (depuis une pièce, voir tous les éléments liés)
- [ ] Export/Import complet du projet (ZIP avec JSON + fichiers binaires)
- [ ] Responsive design vérification
- [ ] Tests manuels de tous les scénarios

---

## 6. Dépendances NPM Prévues

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-konva": "^18.2.0",
    "konva": "^9.0.0",
    "zustand": "^4.5.0",
    "dexie": "^4.0.0",
    "dexie-react-hooks": "^1.1.0",
    "@tanstack/react-table": "^8.0.0",
    "recharts": "^2.12.0",
    "react-pdf": "^7.0.0",
    "lucide-react": "^0.400.0",
    "react-dropzone": "^14.0.0",
    "uuid": "^9.0.0",
    "jszip": "^3.10.0",
    "file-saver": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "@types/react": "^18.0.0",
    "@types/uuid": "^9.0.0"
  }
}
```

**Justification de chaque choix :**

- **react-konva / konva** : Rendu canvas 2D performant, API React native, utilisé pour le Plan Editor, le Furniture Planner, les annotations Blueprint, et le moodboard Inspiration. C'est le ciment technique de l'app.
- **zustand** : State management minimal, parfait pour une app sans serveur. Le middleware `persist` sauvegarde directement dans localStorage.
- **dexie** : Wrapper IndexedDB avec une API type Promise, nécessaire pour stocker les fichiers binaires (images, PDF) qui sont trop lourds pour localStorage.
- **@tanstack/react-table** : Tableur headless, gratuit, extrêmement flexible pour le Cost Tracker.
- **recharts** : Graphiques React simples et élégants pour les visualisations de coûts.
- **react-pdf** : Rendu PDF dans le navigateur pour les blueprints PDF.
- **react-dropzone** : Gestion propre du drag & drop de fichiers pour les uploads.
- **jszip + file-saver** : Export/import du projet complet en ZIP.

---

## 7. Points d'Attention & Risques

### Ce que cette app N'EST PAS

- Ce n'est pas un logiciel d'architecture (pas de calcul structurel, pas de BIM)
- Ce n'est pas un outil de modélisation 3D (on reste en 2D vue du dessus)
- Ce n'est pas un outil collaboratif (usage personnel uniquement)

### Risques techniques identifiés

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Performance canvas avec beaucoup d'objets** | Lenteur si >100 meubles/annotations | Utiliser les layers Konva, virtualisation des objets hors écran |
| **Taille IndexedDB** | Limites navigateur (~50-100 MB selon le navigateur) | Compresser les images à l'upload, avertir l'utilisateur si >80% |
| **Complexité du dessin de murs** | Les intersections de murs et les pièces fermées sont algorithmiquement complexes | Commencer simple (rectangles), ajouter les formes libres en v2 |
| **Perte de données (local only)** | Pas de backup automatique | Export ZIP régulier, rappel dans l'UI |

### Simplifications recommandées pour la v1

1. **Pièces rectangulaires uniquement** en v1 (formes en L ou complexes en v2)
2. **Pas de vue 3D** — rester en vue du dessus 2D
3. **Catalogue de meubles limité** — 15-20 types de meubles essentiels pour un dortoir
4. **Devise principale en PHP** — conversion optionnelle EUR/USD avec taux manuel
5. **Pas de PWA/offline** — simple app web, le stockage local fait déjà office d'offline

---

## 8. Prochaines Étapes

Pour démarrer le développement, l'ordre recommandé est :

1. **Initialiser le projet** (Next.js, Tailwind, shadcn/ui, stores Zustand)
2. **Construire le Plan Editor** en premier — c'est le module le plus complexe et le fondement de tous les autres
3. **Ajouter le Furniture Planner** — réutilise le canvas et les données du Plan Editor
4. **Implémenter le Cost Tracker** — indépendant techniquement, haute valeur d'usage immédiate
5. **Ajouter Blueprint Vault et Inspiration Board** — modules de stockage plus simples

Dis-moi quand tu veux démarrer le code — on attaquera par la Phase 1 (fondations) et Phase 2 (Plan Editor).
