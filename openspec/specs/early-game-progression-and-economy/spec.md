# Early Game Progression and Economy Specification

## Purpose

規範小黑屋前期開局、手工採集過渡、陷阱誘餌、指南針解鎖與漸進式介面揭示機制，確保初期探索節奏平滑且不存在資源死鎖。

## Requirements

### Requirement: Compass acquisition without deadlock
The system SHALL allow players to acquire the compass using early hunt and trap materials without requiring iron deposits, preventing deadlocks prior to map access.

#### Scenario: Crafting compass with early hunt materials
- **WHEN** player constructs or acquires the compass using scales and teeth
- **THEN** system SHALL not require iron, deduct specified trap materials, and unlock the world map tab

### Requirement: Cart early room construction
The system SHALL allow constructing the cart early with modest wood costs, significantly increasing manual wood gathering yields to bridge the gap before village automation.

#### Scenario: Crafting cart with wood
- **WHEN** player builds cart using 30 wood
- **THEN** system SHALL register cart possession and increase manual wood gathering yield to 50

### Requirement: Trap baiting and rare harvest boost
The system SHALL allow players to bait traps with meat, dramatically boosting the chance of catching teeth and scales on trap checks.

#### Scenario: Checking traps with bait applied
- **WHEN** player checks traps while trap bait meat is active
- **THEN** system SHALL consume bait meat and apply boosted drop rates for teeth and scales

### Requirement: Progressive building and job reveal
The system SHALL progressively reveal buildings and worker jobs as prerequisite conditions or materials are encountered, maintaining atmospheric mystery.

#### Scenario: Hiding advanced worker jobs until prerequisite landmarks or buildings exist
- **WHEN** player views the village screen before discovering advanced facilities or mines
- **THEN** system SHALL hide unrevealed job rows rather than displaying empty or locked placeholders
