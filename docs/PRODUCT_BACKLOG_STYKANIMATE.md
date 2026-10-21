# MiniBot Studio --- Product Specification & User Story Backlog

**Version:** 2.0\
**Document language:** English\
**Product UI and child-facing content:** Arabic (RTL)\
**Product type:** Offline-first educational web application\
**Target audience:** Children aged 5+, with a separate parent area\
**Target technology:** HTML5, CSS, vanilla JavaScript; Blockly for the
visual block editor; StykAnimate (GPL-3.0-or-later) for Story Studio,
subject to the licensing gate US-045\
**Status:** Implementation-ready backlog (60 stories)

> **What changed from v1.1.** Stories US-001 to US-038 are kept as
> written. Version 2.0 adds: engineering foundation and process (Epic
> I), Story Studio built on StykAnimate (Epic J), accessibility (Epic
> K), documentation and release (Epic L), the verified StykAnimate
> findings (section 5.5), naming conventions for branches, commits, and
> pull requests (section 5.6), dependencies for every story, and a
> complete sprint plan covering all 60 stories (section 20). v1.1's
> delivery plan left several stories unscheduled; they are now
> scheduled.

------------------------------------------------------------------------

## 1. Product Vision

Build an engaging Arabic-language learning experience that introduces
children to programming and robotics through visual programming blocks
and an animated robot simulator. Children assemble blocks, press Play,
and watch the robot follow their instructions. The child should not need
to read or write source code.

**Core promise to the child:** "Build the commands, press Play, and see
what your robot does!"

### Product goals

1.  Teach sequencing, logical thinking, and problem-solving.
2.  Provide a fully Arabic child-facing experience with correct
    right-to-left (RTL) layout.
3.  Encourage experimentation without punishment or discouraging failure
    messages.
4.  Start with simple grid puzzles, then gradually introduce loops,
    conditions, and sensors.
5.  Work locally in the browser, with progress saved on the device.
6.  Provide parents with a simple view of completed levels and skills,
    plus basic settings.

### Out of scope for the first release

-   Controlling a real physical robot.
-   User accounts or cloud synchronization.
-   Open-ended chat or internet-sourced content.
-   Purchases, advertisements, or behavioral tracking.
-   A free-form JavaScript editor for children.
-   A 3D physics engine.

------------------------------------------------------------------------

## 2. Users and Personas

### Child

-   Approximately 5 years old.
-   May not yet read Arabic fluently.
-   Primarily interacts through touch, a mouse, icons, and audio.
-   Needs short instructions, large controls, and immediate visual
    feedback.

### Parent or guardian

-   Starts the app and chooses an appropriate activity.
-   Wants an experience without advertisements or mandatory internet
    access.
-   Wants to understand which skills the child has tried and to control
    sound, language, and progress reset.

------------------------------------------------------------------------

## 3. UX Principles and Arabic-Language Requirements

-   **Visual-first:** Every important command must have a recognizable
    icon; short Arabic audio may supplement it.
-   **Safe failure:** Mistakes never remove points. The child receives a
    hint or can try again.
-   **Gradual learning:** Loops and conditions are not introduced before
    basic sequencing.
-   **Observable results:** The currently executing block is highlighted
    while the robot performs the corresponding action.
-   **Touch-friendly:** Interactive targets are large and spaced, with
    mouse and keyboard alternatives where applicable.
-   **Arabic by default:** Set `lang="ar"` and `dir="rtl"` for the
    application document.
-   **World directions remain intuitive:** RTL layout must not
    accidentally mirror the robot's movement, grid coordinates, or
    directional icons.
-   **Color is not the only signal:** Every block type also has a shape,
    icon, and short Arabic label or spoken description.
-   **No reading required:** Early challenges use pictures,
    demonstrations, and optional Arabic narration.
-   **Privacy by default:** No account, external analytics, or
    unnecessary collection of personal data.
-   **Language distinction:** This backlog and developer documentation
    are written in English. The child-facing application UI, block
    labels, tutorials, hints, success messages, and audio are in Arabic.
    English may appear only in developer tools or technical diagnostics
    that are not shown to the child.

### Suggested child-facing Arabic labels

  UI purpose     Arabic label
  -------------- -------------------
  Play           العب / تشغيل
  Continue       واصل اللعب
  Parents        للأهل
  Start          ابدأ
  Move forward   تقدّم خطوة
  Turn left      انعطف يساراً
  Turn right     انعطف يميناً
  Collect star   اجمع النجمة
  Repeat         كرّر
  Hint           تلميح
  Try again      حاول مرة أخرى
  Next level     المستوى التالي
  Reset          أعد المحاولة
  Sound on/off   الصوت / كتم الصوت

Use simple Modern Standard Arabic for visible text. Tunisian Arabic
narration may be considered as a later enhancement, but it must not be
required for the MVP.

------------------------------------------------------------------------

## 4. Product Scope

### 4.1 Main play screen

The screen contains: 1. **Robot world:** A clear grid with the robot,
target, and obstacles. 2. **Program workspace:** The ordered sequence of
blocks. 3. **Block toolbox:** Blocks available for the current level. 4.
**Control bar:** Play, pause, stop, reset, and hint. 5. **Progress
indicator:** Level number or stage icon, without competitive pressure.

All child-facing labels and messages on this screen must be Arabic and
RTL-aware.

### 4.2 Proposed block types

  -----------------------------------------------------------------------
  Category                Block                   Behavior
  ----------------------- ----------------------- -----------------------
  Event                   Start                   Starts the program

  Movement                Move forward            Moves the robot one
                                                  cell forward

  Movement                Turn right              Rotates the robot 90
                                                  degrees right

  Movement                Turn left               Rotates the robot 90
                                                  degrees left

  Interaction             Collect star            Collects a star when
                                                  the robot is at the
                                                  appropriate location

  Appearance              Light on                Turns on the robot's
                                                  light

  Sound                   Play sound              Plays a local sound
                                                  effect

  Control                 Repeat                  Repeats a group of
                                                  blocks a specified
                                                  number of times

  Condition               If path is blocked      Runs a group of blocks
                                                  if an obstacle is ahead

  Sensor                  Detect obstacle         Reads whether the next
                                                  cell is blocked
  -----------------------------------------------------------------------

### 4.3 Game worlds

-   **Garden:** Reach a flower or collect an apple.
-   **Home:** Guide the robot home.
-   **Space:** Collect stars and avoid asteroids.
-   **Ocean:** Reach and help a sea creature.
-   **Robotics Lab:** Experiment with lights, motors, and sensors.

Worlds should be added progressively; the MVP does not need all of them.

------------------------------------------------------------------------

## 5. Technical Recommendations

### 5.1 Technology

-   Semantic HTML for application structure.
-   Responsive CSS with RTL support.
-   Modern JavaScript using ES modules.
-   Canvas or DOM for rendering the world; choose one approach for the
    initial prototype.
-   Blockly is a suitable option for block dragging, connections, and
    nested loops. A custom editor can be considered later if usability
    testing shows that Blockly cannot meet the desired child experience.
-   `localStorage` for basic settings and progress; `IndexedDB` for
    larger saved projects if needed.
-   No backend required for the first release.

### 5.2 Proposed project structure

