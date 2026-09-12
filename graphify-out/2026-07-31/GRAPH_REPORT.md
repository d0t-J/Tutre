# Graph Report - /home/m-tauseef/Desktop/Co-Tutor  (2026-07-30)

## Corpus Check
- 168 files · ~104,810 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 464 nodes · 898 edges · 28 communities (22 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Student Auth Routing
- Admin Simulation Wizard
- Admin App Shell
- Student Runtime Dependencies
- Admin Curriculum Data
- Admin Curriculum UI
- Admin Build Config
- Student Build Config
- Student Simulation Viewer
- Admin Runtime Dependencies
- Admin Loading UI
- Student Landing Page
- Admin Live Preview
- Student Auth Forms
- Panel Entry Points
- Admin Database Check
- Admin SPA Rewrites
- Cardiac Cycle Simulation
- Fluid Mosaic Simulation
- Pendulum Motion Simulation
- Student SPA Rewrites

## God Nodes (most connected - your core abstractions)
1. `useSimulation()` - 33 edges
2. `useWizard()` - 17 edges
3. `useAuth()` - 17 edges
4. `useCurriculumCrud()` - 15 edges
5. `slugify()` - 15 edges
6. `useAuth()` - 13 edges
7. `supabase` - 13 edges
8. `supabase` - 11 edges
9. `useSimulationViewer()` - 11 edges
10. `SimulationProvider()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Co-Tutor Admin Application` --conceptually_related_to--> `Co-Tutor Student Application`  [INFERRED]
  admin-panel/index.html → student-panel/index.html
- `/src/main.jsx React Entry Point` --conceptually_related_to--> `/src/main.jsx React Entry Point (Student)`  [INFERRED]
  admin-panel/index.html → student-panel/index.html
- `SavedSimulationsPage()` --calls--> `useSimulation()`  [EXTRACTED]
  admin-panel/src/pages/Simulations/SavedSimulationsPage.jsx → admin-panel/src/features/simulations/context/SimulationContext.jsx
- `CreateSimulation()` --calls--> `useWizard()`  [EXTRACTED]
  admin-panel/src/pages/Simulations/CreateSimulation.jsx → admin-panel/src/features/simulations/context/WizardContext.jsx
- `Header()` --calls--> `useAuth()`  [EXTRACTED]
  admin-panel/src/components/layout/Header.jsx → admin-panel/src/context/AuthContext.jsx

## Import Cycles
- None detected.

## Communities (28 total, 6 thin omitted)

### Community 0 - "Student Auth Routing"
Cohesion: 0.09
Nodes (32): App(), DotField, EmptyState(), PageSkeleton(), LogoutConfirmationModal(), MobileDropdown(), Layout(), TopNavbar() (+24 more)

### Community 1 - "Admin Simulation Wizard"
Cohesion: 0.09
Nodes (30): CustomDropdown(), ChapterSelector(), ClassSelector(), LivePreview(), COLORS, SubjectSelector(), GenerateActions(), ImageUploader() (+22 more)

### Community 2 - "Admin App Shell"
Cohesion: 0.09
Nodes (26): App(), LogoutConfirmationModal(), Header(), MobileMenu(), NavLinks(), AuthContext, AuthProvider(), PromptEditor() (+18 more)

### Community 3 - "Student Runtime Dependencies"
Cohesion: 0.06
Nodes (35): file-saver, html2canvas, markdown-docx, marked, react-markdown, react-to-print, slugify, dependencies (+27 more)

### Community 4 - "Admin Curriculum Data"
Cohesion: 0.15
Nodes (21): FilterDropdown(), COLORS, FilterDropdownMenu(), useAuth(), SavedSimulations(), SimulationsFilterBar(), useChapters(), useCreateChapter() (+13 more)

### Community 5 - "Admin Curriculum UI"
Cohesion: 0.12
Nodes (15): ConfirmationModal(), CurriculumSkeleton(), CategoryCard(), formatDate(), CategoryEmptyState(), CategoryForm(), CategoryList(), CategoryModal() (+7 more)

### Community 6 - "Admin Build Config"
Cohesion: 0.07
Nodes (28): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/react, @types/react-dom (+20 more)

### Community 7 - "Student Build Config"
Cohesion: 0.07
Nodes (28): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/react, @types/react-dom (+20 more)

### Community 8 - "Student Simulation Viewer"
Cohesion: 0.16
Nodes (16): Chatbot(), ChatMessage(), StudyGuidePrintView, SimulationViewerContext, SimulationViewerProvider(), useSimulationViewer(), useFetchSimulation(), useStudyGuideDocxGenerator() (+8 more)

### Community 9 - "Admin Runtime Dependencies"
Cohesion: 0.09
Nodes (23): dependencies, katex, lucide-react, react, react-dom, react-router-dom, react-simple-wysiwyg, sonner (+15 more)

### Community 10 - "Admin Loading UI"
Cohesion: 0.22
Nodes (9): EmptyState(), DropdownSkeleton(), HomeScreenSkeleton(), LivePreviewSkeleton(), SavedSimulationsSkeleton(), SimulationCardSkeleton(), TopicInputSkeleton(), COLORS (+1 more)

### Community 11 - "Student Landing Page"
Cohesion: 0.18
Nodes (9): Features, Footer(), PreviewSection(), FEATURED_ANIMATIONS, oscilloscope, planetaryMotion, simpleHarmonicMotion, waterMolecule (+1 more)

### Community 12 - "Admin Live Preview"
Cohesion: 0.22
Nodes (9): GeneratingState(), ReadyState(), useIframeHeight(), PreviewContent(), injectResponsiveCSS(), HTML_ENTITIES, decodeHtmlEntities(), preprocessLegacyMath() (+1 more)

### Community 13 - "Student Auth Forms"
Cohesion: 0.23
Nodes (9): AuthForm(), AuthFormContent(), AuthFormFields(), AuthStats(), AuthFormContext, AuthFormProvider(), useAuthForm(), Navbar() (+1 more)

### Community 14 - "Panel Entry Points"
Cohesion: 0.22
Nodes (10): Admin Panel HTML Entry Point, Co-Tutor Admin Application, co_tutor_logo.png Favicon, /src/main.jsx React Entry Point, Student Panel HTML Entry Point, co_tutor_logo.png Favicon (Student), Co-Tutor Student Application, Google Fonts Integration (Inter & Outfit) (+2 more)

## Knowledge Gaps
- **89 isolated node(s):** `supabase`, `name`, `private`, `version`, `type` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useSimulation()` connect `Admin Simulation Wizard` to `Admin App Shell`, `Admin Curriculum Data`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `useCurriculumCrud()` connect `Admin Curriculum Data` to `Admin Curriculum UI`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Student Runtime Dependencies` to `Student Build Config`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `supabase`, `name`, `private` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Student Auth Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.08834586466165413 - nodes in this community are weakly interconnected._
- **Should `Admin Simulation Wizard` be split into smaller, more focused modules?**
  _Cohesion score 0.08956228956228957 - nodes in this community are weakly interconnected._
- **Should `Admin App Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.0898989898989899 - nodes in this community are weakly interconnected._