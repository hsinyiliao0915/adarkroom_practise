## MODIFIED Requirements

### Requirement: Progressive building and job reveal
The system SHALL progressively reveal buildings and worker jobs as prerequisite conditions or materials are encountered, maintaining atmospheric mystery and separating Room (生火間) building construction from Outside (靜謐森林) gathering.

#### Scenario: Hiding advanced worker jobs until prerequisite landmarks or buildings exist
- **WHEN** player views the village screen before discovering advanced facilities or mines
- **THEN** system SHALL hide unrevealed job rows rather than displaying empty or locked placeholders

#### Scenario: Constructing early buildings inside the Room
- **WHEN** the stranger awakens as builder inside the Room (生火間)
- **THEN** system SHALL render available building buttons (such as traps and carts) within the Room view under a dedicated building section

## ADDED Requirements

### Requirement: Room and Outside functional separation
The system SHALL strictly separate internal fire management and building projects from external gathering and traps. Fire control and builder projects SHALL reside in the Room (生火間), while wood gathering and trap checking SHALL reside in Outside (靜謐森林).

#### Scenario: Unlocking Outside tab upon stoking fire or wood need
- **WHEN** the player stokes the fire or available firewood drops below initial reserve
- **THEN** system SHALL unlock the Outside (靜謐森林) tab and allow switching between Room and Outside

#### Scenario: Gathering wood and checking traps in Outside tab
- **WHEN** player accesses the Outside (靜謐森林) tab
- **THEN** system SHALL render wood gathering and trap inspection actions within this view with visual cooldown progress

### Requirement: Compact auto-sizing stores fieldset
The system SHALL hide stores/inventory entirely at game start and reveal a compact, auto-sizing fieldset box only when resources are acquired, expanding row-by-row as new materials are discovered.

#### Scenario: Opening game with zero resources
- **WHEN** a new game starts with unlit fire and zero resources
- **THEN** system SHALL not render the stores/inventory panel or wood placeholders

#### Scenario: Revealing compact stores on fire ignition
- **WHEN** player lights the fire and receives initial wood
- **THEN** system SHALL reveal a compact stores fieldset sized strictly to the discovered resources without extra empty vertical space