``` text
minibot-studio/
├── index.html
├── css/
│   ├── app.css
│   ├── layout.css
│   ├── blocks.css
│   └── animations.css
├── js/
│   ├── app.js
│   ├── core/
│   │   ├── block-registry.js
│   │   ├── program-validator.js
│   │   └── execution-engine.js
│   ├── editor/
│   │   ├── toolbox.js
│   │   ├── workspace.js
│   │   └── serialization.js
│   ├── simulator/
│   │   ├── world.js
│   │   ├── robot.js
│   │   ├── sensors.js
│   │   └── renderer.js
│   ├── levels/
│   │   ├── level-registry.js
│   │   └── challenge-manager.js
│   ├── i18n/
│   │   └── ar.js
│   └── storage/
│       └── save-manager.js
├── assets/
│   ├── robots/
│   ├── worlds/
│   ├── sounds/
│   └── icons/
└── README.md
```

### 5.3 Program execution model

Store programs as structured data. Do not generate JavaScript source and
execute it with `eval()` or `new Function()`.

Illustrative representation:

``` js
[
  { type: "start" },
  { type: "moveForward", steps: 1 },
  { type: "turnRight" },
  { type: "moveForward", steps: 1 },
  { type: "collectStar" }
]
```

The engine executes one block at a time, highlights it in the editor,
and updates the world. It must support cancellation, stop/reset, and a
maximum step budget to prevent unbounded loops.

### 5.4 Quality requirements

-   Separate block definitions, execution logic, and world rendering.
-   Validate programs before execution.
-   Never allow the robot to move through walls or outside world bounds.
-   Execute one action at a time with explicit execution state.
-   Clean up timers and event listeners during restart/reset.
-   Version level and saved-project data.
-   Do not require network access to run the core game.

------------------------------------------------------------------------

### 5.5 Story Studio and StykAnimate (verified findings)

Inspected on 21 October 2026 by cloning the upstream repository and
reading its files. Upstream may change; US-046 re-pins a commit.

| Item | Finding |
| --- | --- |
| Repository | https://github.com/filippocalippo/StykAnimate-App |
| Inspected commit | `def97214c2b491fbce82647f625a73f78416c6d8` (2026-10-19), package version 1.2.5 |
| License | GPL-3.0-or-later (`LICENSE` is the GPL v3 text; `package.json` says `GPL-3.0-or-later`) |
| Third-party parts | resvg (MPL-2.0), earcut (ISC), opentype.js (MIT), Noto Sans and Inter (SIL OFL 1.1), zstd-wasm (MIT/BSD-2), sticknodes-rs adaptation (MIT); desktop builds also ship FFmpeg (GPL-3.0) and Electron, which MiniBot does not need |
| Browser build | Static website, no server. A Python codec runs in WebAssembly (Pyodide) in the browser. Offline after first load through a service worker (per upstream `docs/WEB.md`) |
| Build commands | `npm ci`, `npm run web:build`, `npm run web:verify`, `npm run test:web` |
| Graphics | WebGPU, with a labeled Canvas 2D fallback when WebGPU is missing (per `docs/renderer.md`) |
| Arabic | An `ar` locale pack exists (about 7,000 strings); RTL support is documented. Translation quality is not yet reviewed (US-048) |
| Child suitability | Full professional editor with a Simple frame-strip timeline and an Advanced timeline. Not designed for a five-year-old; needs adult help and activity cards (US-050) |
| Embedding | No embedding API found. The production headers set `X-Frame-Options: DENY` and `frame-ancestors 'none'`, so it is not designed to be framed. This backlog opens it in its own window |
| Network | Local-only editing. Optional consent-based diagnostics exist. A community library uses a server route (`/community/*`) in the upstream deployment; US-046 audits and disables external requests |
| Storage | Browser storage on the same origin as MiniBot would be shared; US-049 verifies no key collisions |
| Not verified | Whether `web:build` fetches anything from the network, the size of the built output, Arabic translation quality, how to preselect Arabic |

**What this means for MiniBot Studio.** StykAnimate can be used because
it is open source, but GPL-3.0-or-later is a copyleft license. If
MiniBot Studio is distributed to other people together with StykAnimate,
the distributed combination is expected to be offered under
GPL-3.0-or-later with its source. Keeping the editor in a separate
window or path does not by itself change that. If the app is only for
private family use and is never given to anyone else, distribution
obligations are not triggered, but the safest design is the same.
Decision A in US-045 (license MiniBot Studio under GPL-3.0-or-later)
is therefore the recommended path; decision B means Story Studio is
built without upstream code (US-055). This is a technical summary, not
legal advice; ambiguous points go to qualified legal review.

**Integration approach.** Option A' --- vendor an unmodified, pinned
build of the upstream web app as a separate component under
`third_party/stykanimate/`, served at its own path and opened in its own
window. MiniBot shares no data with it. Robot Lab and Story Studio are
connected only by the optional story idea card (US-051).

### 5.6 Engineering workflow and naming conventions

Every story is implemented in its own branch, commit set, and pull
request. A sprint is a planning grouping, not a unit of delivery.

| Item | Convention | Example |
| --- | --- | --- |
| Story ID | `US-###` (stable, never reused) | `US-011` |
| Feature branch | `feat/US-###-short-kebab-case` | `feat/US-011-drag-block-into-workspace` |
| Fix branch | `fix/US-###-short-kebab-case` | `fix/US-006-wall-collision` |
| Test branch | `test/US-###-short-kebab-case` | `test/US-033-engine-turns` |
| Docs branch | `docs/US-###-short-kebab-case` | `docs/US-058-readme-setup` |
| Sprint integration branch | `sprint/<n>-short-kebab-case` | `sprint/2-block-editor` |
| Commit | `<type>(US-###): <imperative summary>` | `feat(US-011): add drag and drop from toolbox` |
| Pull request title | `[US-###] <Imperative summary>` | `[US-011] Add drag and drop from toolbox` |
| Sprint roll-up PR | `[SPRINT-<n>] <Sprint goal>` | `[SPRINT-2] Block editor` |

Pull requests for stories target the current sprint integration branch.
When a story depends on a story whose pull request is still open, its
branch starts from that story's branch and its pull request targets that
branch (a stacked pull request, noted in the description). At the end of
a sprint, a roll-up pull request from the sprint branch to the default
branch carries no new code; it lists the story pull requests and their
verification. A human reviews and merges. Status for every story lives
in `docs/implementation-status.md`.

------------------------------------------------------------------------

## 6. Definition of Done

A user story is complete only when: 1. All listed acceptance criteria
pass. 2. The feature works with touch and mouse where applicable. 3.
Arabic labels and RTL layout are correct. 4. Relevant empty, loading,
and error states are handled. 5. The primary user flow produces no
JavaScript console errors. 6. Important normal and edge cases have been
tested. 7. Existing levels and saved projects are not unintentionally
broken. 8. Core assets are local and do not require external network
access. 9. Child-facing text is understandable and in Arabic;
parent-facing text is clearly distinguished. 10. README is updated when
setup or test commands change.

### Additional engineering requirements

11. Automated tests for the story exist, and they actually passed
    (commands and real output recorded in the pull request).
