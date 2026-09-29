# Graph Report - Co-Tutor  (2026-07-31)

## Corpus Check
- 159 files · ~107,628 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 486 nodes · 934 edges · 30 communities (25 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8a4e615a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- auth/context/AuthContext.jsx
- useSimulation
- src/context/AuthContext.jsx
- dependencies
- FilterDropdown.jsx
- CurriculumManager.jsx
- devDependencies
- devDependencies
- useSimulationViewer
- dependencies
- SimulationContext.jsx
- Landing.jsx
- PreviewContent.jsx
- AuthForm.jsx
- Student Panel HTML Entry Point
- Admin Panel Audit Report
- admin-panel/vercel.json
- cardiacCycle.js
- fluidMosaicModel.js
- pendulumMotion.js
- student-panel/vercel.json
- CategoryList.jsx
- Header.jsx

## God Nodes (most connected - your core abstractions)
1. `useSimulation()` - 35 edges
2. `useWizard()` - 17 edges
3. `useAuth()` - 17 edges
4. `useCurriculumCrud()` - 15 edges
5. `slugify()` - 15 edges
6. `useAuth()` - 13 edges
7. `supabase` - 13 edges
8. `SimulationProvider()` - 12 edges
9. `useSimulationViewer()` - 11 edges
10. `supabase` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Co-Tutor Admin Application` --conceptually_related_to--> `Co-Tutor Student Application`  [INFERRED]
  admin-panel/index.html → student-panel/index.html
- `/src/main.jsx React Entry Point` --conceptually_related_to--> `/src/main.jsx React Entry Point (Student)`  [INFERRED]
  admin-panel/index.html → student-panel/index.html
- `SavedSimulationsPage()` --calls--> `useSimulation()`  [EXTRACTED]
  admin-panel/src/pages/Simulations/SavedSimulationsPage.jsx → admin-panel/src/features/simulations/context/SimulationContext.jsx
- `Header()` --calls--> `useWizard()`  [EXTRACTED]
  admin-panel/src/components/layout/Header.jsx → admin-panel/src/features/simulations/context/WizardContext.jsx
- `ChapterSelector()` --calls--> `useChapters()`  [EXTRACTED]
  admin-panel/src/features/simulations/components/ChapterSelector.jsx → admin-panel/src/features/simulations/hooks/useChapterQueries.js

## Import Cycles
- None detected.

## Communities (30 total, 5 thin omitted)

### Community 0 - "auth/context/AuthContext.jsx"
Cohesion: 0.10
Nodes (30): DotField, EmptyState(), LogoutConfirmationModal(), MobileDropdown(), TopNavbar(), AuthContext, AuthProvider(), useAuth() (+22 more)

### Community 1 - "useSimulation"
Cohesion: 0.10
Nodes (29): CustomDropdown(), DropdownSkeleton(), ChapterSelector(), ClassSelector(), LivePreview(), COLORS, SubjectSelector(), GenerateActions() (+21 more)

### Community 2 - "src/context/AuthContext.jsx"
Cohesion: 0.09
Nodes (33): App(), Header(), AuthContext, AuthProvider(), useAuth(), SavedSimulations(), useChapters(), useCreateChapter() (+25 more)

### Community 3 - "dependencies"
Cohesion: 0.06
Nodes (35): file-saver, html2canvas, markdown-docx, marked, react-markdown, react-to-print, slugify, dependencies (+27 more)

### Community 4 - "FilterDropdown.jsx"
Cohesion: 0.38
Nodes (4): FilterDropdown(), COLORS, FilterDropdownMenu(), SimulationsFilterBar()

### Community 5 - "CurriculumManager.jsx"
Cohesion: 0.10
Nodes (16): ConfirmationModal(), EmptyState(), CurriculumSkeleton(), HomeScreenSkeleton(), LivePreviewSkeleton(), SavedSimulationsSkeleton(), SimulationCardSkeleton(), TopicInputSkeleton() (+8 more)

### Community 6 - "devDependencies"
Cohesion: 0.07
Nodes (28): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/react, @types/react-dom (+20 more)

### Community 7 - "devDependencies"
Cohesion: 0.07
Nodes (28): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/react, @types/react-dom (+20 more)

### Community 8 - "useSimulationViewer"
Cohesion: 0.22
Nodes (11): Chatbot(), ChatMessage(), StudyGuidePrintView, useSimulationViewer(), SimulationTabs(), SimulationViewerContent(), ViewerHeader(), ViewerIframe() (+3 more)

### Community 9 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, katex, lucide-react, react, react-dom, react-router-dom, react-simple-wysiwyg, sonner (+15 more)

### Community 10 - "SimulationContext.jsx"
Cohesion: 0.23
Nodes (11): SimulationContext, SimulationProvider(), useHtmlDetailsExtraction(), useHtmlUpload(), useSimulationGeneration(), useSimulationManagement(), useSimulationState(), useSimulationStorage() (+3 more)

### Community 11 - "Landing.jsx"
Cohesion: 0.09
Nodes (19): App(), PageSkeleton(), Layout(), AuthForm(), Features, Footer(), Navbar(), PreviewSection() (+11 more)

### Community 12 - "PreviewContent.jsx"
Cohesion: 0.17
Nodes (11): GeneratingState(), ReadyState(), useIframeHeight(), PreviewContent(), injectResponsiveCSS(), WorkspaceAIUpdater(), WorkspaceRightPanel(), HTML_ENTITIES (+3 more)

### Community 13 - "AuthForm.jsx"
Cohesion: 0.38
Nodes (6): AuthFormContent(), AuthFormFields(), AuthStats(), AuthFormContext, AuthFormProvider(), useAuthForm()

### Community 14 - "Student Panel HTML Entry Point"
Cohesion: 0.22
Nodes (10): Admin Panel HTML Entry Point, Co-Tutor Admin Application, co_tutor_logo.png Favicon, /src/main.jsx React Entry Point, Student Panel HTML Entry Point, co_tutor_logo.png Favicon (Student), Co-Tutor Student Application, Google Fonts Integration (Inter & Outfit) (+2 more)

### Community 15 - "Admin Panel Audit Report"
Cohesion: 0.12
Nodes (16): Admin Panel Audit Report, ⚫ DEAD CODE, Executive Summary, HIGH, HIGH, LOW, LOW, MEDIUM (+8 more)

### Community 28 - "CategoryList.jsx"
Cohesion: 0.33
Nodes (7): CategoryCard(), formatDate(), CategoryEmptyState(), CategoryList(), ChapterListRenderer(), ClassListRenderer(), SubjectListRenderer()

### Community 29 - "Header.jsx"
Cohesion: 0.52
Nodes (3): LogoutConfirmationModal(), MobileMenu(), NavLinks()

## Knowledge Gaps
- **100 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useSimulation()` connect `useSimulation` to `SimulationContext.jsx`, `src/context/AuthContext.jsx`, `PreviewContent.jsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `useCurriculumCrud()` connect `src/context/AuthContext.jsx` to `CurriculumManager.jsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth/context/AuthContext.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0965166908563135 - nodes in this community are weakly interconnected._
- **Should `useSimulation` be split into smaller, more focused modules?**
  _Cohesion score 0.10030165912518854 - nodes in this community are weakly interconnected._
- **Should `src/context/AuthContext.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09351432880844646 - nodes in this community are weakly interconnected._