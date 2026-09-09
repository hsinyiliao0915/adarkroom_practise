## MODIFIED Requirements

### Requirement: Progressive building and job reveal
The system SHALL progressively reveal buildings and worker jobs as prerequisite conditions or materials are encountered, strictly adhering to the authentic A Dark Room progression state machine.

#### Scenario: Hiding advanced worker jobs until prerequisite landmarks or buildings exist
- **WHEN** player views the village screen before discovering advanced facilities or mines
- **THEN** system SHALL hide unrevealed job rows rather than displaying empty or locked placeholders

#### Scenario: Constructing early buildings inside the Room
- **WHEN** the stranger awakens as builder inside the Room (生火間)
- **THEN** system SHALL render available building buttons (such as traps and carts) within the Room view under a dedicated building section

## ADDED Requirements

### Requirement: Authentic opening state machine and delayed forest unlock
The system SHALL replicate the exact opening sequence of A Dark Room: starting with zero tabs and hidden stores, transitioning through stranger arrival, and only revealing stores (wood: 4) and the forest tab when firewood runs low after the stranger collapses.

#### Scenario: Game start with dead fire
- **WHEN** player starts a fresh game
- **THEN** system SHALL display only the Room with unlit fire, hidden stores panel, and no location tabs

#### Scenario: Fire ignition and light spill
- **WHEN** player lights the fire
- **THEN** system SHALL set fire to burning, emit the light spill narrative message, switch button to stoke fire, and begin the stranger approach sequence without immediately granting wood or unlocking forest

#### Scenario: Stranger arrival and forest unlock
- **WHEN** the stranger stumbles in and collapses in the corner
- **THEN** system SHALL schedule forest unlock, set initial wood to 4, display the howling wind and wood depletion messages, reveal the stores panel, and unlock the Outside (靜謐森林) tab

### Requirement: Room and Outside functional separation
The system SHALL strictly separate internal fire management and building projects from external gathering and traps. Fire control and builder projects SHALL reside in the Room (生火間), while wood gathering and trap checking SHALL reside in Outside (靜謐森林).

#### Scenario: Gathering wood and checking traps in Outside tab
- **WHEN** player accesses the Outside (靜謐森林) tab
- **THEN** system SHALL render wood gathering and trap inspection actions within this view with visual cooldown progress

### Requirement: Compact auto-sizing stores fieldset
The system SHALL hide stores/inventory entirely until the forest is unlocked, and reveal a compact, auto-sizing fieldset box only when resources exist, expanding row-by-row as new materials are discovered.

#### Scenario: Opening game with zero resources
- **WHEN** a new game starts with unlit fire and undiscovered stores
- **THEN** system SHALL not render the stores/inventory panel or placeholders
