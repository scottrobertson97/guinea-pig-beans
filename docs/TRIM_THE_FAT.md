# Trim The Fat Backlog

## Summary

This backlog is for cutting shallow surfaces, collapsing duplicate progression, and forcing every remaining system to earn its space. The goal is not to make Guinea Pig Beans smaller for its own sake. The goal is to make the cozy management loop feel sharper, with fewer menus and more meaningful relationships between Contracts, pigs, habitat, automation, rare bean recipes, and Wisdom.

Guiding rule: if a system cannot feed Contracts, pig requests, events, visible cage behavior, or permanent run identity, it should be cut, merged, or rewritten.

Progression rule: if a system is worth keeping but does not matter on a fresh run, hide its dock surface until existing progress makes it actionable. Early play should show the care loop first, then reveal Furniture, Abilities, Recipes, Wisdom, automation operations, habitat care, and specializations as the player earns reasons to use them.

## Tickets

### TTF-001: Remove Quests From The Main Goals Surface

Type: System cut

Priority: P0

Status: First pass complete

Description: Quests duplicate what Contracts and unlock pacing already do. Remove the visible quest checklist from the primary goals surface and convert completed quest beats into log/record messages.

Acceptance criteria:

- The Contracts modal no longer shows a separate quest list.
- Existing quest completion still grants any intended milestone feedback or unlock pacing.
- Completed quest beats appear in Log or Records instead of competing with Contracts.
- No player action requires opening a quest checklist to understand what to do next.
- Old saves with completed quest ids still load safely.

Implementation notes:

- Preserve milestone state internally only if it still gates achievements, records, or tutorial pacing.
- Prefer cutting display first before deleting persistence fields.
- First pass removed the quest list from Goals while preserving completion state and Log messages.

### TTF-002: Fold Achievements Into Log Records

Type: System move

Priority: P0

Status: First pass complete

Description: Achievements are flavorful, but as a standalone list they add another progression surface without meaningful decisions. Move achievements into the Log as Records or Notable Moments.

Acceptance criteria:

- The Contracts modal no longer shows an achievements list.
- Log contains a Records area or equivalent milestone history.
- Achievement flavor still appears when earned.
- Dock attention for achievements is routed through Log, not Contracts.
- Existing achievement state remains save-compatible.

Implementation notes:

- Keep humor in the record text, not in a separate checklist UI.
- Consider a compact "Recent Records" block above the chronological log.
- First pass moved completed quest and achievement beats into Log Records and routed milestone attention through Log instead of Goals.

### TTF-003: Collapse Passive Late-Game Buttons Into Existing Paths

Type: System cut

Priority: P1

Status: First pass complete

Description: One-off "buy once, passive forever" unlocks add surface area without adding decisions. Collapse Hay Dimension, Squeak Choir, Cavy Council, and Bean Singularity into stronger existing paths unless each gains an active choice or contract hook.

Acceptance criteria:

- Each passive late-game unlock is either merged into an existing progression path or given a repeatable decision.
- Hay Dimension becomes an advanced Better Hay/care upgrade or habitat upgrade.
- Squeak Choir becomes an Ability or Wisdom specialization.
- Cavy Council becomes a herd-size contract chain or Herd specialization.
- Bean Singularity becomes a rare bean recipe experiment with clear risk/reward.
- No standalone late-game button remains if it only grants a passive modifier.

Implementation notes:

- This can be implemented in slices. Do not delete all systems in one pass if save migration becomes risky.
- Preserve player-facing effects by moving them into fewer, clearer homes.
- First slice removed the standalone Hay Dimension button and made it open automatically as the Better Hay level 7 capstone.
- Second slice removed the standalone Squeak Choir button and folded passive Squeak generation plus the ability-cost discount into Chorus Training Wisdom; old saves keep their choir benefit through the legacy flag.
- Third slice removed the standalone Cavy Council unlock button, seats the council automatically for 8-pig herds or legacy saves, and adds a Council Session Contract that advances when a decree is passed.
- Fourth slice removed the standalone Bean Singularity button and moved its strange-bean gravity into a Singularity Experiment recipe with a repeatable Compost/Squeak action; legacy saves hydrate the recipe from the old flag.
- First pass complete: no standalone passive late-game button remains.

### TTF-004: Promote Automation Out Of Shop

Type: System move

Priority: P1

Status: First pass complete

Description: Automation directives are operational choices, not shop purchases. Move directive controls out of Shop and into the section that best owns automation decisions.

Acceptance criteria:

- Shop contains purchases and upgrades, not ongoing automation mode controls.
- Automation directives appear under Furniture, Build, or a dedicated Automation surface.
- Current directive remains visible wherever automation is managed.
- Roomba and Litter Tray targeting behavior does not regress.
- Contracts that require automation directives still advance.

Implementation notes:

