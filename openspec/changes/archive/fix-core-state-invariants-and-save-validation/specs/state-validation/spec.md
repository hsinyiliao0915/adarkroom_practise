## Purpose

確保遊戲狀態自 localStorage 讀取或儲存時具備完整的資料結構驗證、數值範圍防護與明確的持久化成功或失敗反饋。

## ADDED Requirements

### Requirement: Save state schema and boundary validation
The system SHALL validate any loaded game data against a strict schema to ensure all resource values are non-negative, non-NaN numbers, and fallback gracefully to default values if corruption is detected.

#### Scenario: Corrupted or negative values in storage
- **WHEN** storage contains negative resources or NaN values
- **THEN** system SHALL clamp values to valid minimum boundaries (zero or default) without crashing

#### Scenario: Missing nested fields in legacy saves
- **WHEN** an older save missing newly added configuration fields is loaded
- **THEN** system SHALL deep-merge with initial state while preserving valid user progress

### Requirement: Explicit persistence feedback
The system SHALL return explicit success status from the save operation and notify the user interface accurately.

#### Scenario: Save fails due to quota or storage error
- **WHEN** localStorage quota is exceeded or storage is disabled
- **THEN** system SHALL return false and the UI SHALL display a warning instead of a success message
