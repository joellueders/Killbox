# Multi-Agent Multiplayer Validation Specification

## Purpose

Define a reproducible single-machine method for validating authoritative cooperative multiplayer behavior with isolated player agents while explicitly excluding real Tailscale and cross-machine network claims.

## Requirements

### Requirement: Orchestrate reproducible multi-agent validation runs
The validation method SHALL create a reproducible single-machine run with a coordinator, independent agent roles, dynamic ports, a unique run identifier, and a recorded scenario manifest.

#### Scenario: Coordinator starts a validation run
- **WHEN** a multiplayer efficacy validation run starts
- **THEN** the coordinator allocates available loopback ports and an isolated run directory
- **AND** records the run ID, seed, endpoints, room identifier, scenarios, role assignments, claim boundary, and artifact paths
- **AND** does not require a second physical computer

### Requirement: Isolate player-agent observations and state
The validation method SHALL keep `p1` and `p2` agent execution isolated so each player agent observes gameplay through its own client session and SHALL prevent direct gameplay-state exchange outside the authoritative multiplayer system.

#### Scenario: Player agents join the room
- **WHEN** `p1` and `p2` agents begin their assigned scenario
- **THEN** each agent uses a separate browser context or process
- **AND** each agent receives a role-specific brief
- **AND** the agents do not share browser storage, page handles, screenshots, hidden server state, or gameplay-state messages

#### Scenario: Coordinator signals a scenario barrier
- **WHEN** the coordinator signals that agents can advance to the next scenario phase
- **THEN** the signal contains coordination state only
- **AND** it does not disclose authoritative gameplay values or another player's private observations

### Requirement: Exercise authoritative multiplayer efficacy
The validation method SHALL exercise player-visible and authoritative multiplayer behavior through independent agent actions.

#### Scenario: Agents complete the cooperative success flow
- **WHEN** the `p1` and `p2` agents independently join, ready, build, and start a wave according to their role briefs
- **THEN** distinct slots are assigned
- **AND** valid commands are reflected to both clients
- **AND** the authoritative server completes at least one cooperative wave
- **AND** both clients converge on the resulting session state

#### Scenario: Agent sends an invalid command
- **WHEN** an assigned agent sends a command that authoritative validation must reject
- **THEN** the command does not mutate authoritative state
- **AND** both player clients remain synchronized
- **AND** the rejection is recorded in validation evidence

#### Scenario: Agents issue near-concurrent commands
- **WHEN** multiple player agents issue valid or conflicting commands within the configured concurrency window
- **THEN** the server resolves the commands authoritatively
- **AND** the final state is consistent across both clients and the authoritative evidence trace

### Requirement: Validate lifecycle and fault behavior
The validation method SHALL support bounded fault and lifecycle scenarios without granting player agents hidden authoritative access.

#### Scenario: One player agent disconnects
- **WHEN** the fault role disconnects one player client
- **THEN** the remaining player client observes the disconnected slot
- **AND** the event trace records the lifecycle transition

#### Scenario: All player agents leave
- **WHEN** all player agents leave the room
- **THEN** the room is eventually disposed
- **AND** a subsequent validation phase can obtain a fresh cooperative room

#### Scenario: Bounded local fault is injected
- **WHEN** the fault role applies an approved delay, interruption, or invalid-input profile
- **THEN** the fault parameters and timing are recorded
- **AND** the resulting assertions distinguish expected resilience from a validation failure

### Requirement: Capture inspectable validation evidence
The validation method SHALL retain structured, append-only, and secret-redacted evidence sufficient to evaluate scenario ordering, command outcomes, synchronization, and final state.

#### Scenario: Validation event occurs
- **WHEN** a relevant join, leave, command, state transition, wave, fault, or cleanup event occurs
- **THEN** the evidence includes a sequence identifier, time or simulation tick, event type, redacted actor identity when applicable, and relevant state digest or assertion reference

#### Scenario: Validation run retains artifacts
- **WHEN** execution finishes or fails
- **THEN** the run directory retains the manifest, role actions, structured event trace, assertion results, and diagnostic artifacts required by the report
- **AND** retained artifacts do not expose the reusable room secret

### Requirement: Produce an adjudicated validation report
The validation method SHALL produce a final report that maps claims to evidence and clearly states the limitations of single-machine validation.

#### Scenario: Adjudicator completes a run
- **WHEN** all scenarios finish or a terminal validation failure occurs
- **THEN** the adjudicator reports each scenario and assertion as passed, failed, or not executed
- **AND** references the supporting evidence artifacts
- **AND** records discrepancies and environment details

#### Scenario: Report describes supported claims
- **WHEN** a report concludes that multiplayer efficacy validation passed
- **THEN** it states that authoritative cooperative behavior was validated using isolated agents on one machine
- **AND** it states that real Tailscale routing, ACL, firewall, latency, and cross-machine behavior were not validated

### Requirement: Clean up validation resources
The validation method SHALL clean up processes, ports, browser contexts, and temporary secrets after each run while retaining the configured evidence artifacts.

#### Scenario: Validation run ends
- **WHEN** a validation run succeeds, fails, or is interrupted
- **THEN** spawned services and player clients are stopped
- **AND** allocated ports and temporary credentials are released
- **AND** retained evidence remains available for review
