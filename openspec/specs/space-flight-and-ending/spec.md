## Purpose

規範太空升空閃避障礙小遊戲、飛船即時操控、動態障礙物碰撞損耗、引力逃逸勝利條件以及全破通關敘事結算畫面。

## Requirements

### Requirement: Space flight ascension flight mechanics
The system SHALL initiate a real-time atmospheric ascent sequence upon launch, allowing player navigation while obstacles descend.

#### Scenario: Navigating starship during ascent
- **WHEN** player inputs navigation commands (arrow keys or WASD) during space flight
- **THEN** system SHALL smoothly update horizontal position within boundary constraints

#### Scenario: Progressing ascent altitude
- **WHEN** flight sequence is active over time
- **THEN** altitude SHALL advance at a rate proportional to the installed thruster engine level

### Requirement: Obstacle collision and hull damage
The system SHALL generate descending space debris and asteroids that inflict damage upon collision with the starship hull.

#### Scenario: Colliding with space obstacle
- **WHEN** starship bounding coordinates intersect an obstacle
- **THEN** system SHALL deduct hull hit points and provide visual impact feedback

### Requirement: Atmospheric crash and safe recovery
The system SHALL gracefully return the player to the surface settlement if hull integrity is exhausted before reaching escape altitude.

#### Scenario: Starship hull reaches zero
- **WHEN** hull health drops to 0 during flight
- **THEN** system SHALL terminate the flight sequence, notify player of crash landing, return player to room, and preserve installed ship upgrade levels

### Requirement: Orbital escape victory and narrative epilogue
The system SHALL trigger the official game victory and narrative epilogue when the starship reaches target escape altitude.

#### Scenario: Reaching orbital escape altitude
- **WHEN** starship altitude reaches escape threshold (1000m)
- **THEN** system SHALL declare game victory, freeze danger, and display the ending epilogue narrative with survival statistics and restart options