12. CI is green on the pull request.
13. The change is limited to the story, with a dedicated commit whose
    scope is the story ID and a dedicated pull request.
14. `docs/implementation-status.md` is updated. A story with an open
    pull request is `In Review`, not `Done`.
15. No upstream StykAnimate code or assets are used unless US-045 is
    recorded and the use matches it.

------------------------------------------------------------------------

## 7. Backlog Priorities and Estimates

-   **P0 --- Must have:** Required for the MVP.
-   **P1 --- Should have:** Adds substantial value after the core
    experience works.
-   **P2 --- Later:** Expansion after validating the core learning loop.

Story points are rough relative estimates, not delivery promises.

------------------------------------------------------------------------

# 8. Epic A --- Application Shell and Arabic UI

## US-001 --- Launch the app in Arabic

**Priority:** P0 · **Estimate:** 3 points

**User story:** As an Arabic-speaking child, I want the game to open in
Arabic with a correct layout so that I can understand its controls.

### Acceptance criteria

-   On first launch, the child-facing language is Arabic.
-   The HTML document uses `lang="ar"` and `dir="rtl"`.
-   Arabic headings, buttons, and menus use appropriate direction and
    alignment.
-   Robot direction indicators and movement icons are not incorrectly
    mirrored by RTL styling.
-   Text is not clipped or overlapped at supported phone, tablet, and
    desktop sizes.
-   Numbers and symbols remain legible when mixed with Arabic text.

## US-002 --- Provide a simple home screen

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a child, I want a home screen with obvious choices so
that I can start playing with minimal adult assistance.

### Acceptance criteria

-   The home screen provides clear options for "Play," "Continue" when
    progress exists, and "Parents."
-   Every option has an icon and a short Arabic label.
-   Interactive targets are large and child-friendly.
-   Selecting "Play" opens the first available level.
-   No advertisements, external links, or unnecessary pop-ups are shown.

## US-003 --- Provide a parent settings area

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a parent, I want to manage sound and reset progress
in a separate area so that I can control the child's experience.

### Acceptance criteria

-   A settings area can be opened separately from gameplay.
-   Sound effects can be enabled or disabled.
-   Clearing progress requires a clear confirmation.
-   Leaving parent settings does not discard saved progress.
-   The parent area does not request unnecessary personal information.

## US-004 --- Support different screen sizes and input methods

**Priority:** P0 · **Estimate:** 5 points

**User story:** As a user, I want to use the game on a computer or
tablet so that I can play on the device available to me.

### Acceptance criteria

-   No unintended horizontal page scrolling occurs at supported viewport
    sizes.
-   The robot world, block area, and controls remain visible and usable.
-   Core interactions work with touch and mouse.
-   No core action depends only on mouse hover.
-   Controls are sufficiently spaced to reduce accidental taps.

------------------------------------------------------------------------

# 9. Epic B --- Robot World and Simulation

## US-005 --- Render a grid-based world

**Priority:** P0 · **Estimate:** 5 points

**User story:** As a child, I want to see a robot, a target, and
obstacles on a grid so that I can plan where the robot should go.

### Acceptance criteria

-   A level displays a grid with consistent cell dimensions.
-   The robot, target, and walls are visually distinguishable.
-   No world element is rendered outside the grid.
-   Level maps are loaded from data separate from rendering code.
-   The grid fits the play area without distorting cell proportions.

## US-006 --- Move the robot

**Priority:** P0 · **Estimate:** 5 points

**User story:** As a child, I want to see the robot move when an
instruction runs so that I can connect a block to its result.

### Acceptance criteria

-   A `Move forward` command moves the robot one cell in its current
    direction.
-   Movement is animated rather than appearing as an unexplained jump.
-   The robot cannot pass through walls or leave the grid.
-   If the next cell is blocked, the action stops and the child receives
    a friendly Arabic explanation.
-   The logical and visual robot states remain synchronized.

## US-007 --- Rotate the robot

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a child, I want to turn the robot left and right so
that I can learn directions.

### Acceptance criteria

-   `Turn right` rotates the robot 90 degrees clockwise.
-   `Turn left` rotates the robot 90 degrees counterclockwise.
-   Turning does not change the robot's grid position.
-   The robot's current direction is visually clear.
-   Repeated turns produce the correct final orientation.

## US-008 --- Collect objects and detect goals

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a child, I want to collect a star or reach a goal so
that I know when I have solved a challenge.

### Acceptance criteria

-   A level can define one or more targets or collectible objects.
-   A star is collected when the robot reaches it or runs the correct
    collection action, according to level rules.
-   A visual and optional sound effect confirms collection.
-   The same object cannot be collected more than once.
-   The level manager detects completion from the level's defined
    success conditions.

## US-009 --- Play, stop, and reset the world

**Priority:** P0 · **Estimate:** 5 points

**User story:** As a child, I want to play, stop, and reset the robot so
that I can try different solutions.

### Acceptance criteria

-   The Play control starts the current program.
-   Stop cancels future instructions and pending movement.
-   Reset returns the robot and collectibles to the initial level state.
-   Repeated Play presses cannot start concurrent executions of the same
    program.
-   Program editing is disabled during execution or safely coordinated
    with execution state.

------------------------------------------------------------------------

# 10. Epic C --- Visual Block Editor

## US-010 --- Show the block toolbox

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a child, I want to see available commands as large,
colorful blocks so that I can choose what the robot should do.

### Acceptance criteria

-   Only blocks allowed in the current level are shown.
-   Every block has a clear icon and a short Arabic label.
-   Color is not the only way to distinguish block types.
-   The block's function can be understood from its shape, icon, label,
    or audio description.
-   Blocks are sized for touch and drag interactions.

## US-011 --- Add a block to the program

**Priority:** P0 · **Estimate:** 8 points

**User story:** As a child, I want to drag a block into the workspace so
that I can arrange robot instructions.

### Acceptance criteria

-   A block can be dragged from the toolbox into the workspace.
-   The expected insertion position is visible before drop.
-   Dropping a block in a valid position inserts it into the program
    sequence.
-   Invalid drops are rejected with clear visual feedback.
-   Adding blocks works with both mouse and touch.
-   Existing blocks are preserved when a new block is inserted.

## US-012 --- Reorder and delete blocks

**Priority:** P0 · **Estimate:** 5 points

**User story:** As a child, I want to reorder or remove instructions so
that I can fix my program.

### Acceptance criteria

-   A block can be moved to another position in the sequence.
-   Display order matches execution order.
-   A block can be deleted using a clear control or a designated delete
    area.
-   Deleting a block does not accidentally remove adjacent blocks.
-   The final sequence is easy to inspect before execution.

## US-013 --- Execute and highlight blocks one at a time

**Priority:** P0 · **Estimate:** 8 points

**User story:** As a child, I want the currently executing block to be
highlighted so that I can understand how my program works.

### Acceptance criteria

-   The engine executes blocks sequentially, one at a time.
-   The current block is highlighted in the workspace.
-   Robot movement and the highlighted block remain synchronized.
-   The highlight is cleared when execution finishes or stops.
-   Invalid or unknown blocks produce a short Arabic message rather than
    a technical stack trace.
-   Program execution does not use `eval()` or `new Function()`.

## US-014 --- Validate programs before running them

