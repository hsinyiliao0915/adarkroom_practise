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

### Requirement: Water and health survival loop
The system SHALL deduct 1 water per movement step, penalize player with health damage when dehydrated, and allow consuming cured meat to heal HP.

#### Scenario: Step with water remaining
- **WHEN** player moves one tile and water is greater than 0
- **THEN** system SHALL decrement water by 1 without consuming meat or health

#### Scenario: Step while dehydrated
- **WHEN** player moves one tile and water is 0
- **THEN** system SHALL decrement player HP by 2 without consuming cured meat as water replacement

#### Scenario: Eating cured meat to restore health
- **WHEN** player consumes cured meat while injured
- **THEN** system SHALL decrement expedition cured meat by 1 and restore player HP by 10 points up to maximum HP

### Requirement: Outpost water replenishment
The system SHALL immediately restore the player's water container to its maximum capacity upon entering an established outpost or safe haven.

#### Scenario: Entering cleared outpost
- **WHEN** player steps onto a cleared outpost tile or spawn point
- **THEN** system SHALL replenish water to maxWater

### Requirement: Torch exploration consumption
The system SHALL require and deduct a torch when exploring dark subterranean landmarks.

#### Scenario: Scavenging cave with torch
- **WHEN** player scavenges an unlit cave with at least 1 torch
- **THEN** system SHALL deduct 1 torch and permit clearing landmark loot

#### Scenario: Scavenging cave without torch
- **WHEN** player attempts to scavenge an unlit cave with 0 torches
- **THEN** system SHALL reject exploration and notify the player of pitch darkness
