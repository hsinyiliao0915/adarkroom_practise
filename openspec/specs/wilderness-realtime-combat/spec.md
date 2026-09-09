# Wilderness Realtime Combat Specification

## Purpose

提供基於武器獨立冷卻進度、敵方週期攻擊與戰時醫療應急的半即時荒野戰鬥系統，還原小黑屋經典的戰鬥張力與策略選擇。

## Requirements

### Requirement: Independent weapon cooldowns
The system SHALL provide distinct attack actions for each available weapon, enforcing individual cooldown timers and ammunition requirements before an attack can be repeated.

#### Scenario: Attacking with melee weapon on cooldown
- **WHEN** player attacks with a melee weapon
- **THEN** system SHALL deal corresponding weapon damage to enemy and set that weapon's cooldown timer to its specified duration

#### Scenario: Firing rifle during combat
- **WHEN** player fires a rifle with available bullets and zero cooldown
- **THEN** system SHALL deal rifle damage, consume 1 bullet, and start rifle cooldown

#### Scenario: Attempting attack while on cooldown
- **WHEN** player triggers an attack button while its cooldown is active
- **THEN** system SHALL ignore the command and leave weapon and enemy state unchanged

### Requirement: Enemy speed-based attack intervals
The system SHALL execute enemy attacks periodically based on the enemy's speed property throughout active combat.

#### Scenario: Enemy cooldown timer elapses
- **WHEN** combat is active and enemy attack interval timer reaches threshold
- **THEN** system SHALL perform an accuracy roll and deduct player HP on hit, resetting enemy attack timer

### Requirement: Combat medical support and tactical retreat
The system SHALL permit players to consume cured meat for health recovery during combat and attempt tactical retreats.

#### Scenario: Healing during combat
- **WHEN** player clicks eat cured meat during combat with meat available and HP below max
- **THEN** system SHALL consume 1 cured meat and restore player HP

#### Scenario: Retreating from combat
- **WHEN** player triggers retreat action
- **THEN** system SHALL evaluate escape probability and either terminate combat or inflict penalty damage on failure