**Priority:** P0 · **Estimate:** 5 points

**User story:** As a child, I want the game to help when my program is
incomplete rather than crash.

### Acceptance criteria

-   The validator checks for a start block when required by the level.
-   Empty programs are blocked when the level does not allow them.
-   Required blocks and their inputs are validated.
-   The reason execution cannot start is communicated through a short
    Arabic message or understandable icon.
-   Internal technical errors are never shown to the child.

## US-015 --- Save and restore a program

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a child, I want to return to my program later so that
I do not have to rebuild it every time.

### Acceptance criteria

-   The current program can be saved locally.
-   The program can be restored after reloading the page.
-   Saved data includes a schema version and level identifier.
-   Corrupt or outdated data is handled gracefully without crashing the
    app.
-   Programs are not sent to an external server.

------------------------------------------------------------------------

# 11. Epic D --- Execution Engine and Learning Blocks

## US-016 --- Implement start and movement blocks

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a beginner, I want start and move commands so that I
can create my first program.

### Acceptance criteria

-   The first level provides `Start` and `Move forward` blocks.
-   A movement block moves the robot one cell in its current direction.
-   Movement blocks can be used consecutively.
-   The child sees the result of each instruction.
-   The first level includes a visual demonstration of adding a block.

## US-017 --- Implement turning blocks

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a child, I want to turn the robot so that I can reach
a goal that is not directly ahead.

### Acceptance criteria

-   Left and right turn blocks appear in the level that introduces them.
-   Each turn rotates the robot by 90 degrees.
-   Turning does not change the robot's coordinates.
-   The first turning level includes a visual example or hint.

## US-018 --- Implement repeat blocks

**Priority:** P1 · **Estimate:** 8 points

**User story:** As a child, I want the robot to repeat a movement
several times so that I can learn that one command can run more than
once.

### Acceptance criteria

-   Movement blocks can be nested inside a `Repeat` block.
-   The repeat count is a bounded, valid integer.
-   The engine executes nested blocks in order for each iteration.
-   Nested blocks are highlighted during execution.
-   Invalid repeat counts and unsafe repetition are rejected.
-   Stopping during a loop cancels execution and leaves no active timers
    behind.

## US-019 --- Implement simple conditions

**Priority:** P2 · **Estimate:** 8 points

**User story:** As a child, I want the robot to behave differently when
it detects an obstacle so that I can learn decision-making.

### Acceptance criteria

-   Commands can be placed inside a conditional block.
-   The first version supports one clear condition, such as
    `If path is blocked`.
-   Nested commands run only when the condition is true.
-   The condition is evaluated against the current world state.
-   A tutorial level demonstrates the condition before asking the child
    to solve a challenge independently.

## US-020 --- Implement sensors and events

**Priority:** P2 · **Estimate:** 8 points

**User story:** As a child, I want a robot sensor to detect something
ahead so that I can explore basic robotics concepts.

### Acceptance criteria

-   The virtual lab provides a distance sensor that detects an obstacle
    in front of the robot.
-   Sensor state is displayed visually as "obstacle" or "clear," using
    Arabic child-facing labels.
-   Sensor output changes when the world changes.
-   Sensor readings can be used in a supported condition.
-   The simulation remains deterministic and testable.

## US-021 --- Enforce safe execution limits

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a user, I want programs that repeat indefinitely to
stop safely so that the game remains responsive.

### Acceptance criteria

-   The engine enforces a maximum number of execution steps per run.
-   Exceeding the limit stops execution safely and shows an
    understandable Arabic message.
-   The child can reset the level after execution stops.
-   The browser cannot be blocked by a long synchronous execution loop.
-   Pending actions and timers are cancelled on stop or reset.

------------------------------------------------------------------------

# 12. Epic E --- Levels and Progressive Learning

## US-022 --- Define levels as data

**Priority:** P0 · **Estimate:** 5 points

**User story:** As a developer, I want levels defined as separate data
so that I can add challenges without changing the game engine.

### Acceptance criteria

-   A level definition includes grid dimensions, robot position and
    direction, goals, obstacles, and available blocks.
-   The level defines success conditions and hints.
-   Level data is validated before display.
-   A new level can be added to the level registry without changing the
    execution engine.
-   Invalid level data produces a clear fallback instead of crashing the
    app.

## US-023 --- Deliver the first five challenges

**Priority:** P0 · **Estimate:** 5 points

**User story:** As a child, I want to begin with easy challenges that
gradually become harder.

### Acceptance criteria

-   Level 1: use one movement command to reach a goal.
-   Level 2: use two consecutive movement commands.
-   Level 3: use one turn.
-   Level 4: plan a route around a wall.
-   Level 5: choose an instruction sequence that reaches the goal.
-   Blocks are not introduced without a prior explanation or
    demonstration.
-   Each level has objectively testable success conditions.

## US-024 --- Provide progressive hints

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a child, I want a hint when I get stuck so that I can
keep learning.

### Acceptance criteria

-   A Hint control is available in levels that define hints.
-   Each hint provides one piece of guidance rather than immediately
    revealing the full solution.
-   Hints can be visual and optionally spoken when sound is enabled.
-   Requesting a hint never removes points.
-   Showing a hint does not change the program state.

## US-025 --- Celebrate level completion

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a child, I want to know when I succeed so that I can
feel proud and move to the next challenge.

### Acceptance criteria

-   The app detects when all level success conditions are met.
-   It shows a short positive Arabic message and a simple celebratory
    animation or illustration.
-   A "Next level" control is available when another level exists.
-   Incorrect attempts do not produce punitive failure messages.
-   A level is not marked complete unless its actual success conditions
    are satisfied.

## US-026 --- Persist learning progress

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a parent, I want completed levels to be remembered so
that the child can continue later.

### Acceptance criteria

-   Completed level identifiers are stored locally.
-   Progress is restored after reopening the app on the same device.
-   The home screen offers "Continue" when saved progress exists.
-   Saving progress does not require an account or internet access.
-   Progress can be cleared from the parent area after explicit
    confirmation.

## US-027 --- Track learning concepts without pressure

**Priority:** P2 · **Estimate:** 5 points

**User story:** As a parent, I want to see which concepts my child has
tried so that I can choose suitable activities.

### Acceptance criteria

-   The app locally records completed levels and their learning
    concepts, not personal details.
-   The parent dashboard shows a simple summary such as sequencing,
    directions, and repetition.
-   The dashboard does not rank the child against other children.
-   The child is not shown negative scores or discouraging labels.
-   Local progress records can be deleted.

------------------------------------------------------------------------

# 13. Epic F --- Arabic Audio and Age-Appropriate Interaction

## US-028 --- Provide spoken Arabic instructions

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a child who is not yet a fluent reader, I want to
hear short Arabic instructions so that I can understand the task.

### Acceptance criteria

-   Level instructions can be played using a clear audio control.
-   The app uses local audio files or an available speech mechanism
    without requiring external connectivity.
-   Audio does not play unexpectedly on every interaction.
-   Audio can be muted from settings.
-   If browser text-to-speech is unavailable, gameplay remains usable.

## US-029 --- Provide optional sound effects

**Priority:** P1 · **Estimate:** 3 points

