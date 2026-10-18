# Architecture decisions

## 1. Static by default

The application has no server-side features or persistent patient records. Static HTML, CSS, and JavaScript keep direct browser use . Classic deferred scripts support local file opening. Development tools use Node’s standard library where possible.

## 2. Reasoning is separate from rendering

`knowledge.js` owns demonstration data. `engine.js` evaluates copied, frozen rules and returns evidence objects without accessing the DOM. `app.js` manages one small state object and renders that evidence. This separation makes reasoning independently testable.

## 3. Scores describe coverage

The original implementation called its comparison weighted or probabilistic. Every symptom actually had equal weight. Clean Med preserves that simple formula and labels it accurately as coverage. It separately shows additional symptoms, discloses ties, and describes unselected symptoms as unknown.

Complete forward matches require every stored prerequisite. Backward verification checks one named rule. Neither is a recursive inference engine; the interface and documentation state this explicitly.

## 4. Derived state expires immediately

Selection changes discard assessment results and verification output. Changing a verification target clears its previous output. An export can only be created from the current assessment. This prevents stale scores being presented as if they described a new selection.

## 5. No symptom persistence

Selections live in a `Set` in memory. Only `clean-med-theme` is persisted. Export happens through a local Blob URL, which is revoked after the download begins. There is no backend or telemetry.

## 6. Accessibility uses native controls

Checkboxes represent multi-selection, selects represent a target condition, and `details` exposes evidence. Navigation changes move focus into the main region. Sample dismissal returns focus to its trigger, and the mobile drawer contains keyboard focus until dismissed.

Automated axe audits run alongside user-flow tests. These are useful regression checks, not a claim of comprehensive accessibility certification.

## 7. Publication is explicit

CI runs on pushes and pull requests.  Source files are packaged into `dist/`.
