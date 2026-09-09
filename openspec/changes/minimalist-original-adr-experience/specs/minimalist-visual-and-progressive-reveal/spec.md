## Purpose

規範《小黑屋》極簡黑底純文字視覺規範、原版按鈕外觀與冷卻動畫、庫存動態過濾顯隱機制、開局按鈕漸進式揭示流程，以及適配直向手機的操作排版。

## ADDED Requirements

### Requirement: Minimalist deframing and pure black background
The system SHALL eliminate heavy panel borders, container background fills, and software-like rectangular boxes, allowing all narrative text, buttons, and stores to float seamlessly against a unified black backdrop.

#### Scenario: Rendering game scenes without panel boundaries
- **WHEN** any view or panel (room, village, craft, map, log, stores) is rendered
- **THEN** system SHALL not draw opaque panel fill rectangles or enclosing borders, maintaining a pure black visual void

### Requirement: Original text link navigation tabs
The system SHALL display top navigation not as large rectangular buttons, but as minimalist text links separated by vertical pipes, with an underline denoting the active location.

#### Scenario: Displaying unlocked navigation tabs
- **WHEN** only the initial room is unlocked
- **THEN** system SHALL display only `小黑屋` with an active underline, omitting pipes and locked location names
- **WHEN** subsequent locations (village, craft, map, ship) become unlocked
- **THEN** system SHALL append their text links separated by ` | ` and permit switching by clicking the text

### Requirement: Stores inventory progressive disclosure
The system SHALL keep the stores inventory container completely hidden from view when total possessed resource count is zero, and only display items that have been discovered or have a positive quantity.

#### Scenario: Initial state with zero resources
- **WHEN** a new game starts with 0 resources
- **THEN** system SHALL keep the stores panel completely invisible

#### Scenario: Acquiring the first resource
- **WHEN** player gathers wood for the first time
- **THEN** system SHALL reveal the stores wireframe box displaying only the wood resource row, keeping unencountered resources hidden

### Requirement: Room action buttons progressive disclosure
The system SHALL present strictly one button (`生火`) at the very beginning of a new adventure, revealing subsequent action buttons only as narrative criteria and resource triggers are satisfied.

#### Scenario: Initial room state
- **WHEN** player enters a fresh game where the fire has never been lit
- **THEN** system SHALL display only the `生火` button, keeping `添柴`, `採集木材`, and `檢查陷阱` buttons concealed

#### Scenario: Unlocking stoke fire
- **WHEN** player clicks `生火` and the fire is burning
- **THEN** system SHALL reveal the `添柴` button equipped with real-time cooldown animation

#### Scenario: Unlocking gather wood in dark forest
- **WHEN** fire is active and wood reserves deplete, or stranger stumbles in
- **THEN** system SHALL reveal the `走進暗林採集木材` button