**User story:** As a child, I want a friendly sound when the robot acts
or collects a star.

### Acceptance criteria

-   Short effects are available for movement, collection, and success.
-   Effects respect the mute setting.
-   Rapid events do not create unpleasant overlapping sounds.
-   Audio assets are not fetched from the internet.
-   Essential information remains visually available when sound is
    disabled.

## US-030 --- Guide first-time users

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a child, I want the game to show me how to add a
block and run my program so that I can start without a long explanation
from an adult.

### Acceptance criteria

-   The tutorial appears on first use or can be opened on demand.
-   Each tutorial step focuses on one action.
-   It identifies the toolbox, workspace, and Play control.
-   The tutorial can be skipped and replayed later.
-   It does not obscure every part of the screen at once.
-   All child-facing tutorial text and narration are in Arabic.

------------------------------------------------------------------------

# 14. Epic G --- Privacy, Reliability, and Testing

## US-031 --- Work offline

**Priority:** P0 · **Estimate:** 5 points

**User story:** As a parent, I want the game to work offline so that it
is available without an internet connection.

### Acceptance criteria

-   The home screen, core levels, and simulation work offline once
    application files are available locally.
-   Core assets do not depend on an external CDN.
-   No network request is required to play a core level.
-   README documents how to run the app locally.
-   Any third-party library has a documented local-bundling method and
    license requirements.

## US-032 --- Keep saved data local

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a parent, I want progress to stay on the device so
that my child's data is not sent to an external service.

### Acceptance criteria

-   Sound settings, progress, and projects are stored locally.
-   The app does not collect the child's name, photos, or location.
-   No external analytics or advertising is included.
-   Storage failures are handled with a clear message.
-   The parent area provides a way to delete locally stored app data.

## US-033 --- Test the execution engine

**Priority:** P0 · **Estimate:** 8 points

**User story:** As a developer, I want automated engine tests so that
new blocks do not break existing robot behavior.

### Acceptance criteria

-   Tests cover movement, grid boundaries, and walls.
-   Tests cover repeated turns.
-   Tests cover collectibles and win conditions.
-   Tests cover stop, reset, and prevention of concurrent runs.
-   Loop and execution-limit tests are added when loops are implemented.
-   A documented command runs the test suite.

## US-034 --- Handle errors gracefully

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a child, I want the game to stay understandable when
something goes wrong so that I can keep playing.

### Acceptance criteria

-   Internal technical details are not shown to the child.
-   Friendly Arabic messages and retry options are provided where
    appropriate.
-   Invalid level data does not crash the entire application.
-   The user can return to the home screen after a level error.
-   Developer diagnostics may be logged to the console, but must not
    contain personal data.

------------------------------------------------------------------------

# 15. Epic H --- Robotics Lab and Expansion

## US-035 --- Provide a free-play lab

**Priority:** P2 · **Estimate:** 8 points

**User story:** As a child, I want to experiment with blocks without a
fixed goal so that I can learn through exploration.

### Acceptance criteria

-   The lab can be opened after the introduction or from a clear menu
    option.
-   The child can position the robot and obstacles within safe
    boundaries.
-   The program can be run and the world reset.
-   Lab experiments do not affect story-level progress.
-   The lab does not require reading or writing source code.

## US-036 --- Control a light and play a sound

**Priority:** P2 · **Estimate:** 5 points

**User story:** As a child, I want to turn on the robot's light and make
a sound so that I can learn that programs control different components.

### Acceptance criteria

-   The light block visibly changes the robot's light state.
-   The sound block plays a local effect when sound is enabled.
-   The light state remains visible after the block executes.
-   Sound playback does not break program sequencing.
-   Muted audio still produces clear visual feedback.

## US-037 --- Customize the robot

**Priority:** P2 · **Estimate:** 5 points

**User story:** As a child, I want to choose my robot's appearance and
color so that it feels like my own creation.

### Acceptance criteria

-   A starter set of local robot designs and colors is available.
-   Customization appears in the play world.
-   Appearance changes do not affect movement or win rules.
-   Preferences are saved locally.
-   Contrast remains sufficient to distinguish the robot from the
    background.

## US-038 --- Export and import projects

**Priority:** P2 · **Estimate:** 5 points

**User story:** As a parent, I want to back up and restore a child's
project so that work is not lost when changing devices.

### Acceptance criteria

-   A project can be exported as a versioned data file.
-   Imported files are validated before being applied.
-   Corrupt or unsupported files are rejected with a clear message.
-   Imported data is never executed as source code.
-   Exported files do not contain unnecessary personal data.

------------------------------------------------------------------------

# 16. Epic I --- Engineering Foundation and Process

## US-039 --- Assess the existing repository and record a baseline

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a maintainer, I want a verified inventory of what
already exists so that no work is duplicated.

### Acceptance criteria

-   `docs/repo-assessment.md` lists every story in this backlog as
    Existing, Partial, or Missing, with file paths as evidence.
-   Existing install, test, and build commands are run and their real
    output is recorded, including pre-existing failures.
-   The JavaScript-versus-TypeScript decision is recorded as an ADR.
-   Stories already satisfied are marked `Done` in
    `docs/implementation-status.md` with evidence and are not
    re-implemented.
-   The owner's uncommitted changes are left untouched.

## US-040 --- Add continuous integration

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a maintainer, I want CI that fails when a required
check fails so that regressions are caught in every pull request.

### Acceptance criteria

-   CI runs on pull requests and on pushes to the default branch.
-   It runs install, lint (if present), tests, and build, using only
    scripts that exist in `package.json`.
-   A deliberately failing test makes the job fail (verified once, then
    reverted).
-   No workflow triggers itself, creates branches, or opens pull
    requests.

## US-041 --- Document contribution conventions and track story status

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a contributor, I want documented branch, commit, and
pull request rules so that every story is traceable.

### Acceptance criteria

-   `CONTRIBUTING.md` documents the naming conventions in section 5.6.
-   `.github/pull_request_template.md` exists and requires the story ID,
    acceptance-criteria checklist, commands run, actual results, and
    Arabic/RTL verification.
-   `docs/implementation-status.md` lists every story with status,
    branch, commit, pull request, and blockers.

## US-042 --- Validate the Copilot agent definition

**Priority:** P1 · **Estimate:** 2 points

**User story:** As a maintainer, I want the custom agent checked against
current GitHub documentation so that it loads and behaves as intended.

### Acceptance criteria

-   Frontmatter fields match the current GitHub custom agents
    configuration reference.
-   The agent appears in the repository's agent picker (manual check
    recorded in the pull request).
-   Agent instructions do not contradict other repository instruction
    files.

## US-043 --- Enforce a content security policy and static safety checks

**Priority:** P0 · **Estimate:** 3 points

**User story:** As a parent, I want the game to be technically unable to
run arbitrary code or contact external servers during normal play.

### Acceptance criteria

-   Robot Lab pages define a content security policy that allows only
    same-origin resources and no `unsafe-eval`.
-   A CI check fails when `eval()`, `new Function()`, or `innerHTML`
    with non-constant data appears outside a documented allowlist.
-   A browser test fails on any non-local network request during a
    complete Robot Lab session.
-   Paths that host third-party components (Story Studio) may use a
    separate, documented policy; Robot Lab's policy is not relaxed.

