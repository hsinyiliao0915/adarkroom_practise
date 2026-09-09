# Wilderness Fog and Landmarks Specification

## Purpose

提供符合經典小黑屋設定的動態迷霧視野、地標前哨站轉化與礦坑肅清連動機制，確保大地圖探索具有深層推進感與地標發現樂趣。

## Requirements

### Requirement: Fog of war and landmark visibility
The system SHALL conceal undiscovered terrain and landmarks in darkness, revealing landmarks only when they fall within the player's active visibility radius or are visited.

#### Scenario: Rendering unexplored landmark outside vision
- **WHEN** a landmark is beyond the player's vision radius and unvisited
- **THEN** system SHALL render it identically to unvisited wilderness fog without distinctive marker symbols

#### Scenario: Revealing landmark within vision
- **WHEN** player moves within vision radius of an undiscovered landmark
- **THEN** system SHALL display the landmark symbol and register its discovery in exploration logs

### Requirement: Landmark clearing and outpost conversion
The system SHALL permit players to clear discovered landmarks and transform abandoned settlements or outposts into permanent water-replenishing forward bases.

#### Scenario: Clearing an outpost
- **WHEN** player explores and cleans an outpost landmark
- **THEN** system SHALL record the landmark as cleared, grant landmark loot, and designate the tile as a permanent outpost

#### Scenario: Visiting established outpost
- **WHEN** player visits a cleared outpost
- **THEN** system SHALL display the outpost status and automatically refill the player's canteen

### Requirement: Mine liberation and village mining job prerequisites
The system SHALL require that iron and coal mines on the world map are discovered and cleared before villagers can be assigned to mining jobs.

#### Scenario: Assigning iron miner before clearing iron mine
- **WHEN** player attempts to assign an iron miner while the world iron mine remains uncleared
- **THEN** system SHALL reject the assignment and log that iron deposits remain undiscovered or overrun

#### Scenario: Assigning iron miner after clearing iron mine
- **WHEN** the iron mine landmark is cleared and workshop exists
- **THEN** system SHALL permit assigning villagers to iron miners