- Preferred first move: put directives in Furniture near Litter Tray, Furniture Care, and Cage Ecology.
- Only add a new Automation dock button if automation becomes large enough to justify it.
- First pass moved directive controls from Shop into Furniture and shifted dock availability there.

### TTF-005: Consolidate Shop Into Growth And Build Decisions

Type: UX consolidation

Priority: P2

Status: First pass complete

Description: Shop currently mixes pigs, care upgrades, automation, cage growth, legendary pigs, and late care systems. Tighten it so Shop is about growth/build purchases, while ongoing decisions live elsewhere.

Acceptance criteria:

- Shop has fewer categories and a clearer scan order.
- Ongoing toggles or directives are moved out.
- Basic growth purchases remain easy to find: adopt pig, care upgrades, scoop, cage, first automation.
- Advanced unlocks are grouped under a clear subsection or moved to their owning section.
- Dock badges still point players to actionable purchases.

Implementation notes:

- This ticket pairs well with TTF-004 and TTF-003.
- Avoid hiding early-run purchases behind late-game language.
- First pass grouped Shop into Herd Growth and Cage Growth, kept first automation purchase there, and moved Fuel Automation into Furniture with Automation Directives.

### TTF-006: Replace Wisdom Checklist With Specializations

Type: System rewrite

Priority: P2

Status: First pass complete

Description: The current Wisdom tree is a non-exclusive checklist. Replace or extend it with a smaller set of caretaker philosophies that shape future runs in distinct ways.

Acceptance criteria:

- After the early Wisdom tree, the player chooses between distinct specializations.
- Choices are mutually exclusive or meaningfully limited per run/prestige tier.
- Each specialization changes multiple systems, not just one number.
- Example philosophies exist: Gentle Care, Automation Steward, Rare Bean Alchemy.
- Wisdom UI explains the tradeoff before selection.

Implementation notes:

- This should become the long-term home for effects like Squeak Choir or rare-bean mastery if those are cut as standalone buttons.
- Keep early Wisdom perks until specializations can replace enough value.
- First pass kept the early Wisdom tree and added one mutually exclusive Caretaker Philosophy after tier-3 Wisdom: Gentle Care, Automation Steward, or Rare Bean Alchemy.

### TTF-007: Make Contracts The Only Active Goal Layer

Type: System consolidation

Priority: P1

Status: First pass complete

Description: Contracts should be the one active goal layer. Pig requests can remain as personal favors, but quests, passive checklist goals, and late-game tasks should route through Contracts or Records.

Acceptance criteria:

- The active player-facing objective area only shows Contracts.
- Pig requests remain in Care as short personal favors.
- Late-game tasks are introduced through contract offers or section copy, not another checklist.
- Contract templates cover early care, habitat, automation, rare bean recipes, herd, and Wisdom-adjacent goals.
- Completing a Contract produces clear HUD and Log feedback.

Implementation notes:

- Add more contract templates only after removing duplicate goal surfaces.
- Avoid recreating quests under a different name.
- First pass keeps pig requests in Care, keeps milestones as Log Records, and adds a Wisdom-adjacent Caretaker Philosophy Contract.

### TTF-008: Establish A No-Orphan-System Rule

Type: Design rule

Priority: P0

Status: Complete

Description: Add an explicit rule to the design docs: every new or surviving system must connect to at least two other systems and one visible feedback channel.

Acceptance criteria:

- [DESIGN_DOC.md](DESIGN_DOC.md) includes a no-orphan-system principle.
- [FEATURE_PROGRESS.md](FEATURE_PROGRESS.md) or future tickets call out system connections before implementation.
- A new feature is considered incomplete if it only changes hidden state.
- Each retained system connects to at least two of: Contracts, pig requests, events, habitat, automation, rare bean recipes, Wisdom, Log, or cage visuals.
- This rule is referenced when cutting or merging future systems.

Implementation notes:

- This is a documentation guardrail, but it should influence every future ticket.
- Added as a design principle and future-ticket checklist: retained systems must connect to at least two other systems and one visible feedback channel.

## Recommended Implementation Order

1. TTF-001 and TTF-002: Move quests and achievements out of the active goal surface.
2. TTF-004: Move automation directives out of Shop.
3. TTF-003: Collapse passive late-game buttons into existing paths.
4. TTF-007: Make Contracts the only active goal layer.
5. TTF-006: Replace the late Wisdom checklist with specializations.

## Cut Criteria

- Cut it if it is only a passive bonus and has no player decision.
- Move it if it belongs to an existing section more than it belongs to its own surface.
- Merge it if it duplicates Contracts, pig requests, records, or unlock pacing.
- Hide it until reveal if the system is good but currently appears before the player has a decision to make.
- Keep it if it changes visible cage behavior, creates a real tradeoff, or gives Contracts better texture.