## US-044 --- Add browser end-to-end tests for the main learning flow

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a developer, I want automated browser tests of the
child's main flow so that regressions in touch, RTL, and execution are
caught before release.

### Acceptance criteria

-   A browser test opens the app, starts the first level, drags blocks
    into the workspace, runs the program, and reaches the success
    message.
-   The test asserts `lang="ar"` and `dir="rtl"` on the document.
-   A test reloads the page and checks that progress is restored.
-   A test stops and resets a running program.
-   The tests run in CI against the real scripts of this repository,
    and a failing assertion fails the job.

------------------------------------------------------------------------

# 17. Epic J --- Story Studio (StykAnimate Integration)

Story Studio gives the child a real animation tool, introduced
gradually with adult help. It is built on **StykAnimate**, an
open-source stick-figure animation app. Verified facts about the
upstream project are in section 5.5.

**Licensing gate:** StykAnimate is GPL-3.0-or-later. Nothing from
upstream may be bundled until US-045 records the owner's licensing
decision. Stories US-046 to US-054 stay `Blocked` until then. If the
owner decides not to license MiniBot Studio under GPL-compatible terms,
those stories become `Deferred` and US-055 replaces them.

## US-045 --- Decide MiniBot Studio's license (gate)

**Priority:** P0 · **Estimate:** 2 points

**User story:** As the product owner, I want an explicit licensing
decision so that integrating a GPL-licensed component is lawful and
documented.

### Acceptance criteria

-   ADR-0001 records the owner's decision: (A) license MiniBot Studio
    under GPL-3.0-or-later and integrate StykAnimate, or (B) keep other
    terms and do not bundle StykAnimate.
-   `LICENSE` and a third-party notices file exist and match the
    decision; they list Blockly, bundled fonts, and any other
    dependency with its license.
-   Questions that depend on legal interpretation are listed for
    qualified review; the ADR makes no claim beyond what was verified.
-   Stories US-046 to US-054 move to `Todo` (decision A) or `Deferred`
    (decision B) in `docs/implementation-status.md`.
-   The agent drafts the ADR and recommendation; the decision counts
    only when the owner merges it.

## US-046 --- Vendor the pinned StykAnimate web build

**Priority:** P1 · **Estimate:** 8 points

**User story:** As a child's parent, I want the animation tool to be
included in the app and work without a server so that Story Studio is
available offline.

### Acceptance criteria

-   `third_party/stykanimate/UPSTREAM.md` records the upstream URL, the
    pinned commit (`def97214c2b491fbce82647f625a73f78416c6d8`, version
    1.2.5, as inspected), the license, and the date inspected.
-   The web build is produced with upstream's documented scripts
    (`npm ci`, `npm run web:build`, `npm run web:verify`) by a
    reproducible script in this repository.
-   No upstream source file is modified. Any configuration needed is
    kept outside upstream files and documented.
-   The GPL-3.0 license text, upstream third-party notices, and a
    pointer to the corresponding source (the pinned commit) ship with
    the build.
-   The network requests made by the vendored build in a normal session
    are listed in `docs/story-studio-network-audit.md`. Expected result:
    none. Any external request is blocked or documented and disabled.
-   Optional diagnostics (see upstream `docs/telemetry.md`) are verified
    to be off by default.

## US-047 --- Open Story Studio from the home screen with an adult gate

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a child, I want to open Story Studio from the home
screen so that I can make animations with a grown-up's help.

### Acceptance criteria

-   The home screen shows a Story Studio card with an icon and a short
    Arabic label.
-   Before the editor opens, an Arabic screen for adults explains that
    this is an advanced tool by other authors, that an adult should
    help, and that it works offline.
-   The editor opens in a new window or tab, so closing it returns to
    MiniBot Studio; the upstream interface is not modified.
-   Robot Lab progress and settings are identical before and after a
    Story Studio session (automated check).
-   No MiniBot data is passed to the editor.

## US-048 --- Verify Arabic and RTL in the vendored editor

**Priority:** P1 · **Estimate:** 3 points

**User story:** As a parent, I want to know how well the animation tool
works in Arabic so that I can help my child.

### Acceptance criteria

-   Upstream ships an Arabic locale pack (`ar`); with it selected, the
    main screens (home, Simple timeline, export dialog, settings) are
    checked in RTL and screenshots are stored.
-   Defects are listed in `docs/story-studio-arabic-review.md` with a
    severity. None block the Simple-mode activity flow, or each is
    mitigated by the activity cards (US-050).
-   The mechanism for selecting Arabic is documented; if upstream has
    no supported way to preselect it, that is recorded as a limitation.

## US-049 --- Verify offline use and storage coexistence

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a parent, I want both parts of the app to work
offline without disturbing each other.

### Acceptance criteria

-   After the first load, with the network disabled, both Robot Lab and
    Story Studio open (browser test).
-   Service-worker scopes do not conflict; each controls only its own
    paths (verified).
-   Local storage, IndexedDB, and cache names used by MiniBot and by the
    vendored editor do not collide (automated test).
-   Resetting MiniBot progress (US-003) does not delete Story Studio
    projects unless the parent explicitly chooses to, and vice versa.
-   On a device without WebGPU, the editor starts in its Canvas
    fallback, or the limitation is documented.

## US-050 --- Provide Arabic activity cards for Story Studio

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a parent, I want short illustrated Arabic guides so
that I can help my child through the animation tool step by step.

### Acceptance criteria

-   At least five cards (for example: move a figure, add a frame, play,
    save, export), each covering one action.
-   Each card has an Arabic adult-assist note and a narration ID
    (US-028).
-   Every step is checked against the pinned build's actual interface;
    no card promises a feature the build does not have.
-   Cards are original MiniBot content; no upstream assets are copied.

## US-051 --- Turn a completed robot challenge into a story idea

**Priority:** P2 · **Estimate:** 5 points

**User story:** As a child, I want my finished robot challenge to give
me a story idea so that I can animate what happened.

### Acceptance criteria

-   After a level, a story card shows a title, a short scene
    description, the goal, and the robot's action sequence in pictures.
-   The card is built from level data only and contains no personal
    information.
-   Producing the card does not change Robot Lab progress.
-   The card does not claim to control the animation tool; it is a
    prompt for the child and the adult.

## US-052 --- Explain Story Studio data in the parent area

**Priority:** P2 · **Estimate:** 3 points

**User story:** As a parent, I want to know where animation projects
are stored and how to back them up.

### Acceptance criteria

-   The parent area states that projects stay in this browser on this
    device.
-   It explains how to export an editable project file and how to
    remove local Story Studio data.
-   It states that no data leaves the device.

## US-053 --- Show licenses and source notices

**Priority:** P1 · **Estimate:** 3 points

**User story:** As a user, I want to see which licenses apply and where
to find the source so that the app respects its open-source
obligations.

### Acceptance criteria

-   An "About and licenses" page in the parent area lists MiniBot
    Studio's license and each third-party component (Blockly, fonts,
    StykAnimate) with version and license.
-   For StykAnimate it shows the pinned commit and a link to the
    corresponding source.
-   The page works offline.

## US-054 --- Test the Story Studio integration

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a developer, I want automated checks of the
integration boundary so that updates do not break either side.

