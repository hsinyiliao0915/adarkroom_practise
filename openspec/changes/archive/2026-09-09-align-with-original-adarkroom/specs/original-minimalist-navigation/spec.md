## Purpose

規範還原《A Dark Room》經典極簡風格之行內文字導航、單一外層邊框與緊湊線框容器規範，消除沉重頂欄與封閉面板框，重現安靜深邃的文字冒險體驗。

## ADDED Requirements

### Requirement: Inline text navigation with active underline
The system SHALL provide inline text-based tab navigation situated directly above the center action column (e.g. `生火間 | 靜謐森林`), separating unlocked locations with pipe symbols and highlighting the active tab with an underline.

#### Scenario: Switching between unlocked locations
- **WHEN** player clicks an unlocked tab link such as "靜謐森林"
- **THEN** system SHALL switch the active center view to the chosen location and shift the underline to that tab

#### Scenario: Progressive reveal of tab links
- **WHEN** a new location is unlocked (e.g., Outside or Dusty Path)
- **THEN** system SHALL dynamically append the new tab link inline with a pipe separator without disrupting existing view layout

### Requirement: Single outer container frame with borderless internal columns
The system SHALL enclose the entire gameplay canvas within a single clean outer container frame, while internal columns (narrative logs, center action view, right stores) float directly on the dark canvas without closed rectangular panel boxes.

#### Scenario: Viewing the game stage
- **WHEN** player loads or views the game
- **THEN** system SHALL display one prominent outer bounding frame, and internal logs, actions, and stores SHALL blend seamlessly into the uniform background

### Requirement: Compact fieldset style for right-hand information
The system SHALL present right-hand information (population and stores) inside compact, auto-resizing fieldset-like outlines where section labels sit along the top border line.

#### Scenario: Displaying population when huts are built
- **WHEN** huts exist in the settlement
- **THEN** system SHALL render a compact top box displaying "樹林 ── 人口 X/Y" with worker assignments directly above the stores box
