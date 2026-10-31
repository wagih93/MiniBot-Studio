# Ubiquitous language

One word per concept, used identically in the backlog, the code, the tests, the PRs and the UI copy. When you meet a synonym in code, rename it to the term below. When a new concept appears, add it here in the same PR.

Child-facing Arabic wording lives in `js/shared/i18n/ar.js`; this file fixes the **English code names**.

| Term | Meaning | Code names | Avoid in code |
| --- | --- | --- | --- |
| **Level** | One playable puzzle: a world layout, the robot's start, the allowed blocks, objectives, execution limits and hints. Pure data. | `Level`, `levelId`, `level-001` | challenge, mission, stage |
| **Objective** | A condition that completes a level (reach the goal, collect all collectibles). | `Objective`, `ObjectiveProgress`, `objective-tracker.js` | challengeState, successCondition (rename) |
| **World** | The grid of a level with its cells. | `World`, `rows`, `columns` | map, board |
| **Cell** | One square of the world: empty, obstacle, goal or collectible. | `Cell`, `CellKind` | tile, square |
| **Obstacle** | A cell the robot cannot enter. | `obstacle` | wall (reserve "wall" for the grid edge only if the UI needs it) |
| **Goal** | The cell the robot must reach. | `goal` | target, destination |
| **Collectible** | An object on a cell the robot collects by entering it (the star). | `collectible` | goal-as-collectible, item, pickup |
| **Robot** | The character controlled by programs. Has a position and a heading. | `Robot`, `RobotState` | bot, player |
| **Heading** | The direction the robot faces: `north`, `east`, `south`, `west`. Never mirrored by RTL. | `Heading` | direction (use for left/right turn only: `TurnDirection`) |
| **Block** | A draggable piece in the toolbox, identified by a block type. | `BlockType`, `BlockDefinition`, `Toolbox` | command, button |
| **Block type** | The kind of a block: `start`, `moveForward`, `turnLeft`, `turnRight`, later `repeat`, `if`. | `blockType` | op, kind |
| **Program** | The ordered list of program steps the child built for a level. | `Program` | script, code, sequence |
| **Program step** | One placed block inside a program, with a unique id. | `ProgramStep`, `stepId` | instruction (see below), item |
| **Instruction** | The executable form of a valid program, produced by compiling it for a run. | `Instruction`, `compileProgram` | command |
| **Run** | One execution of a program on a level's world. | `Run`, `RunController`, `runProgram` | session, play-through |
| **Run status** | `idle`, `running`, `stopped`, `completed`, `failed`. | `RunStatus` | state (too vague) |
| **Execution limits** | Hard bounds on a run: maximum steps, loop count, nesting depth, duration. | `ExecutionLimits` | config, caps |
| **Progress** | Which levels the child has completed. | `LearningProgress`, `ProgressRepository` | save-data, state |
| **Local app data** | On-device data the app keeps locally (progress, saved programs, tutorial completion, parent sound setting). | `clearAppData`, `local-storage-app-data-repository.js` | profile, personal data |
| **Learning concept** | The idea practiced by a level (for example sequencing, directions, repetition). | `learningConcept`, `learningConcepts` | score, rank |
| **Saved program** | A program stored for a level so it can be restored. | `SavedProgram`, `ProgramRepository` | draft, store |
| **Hint** | A short help message shown after failed attempts, in progressive tiers. | `Hint`, `hintTier` | tip, clue |
| **Parent area** | The adult-only area for settings, data export and reset. | `parent-area` | admin, settings page |
| **Story Studio** | The animation workspace, separate from Robot Lab. | `story-studio` | animation-lab |
| **Robot Lab** | The environment where the child builds and runs programs. | `robot-lab` | game, simulator (the simulator is a slice inside Robot Lab) |
| **Offline support** | Service-worker-based caching that keeps Robot Lab playable without network after the first load. | `registerOfflineSupport`, `service-worker.js` | offline mode, PWA cache |

## Rules

1. A term has one code spelling per form: `Level` (type), `level` (value), `levelId`, `level-001` (file or id).
2. Do not invent suffixes such as `Manager`, `Helper`, `Util` or `Handler` for domain concepts. Name what it is (`ObjectiveTracker`, `ProgramValidator`).
3. UI copy in Arabic may use friendly words; the code keeps these names.
4. A static check (`npm run language:check`, US-067) fails the build when a banned synonym from the "Avoid" column appears as an identifier. The check lists exceptions explicitly.
