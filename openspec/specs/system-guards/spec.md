# System Guards Specification

## Purpose

在系統邏輯層（System Domain Layer）強制執行建築建造、物品製作與工人指派之前置條件驗證，防止非法的底層狀態變更。

## Requirements

### Requirement: Building and craft unlock guards in system layer
The system SHALL verify unlock requirements in CraftSystem and VillageSystem before deducting costs or creating entities, rejecting operations if prerequisites are unmet.

#### Scenario: Attempting to craft locked recipe via system
- **WHEN** craft() is called for an item whose unlockRequirement predicate returns false
- **THEN** system SHALL reject the crafting action and leave resources untouched

#### Scenario: Attempting to build locked building via system
- **WHEN** build() is called for a building whose unlockRequirement predicate returns false
- **THEN** system SHALL reject the building action and emit a warning

### Requirement: Worker prerequisite validation
The system SHALL enforce that villagers can only be assigned to jobs if the required building has been constructed.

#### Scenario: Assigning worker without prerequisite building
- **WHEN** assignWorker() is called for a job requiring a building that is not yet built (count is zero)
- **THEN** system SHALL reject the assignment and retain previous worker counts