### Acceptance criteria

-   A browser test opens Story Studio from the home screen and checks
    that the editor loads offline.
-   A test verifies the pinned commit recorded in `UPSTREAM.md` matches
    the vendored build manifest.
-   A test verifies Robot Lab progress is unchanged after a Story Studio
    session.
-   The tests run in CI.

## US-055 --- Build a minimal original animation workspace (conditional)

**Priority:** P2 · **Estimate:** 13 points

**User story:** As a child, I want a very simple animation tool so that
I can make a short story.

Applies **only if** US-045 records decision B. Split into smaller
stories during refinement.

### Acceptance criteria

-   A small fixed set of tools: place a character, move it, add a
    frame, play.
-   Projects are saved locally with a versioned, validated format
    (reusing US-038 rules).
-   No upstream StykAnimate code or assets are used.

------------------------------------------------------------------------

# 18. Epic K --- Accessibility

## US-056 --- Audit and fix accessibility

**Priority:** P1 · **Estimate:** 5 points

**User story:** As a child or parent with different abilities, I want
the app to be usable with different input and sensory needs.

### Acceptance criteria

-   Interactive elements have accessible names in Arabic.
-   Keyboard navigation reaches every control in a logical RTL order.
-   An automated accessibility check reports no critical issues on the
    home screen, a level, and the parent area.
-   Focus is always visible.

## US-057 --- Respect reduced motion, contrast, and target size

**Priority:** P1 · **Estimate:** 3 points

**User story:** As a parent, I want animations and colors to be
comfortable for my child.

### Acceptance criteria

-   Animations respect `prefers-reduced-motion`.
-   Text and key graphics meet WCAG AA contrast.
-   Touch targets are at least 64 CSS pixels on the child-facing
    screens.

------------------------------------------------------------------------

# 19. Epic L --- Documentation and Release

## US-058 --- Document setup, architecture, and conventions

**Priority:** P1 · **Estimate:** 3 points

**User story:** As a developer, I want clear documentation so that I can
run, test, and extend the app.

### Acceptance criteria

-   The README covers setup, commands, tests, architecture, story
    conventions, agent usage, Story Studio status, offline behavior, and
    known limitations.
-   Every command in the README exists in `package.json`.

## US-059 --- Write the parent and teacher guide

**Priority:** P1 · **Estimate:** 3 points

**User story:** As a parent, I want a short guide in Arabic and English
so that I can help my child use the app.

### Acceptance criteria

-   Explains levels, hints, the parent area, exporting and deleting
    data, and Story Studio.
-   States clearly that no data leaves the device.
-   Reviewed by a native Arabic reader (recorded in the pull request).

## US-060 --- Verify and prepare the release

**Priority:** P1 · **Estimate:** 3 points

**User story:** As the owner, I want a verified release so that I know
what is shipped.

### Acceptance criteria

-   All P0 stories are `Done`; every other story is `Done` or
    `Deferred` with a reason.
-   CI is green on the release commit.
-   The MVP release gates (section 21) and the Story Studio tests
    (section 21) are executed and recorded.
-   The license decision (US-045) matches what is shipped.
-   One observed session with the child and a parent is recorded.

------------------------------------------------------------------------

# 20. Delivery Plan

All 60 stories are scheduled. P0 stories finish by the end of Sprint 4,
which is the MVP gate. Story Studio (Sprint 6) depends on the licensing
decision in US-045.

## 20.1 Dependencies

| Story | Depends on | Story | Depends on |
| --- | --- | --- | --- |
| US-001 | US-039 | US-031 | US-023 |
| US-002 | US-001 | US-032 | US-026 |
| US-003 | US-002, US-026 | US-033 | US-040, US-006 |
| US-004 | US-001 | US-034 | US-022 |
| US-005 | US-022, US-004 | US-035 | US-023 |
| US-006 | US-005 | US-036 | US-009, US-029 |
| US-007 | US-006 | US-037 | US-005 |
| US-008 | US-006 | US-038 | US-015, US-026 |
| US-009 | US-006, US-021 | US-039 | none |
| US-010 | US-004 | US-040 | US-039 |
| US-011 | US-010 | US-041 | US-039 |
| US-012 | US-011 | US-042 | US-041 |
| US-013 | US-009, US-012, US-014 | US-043 | US-040 |
| US-014 | US-011 | US-044 | US-040, US-023 |
| US-015 | US-012 | US-045 | US-039 |
| US-016 | US-013 | US-046 | US-045 |
| US-017 | US-016, US-007 | US-047 | US-046, US-002 |
| US-018 | US-013, US-021 | US-048 | US-046 |
| US-019 | US-018 | US-049 | US-046, US-031 |
| US-020 | US-019 | US-050 | US-048 |
| US-021 | US-006 | US-051 | US-025, US-047 |
| US-022 | US-039 | US-052 | US-003, US-047 |
| US-023 | US-017, US-008, US-022 | US-053 | US-045, US-003 |
| US-024 | US-023 | US-054 | US-049 |
| US-025 | US-023 | US-055 | US-045 (decision B only) |
| US-026 | US-025 | US-056 | US-023 |
| US-027 | US-026 | US-057 | US-004 |
| US-028 | US-023 | US-058 | US-041 |
| US-029 | US-009 | US-059 | US-003 |
| US-030 | US-013 | US-060 | all P0 stories |

## 20.2 Sprints

### Sprint 0 --- Engineering foundation and decisions

**Stories:** US-039, US-040, US-041, US-043, US-042, US-045.\
**Goal:** A verified baseline, CI, conventions, safety checks, and the
license decision recorded.\
**Exit criteria:** Baseline and TypeScript decision recorded; CI green on
the default branch; license decision merged or Story Studio stories
explicitly `Blocked`.

### Sprint 1 --- Core play loop

**Stories:** US-001, US-004, US-022, US-005, US-006, US-007, US-008,
US-021, US-009, US-033.\
**Goal:** A robot moves on a grid, driven by a temporary test control.\
**Exit criteria:** Engine tests pass in CI; limits and reset verified;
Arabic RTL shell reviewed.

### Sprint 2 --- Block editor

**Stories:** US-002, US-010, US-011, US-012, US-014, US-013, US-016,
US-017, US-034.\
**Goal:** The child builds a program from blocks and runs it safely.\
**Exit criteria:** Drag, reorder, delete, run, highlight, stop, and
reset work with touch and mouse; errors are friendly and in Arabic.

### Sprint 3 --- Initial levels and progress

**Stories:** US-023, US-025, US-024, US-015, US-026, US-044.\
**Goal:** Five playable challenges from start to completion, with saved
progress.\
**Exit criteria:** All five levels have reference solutions that pass in
tests; reload restores progress.

### Sprint 4 --- Arabic child experience, privacy, and offline (MVP gate)

**Stories:** US-003, US-028, US-029, US-030, US-031, US-032, US-057.\
**Goal:** An Arabic-guided, private, offline experience.\
**Exit criteria:** Every P0 story is `Done`; the MVP release gates in
section 21 pass; the app reopens offline.

### Sprint 5 --- Advanced learning blocks

