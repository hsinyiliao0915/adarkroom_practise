## Purpose

規範外星巡航艦的發現解鎖、星艦分頁開啟、合金修復與船體外殼及推進引擎的強化升級機制，作為通往星際逃逸前置準備。

## Requirements

### Requirement: Starship landmark discovery and tab unlock
The system SHALL unlock the dedicated ship management tab once the player discovers and clears the crashed starship landmark on the world map.

#### Scenario: Clearing crashed starship landmark
- **WHEN** player scavenges and clears the crashed starship landmark at coordinates (32, 30)
- **THEN** system SHALL unlock the ship tab and make it visible in the top navigation bar

### Requirement: Hull reinforcement upgrade
The system SHALL permit upgrading starship hull durability using alien alloy and steel, increasing total hull hit points for atmospheric ascent.

#### Scenario: Upgrading starship hull with sufficient materials
- **WHEN** player purchases a hull upgrade with required alien alloy and steel
- **THEN** system SHALL deduct the resources, increment hull level, and raise maximum ship hull health

#### Scenario: Upgrading hull with insufficient materials
- **WHEN** player attempts hull upgrade lacking required alloy or steel
- **THEN** system SHALL reject the upgrade and emit an informative shortage message

### Requirement: Thruster engine upgrade
The system SHALL permit upgrading starship engine propulsion using alien alloy, increasing ascent speed and reducing debris exposure time during flight.

#### Scenario: Upgrading thruster engine
- **WHEN** player purchases an engine upgrade with required alien alloy
- **THEN** system SHALL deduct resources and increment engine level, increasing climb rate during flight

### Requirement: Launch readiness validation
The system SHALL permit initiating the launch sequence only when the starship has been repaired to a minimal baseline readiness.

#### Scenario: Attempting launch when starship hull is at level 0
- **WHEN** player attempts to launch before repairing the hull to at least level 1
- **THEN** system SHALL disable the lift off action and indicate that the hull structure cannot survive liftoff
