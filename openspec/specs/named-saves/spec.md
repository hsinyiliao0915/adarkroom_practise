# Named Saves Specification

## Purpose

提供玩家自訂名稱建立多份存檔進度、檢視並切換不同存檔槽位，以及在保留歷史存檔的前提下開啟全新遊戲的完整儲存管理機制。

## Requirements

### Requirement: Named save profile creation and overwrite
The system SHALL allow players to save the current game with a custom profile name, storing it as a discrete save slot with metadata (id, name, timestamp, day count, population), or overwrite an existing chosen slot.

#### Scenario: Creating a newly named save
- **WHEN** player specifies a custom name and triggers save
- **THEN** system SHALL generate a unique slot id, register it in the save index, and persist the validated game state

#### Scenario: Overwriting an existing named save
- **WHEN** player chooses an existing save slot to overwrite
- **THEN** system SHALL update that slot's payload and timestamp while preserving the slot identifier

### Requirement: New game creation without destroying existing saves
The system SHALL allow players to start a fresh game with initial state without deleting other saved profiles.

#### Scenario: Starting a new game
- **WHEN** player selects "New Game" and confirms
- **THEN** system SHALL reset active game state to initial parameters, generate a new save profile identifier, and leave all existing save slots intact in storage

### Requirement: Save slot loading and management
The system SHALL provide a queryable list of all existing save profiles with summary metadata, and allow loading any valid profile or deleting obsolete slots.

#### Scenario: Loading a saved profile
- **WHEN** player selects an existing profile from the save list
- **THEN** system SHALL validate the slot data, load it into the active game state, and refresh all active UI views

#### Scenario: Deleting a save slot
- **WHEN** player deletes a specific save slot
- **THEN** system SHALL remove the slot data and deregister it from the save index