**Stories:** US-018, US-019, US-020, US-056.\
**Goal:** Progressive introduction of repetition, conditions, and
sensors.\
**Exit criteria:** Loop and condition tests pass; accessibility check
has no critical issues.

### Sprint 6 --- Story Studio

**Stories:** US-046, US-048, US-049, US-047, US-050, US-053, US-054,
US-052, US-051. (US-055 instead, only if US-045 decided B.)\
**Goal:** The vendored animation tool opens offline from MiniBot with
adult-assisted Arabic guidance and correct notices.\
**Exit criteria:** Network audit shows no external requests; Robot Lab
progress unchanged by a Story Studio session; licenses page complete.

### Sprint 7 --- Lab, expansion, and release

**Stories:** US-035, US-036, US-037, US-038, US-027, US-058, US-059,
US-060.\
**Goal:** Free-play lab, customization, backup, documentation, and a
verified release.\
**Exit criteria:** The release checklist (US-060) is complete and every
story is `Done` or `Deferred` with a reason.

## 20.3 How the agent works through the plan

1.  Work sprints in order. Within a sprint, take stories in the order
    listed, skipping any whose dependencies are not satisfied.
2.  Each story: branch, implement, test, commit, push, open its own pull
    request, update the status file.
3.  The backlog is **clean** when every story is `Done` or `Deferred`
    with a recorded reason, no story is `Blocked` without a recorded
    human decision, and CI is green on the default branch.
4.  A session may end before the backlog is clean. The status file lets
    the next session resume at the next eligible story.

------------------------------------------------------------------------

# 21. Test Plan and Release Criteria

## Functional tests

-   Execute a valid program from start to finish.
-   Verify block execution order.
-   Test wall collisions and grid boundaries.
-   Stop during an animation.
-   Reset during and after execution.
-   Reload the page and restore progress.
-   Import valid and corrupt save files.
-   Verify completed and incomplete levels.

## Arabic UI tests

-   Verify RTL on home, editor, and settings screens.
-   Check numbers and symbols mixed with Arabic text.
-   Ensure icons do not overlap labels.
-   Test phone, tablet, and desktop viewports.
-   Confirm visual robot directions are not accidentally mirrored by
    RTL.

## Child usability test

With a parent present, observe: - Can the child start the first level? -
Can the child drag a block into the workspace? - Does the child
understand that block order changes robot behavior? - Can the child
retry without assistance? - Does the child understand the visual hint? -
Does the experience remain encouraging when the first attempt is
incorrect?

## Story Studio tests

-   The vendored build opens from the home screen with the network
    disabled.
-   The pinned commit in `UPSTREAM.md` matches the build manifest.
-   No external network request occurs during a Story Studio session.
-   Robot Lab progress, settings, and saved programs are identical
    before and after a Story Studio session.
-   MiniBot and Story Studio storage keys and service-worker scopes do
    not collide.
-   With Arabic selected, the main editor screens render right to left
    without blocking the Simple-mode activity flow.
-   The licenses page lists every third-party component with its
    license.

## MVP release gates

-   All P0 stories are implemented and tested.
-   The first five levels can be completed.
-   No critical errors occur in core user flows.
-   The app works offline once its files are available locally.
-   RTL layout is correct.
-   Execution can be stopped and reset safely.
-   The app never executes arbitrary source code from program data.
-   Setup and test instructions are documented.

------------------------------------------------------------------------

# 22. Risks and Open Decisions

  -----------------------------------------------------------------------
  Risk or decision                    Recommendation
  ----------------------------------- -----------------------------------
  Blockly or custom editor?           Start with Blockly and customize
                                      it; build a custom editor only if
                                      real usability limitations are
                                      found

  Canvas or DOM for the world?        Choose one for the MVP and avoid
                                      mixing approaches without a clear
                                      need

  Modern Standard Arabic or Tunisian  Use simple Modern Standard Arabic
  dialect?                            for text; consider Tunisian Arabic
                                      audio as a later option

  Audio and narration                 Bundle reliable local audio for
                                      core levels; do not make TTS a
                                      requirement for gameplay

  Progress storage                    Use `localStorage` for simple
                                      settings/progress and `IndexedDB`
                                      for larger projects

  Unbounded loops                     Enforce execution-step limits and
                                      reliable cancellation

  Reading ability                     Use icons, short audio
                                      instructions, and demonstrations

  RTL versus robot direction          Separate UI layout direction from
                                      the world's coordinate system

  English technical text leaking into Keep developer identifiers and
  child UI                            diagnostics separate from
                                      localized, child-facing strings
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Additional risks and decisions (version 2.0)

  ------------------------------------------------------------------------
  Risk or decision                    Recommendation
  ----------------------------------- ------------------------------------
  GPL-3.0-or-later copyleft           Decide in US-045 before bundling.
                                      Recommended: license MiniBot Studio
                                      under GPL-3.0-or-later. Seek legal
                                      review for ambiguous points.

  Professional editor too complex     Adult-assisted entry (US-047) and
  for a five-year-old                 activity cards (US-050); do not
                                      promise features the build lacks.

  Arabic translation quality in the   Review in US-048; record defects;
  editor is unreviewed                mitigate with cards.

  Shared browser storage and          Test collisions and scopes in
  service-worker scopes               US-049; keep MiniBot keys
                                      namespaced.

  Editor needs WebGPU or a fallback   Verify the Canvas fallback on the
                                      target device in US-049.

  Upstream changes after the pinned   Re-pin deliberately in a story;
  commit                              never track `main` automatically.

  Large build size and unverified     Measure in US-046 and record in the
  build network use                   ADR.

  Copilot agent cannot run forever    Resume from the status file; assign
                                      one story at a time (see agent
                                      file).
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# 23. MVP Definition

The MVP is ready when the child can:

1.  Open the application in Arabic.
2.  Start a simple level.
3.  See a robot on a grid with a clear goal.
4.  Drag Start, Move Forward, and Turn blocks into the workspace.
5.  Reorder and delete blocks.
6.  Run a program and see the active block highlighted.
7.  Stop execution and reset the level.
8.  Complete five progressively harder levels.
9.  Receive a hint and positive feedback.
10. Close and reopen the app without losing locally saved progress.

**Product principle:** Do not add advanced features at the expense of
clarity. A child successfully building a small program and understanding
its outcome is more valuable than a large number of blocks or effects.

------------------------------------------------------------------------

# 24. Technical References

-   Blockly: https://developers.google.com/blockly
-   MDN --- HTML: https://developer.mozilla.org/docs/Web/HTML
-   MDN --- CSS logical properties:
    https://developer.mozilla.org/docs/Web/CSS/CSS_logical_properties_and_values
-   MDN --- Web Storage API:
    https://developer.mozilla.org/docs/Web/API/Web_Storage_API
-   MDN --- IndexedDB API:
    https://developer.mozilla.org/docs/Web/API/IndexedDB_API

Consult official documentation when choosing library versions and local
bundling approaches.
-   StykAnimate (pinned commit in `third_party/stykanimate/UPSTREAM.md`):
    https://github.com/filippocalippo/StykAnimate-App
-   GNU GPL v3: https://www.gnu.org/licenses/gpl-3.0.html
-   GitHub custom agents configuration:
    https://docs.github.com/en/copilot/reference/custom-agents-configuration
