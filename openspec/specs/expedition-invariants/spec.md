# Expedition Invariants Specification

## Purpose

確保遠征系統在出發、探索、戰鬥、返航與陣亡時，武器、彈藥與物資皆保持嚴格的數量守恆與狀態重置一致性。

## Requirements

### Requirement: Ammunition and weapon conservation
The system SHALL deduct carried ammunition and reserve equipped weapons upon departing for an expedition, track consumption in combat, and synchronize remaining supplies upon return.

#### Scenario: Firing rifle in combat
- **WHEN** player attacks with a rifle in wilderness combat
- **THEN** expedition bullets count SHALL decrement by 1 and base settlement resources SHALL reflect consumed bullets upon return

#### Scenario: Returning alive from expedition
- **WHEN** player returns to the village alive
- **THEN** all remaining meat, torches, and carried loot SHALL be credited to settlement inventory and expedition active state set to false

### Requirement: Consistent wilderness defeat reset
The system SHALL completely reset the expedition state and restore the player's coordinate to the spawn point when defeated in the wilderness.

#### Scenario: Player dies from starvation or combat
- **WHEN** player HP reaches zero during an expedition
- **THEN** system SHALL reset expedition active status to false, clear combat enemy and carried loot, and reset coordinates back to spawn point
