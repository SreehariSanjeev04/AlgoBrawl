# AlgoBrawl Backend Security & Requirements Registry

**Last updated**: 2026-08-02

This document records the threat model, security requirements, and acceptance criteria for the backend. It is the single reference for the `checklists/critical-issues.md` requirements.

## Threat Model

The judge pipeline is the primary trust boundary:

| Threat | Vector | Mitigation |
|---|---|---|
| T1: Verdict forgery | Client-supplied `expected`/`testcases` in `submit-solution` | Judging uses server-side `Problem.testcases` + `judge_type` only (REQ-SEC-001) |
| T2: Identity spoofing | Unauthenticated socket events carrying arbitrary `userId` | Socket.io handshake requires a valid JWT; identity is taken from the verified token (REQ-SEC-002) |
| T3: Cross-user state tampering | Submitting for/against another match player | Submission accepted only when `socket.user_id` is a player of the room (REQ-SEC-003) |
| T4: Credential exposure | Secrets committed to VCS; hashes serialized in API responses | `.env` gitignored + `.env.example`; password excluded via defaultScope + `toJSON` (REQ-SEC-004, REQ-SEC-005) |
| T5: Horizontal privilege escalation | `/user/update`, `/user/get-matches` acting on arbitrary ids | Ownership checks bound mutations/reads to the authenticated user (REQ-SEC-006, REQ-SEC-007) |
| T6: Unauthenticated resource abuse | Code execution, room/problem creation without auth | Endpoint classification: every route is public / authenticated / internal, enforced by middleware (REQ-SEC-008, REQ-NFR-003) |
| T7: Brute force | `/login`, `/register` | Per-IP rate limits with quantified thresholds (REQ-SEC-009) |
| T8: Untrusted code execution | Malicious user code inside judge containers | Sandboxed containers: non-root, no network, capabilities dropped, pids/memory/CPU/time/output caps (REQ-JUDGE-006) |
| T9: Process crash via malformed input | Out-of-range ratings, malformed socket payloads | Input validation at all socket/REST entry points; no uncaught-exception paths (REQ-MATCH-006, REQ-NFR-001) |
| T10: Judge false verdicts | Broken judge pipeline silently passing/failing | Full per-language judge path contract; failures surface as explicit errors, never as verdicts (REQ-JUDGE-001, REQ-JUDGE-007) |

## Requirements Registry

### Security

- **REQ-SEC-001** Match judging MUST evaluate submissions against server-side `Problem.testcases` and `judge_type`; client-supplied expected values are ignored.
  - *Acceptance*: A submission whose client payload differs from the stored problem still judges against stored data (verifiable by test with mismatched client values).
- **REQ-SEC-002** Every socket connection MUST authenticate via a valid JWT in the handshake; identity fields (`user_id`) are derived from the token, never from client events.
  - *Acceptance*: A socket without a valid token is rejected at handshake (`connect_error`); an `online` event cannot set a foreign identity.
- **REQ-SEC-003** `submit-solution` MUST be accepted only when the submitting user is a player of the match room.
  - *Acceptance*: Submission for a user outside `match.players` is rejected with an error ack.
- **REQ-SEC-004** Secrets (JWT, refresh token, internal secret, DB credentials) MUST NOT be committed to version control; a `.env.example` template MUST exist.
  - *Acceptance*: `git ls-files` contains no `.env`; `.env.example` uses placeholder values.
- **REQ-SEC-005** No API response MUST ever serialize the password hash.
  - *Acceptance*: `register`, `login`, `getById`, `getAll`, `update` responses contain no `password` key.
- **REQ-SEC-006** Rating/stat updates MUST be limited to the authenticated user's own profile.
  - *Acceptance*: `PATCH /user/update` with `id != token.id` returns 403.
- **REQ-SEC-007** Match history queries MUST return only the authenticated user's matches.
  - *Acceptance*: `POST /user/get-matches` without a token returns 401; with a token returns only own matches.
- **REQ-SEC-008** Every endpoint MUST be classified public / authenticated / internal and enforced: internal = `internalAuth`, authenticated = JWT `auth`, public = no auth. Classified routes: login/register/validate/refresh-token/getAll/getById/getRoom public; `/run`, `/user/update`, `/user/get-matches`, match delete authenticated; `/problem/add`, `/match/create-match`, `/match/store-match`, `/submission/add`, `/submit`, `/user/update-score` internal.
  - *Acceptance*: Requests without the required credential receive 401 for each protected route.
- **REQ-SEC-009** Auth endpoints MUST be rate limited (20 attempts / 15 min per IP); code execution endpoints 10 / min per IP.
  - *Acceptance*: Bursting past the limit receives 429 with a JSON error.
- **REQ-SEC-010** Internal secret comparison MUST be timing-safe.
  - *Acceptance*: comparison uses `crypto.timingSafeEqual` on equal-length buffers.

### Judge Correctness

- **REQ-JUDGE-001** Every supported language MUST exercise the full judge path (compile/run, normalize, compare, verdict) and produce the same verdict semantics.
  - *Acceptance*: A known-correct program gets `VERDICT:APPROVED`; a known-wrong program gets `VERDICT:NOT_APPROVED`; verified for python and cpp.
- **REQ-JUDGE-002** Normalization MUST apply consistently to all languages and judge types (`float`, `boolean`, `string`, `ignore_case`).
  - *Acceptance*: Same normalization rules applied in python and cpp images via a shared `normalizer.sh`.
- **REQ-JUDGE-003** Resource limits MUST be per-language and concrete (time, memory, CPU).
  - *Acceptance*: Config table defines explicit values; C++ compile budget is distinct from run budget.
- **REQ-JUDGE-004** Pass/fail MUST be determined by the judge verdict, not by process exit status.
  - *Acceptance*: A program that prints `VERDICT:NOT_APPROVED` exits cleanly yet reports `passed: false`.
- **REQ-JUDGE-005** Sandboxing MUST apply to all execution flows (non-root user, `--network=none`, `--cap-drop=ALL`, pids limit, stdout cap).
  - *Acceptance*: `run` and `submit` both run containers with the same sandbox flags.
- **REQ-JUDGE-006** Judge pipeline failures (missing verdict, infra errors) MUST surface as explicit errors, never as a pass/fail verdict.
  - *Acceptance*: A submission with no verdict line returns a 5xx status and a "server error" feedback message.

### Match Integrity

- **REQ-MATCH-001** A match MUST be finalized exactly once even under concurrent submissions.
  - *Acceptance*: Two concurrent submissions result in a single Elo update / `Match` row (guarded by a finalization flag).
- **REQ-MATCH-002** Timer expiry MUST terminate the match: winner is the approved player, draw if both/none approved, with Elo and persistence handled.
  - *Acceptance*: On `time-up`, `match-ended` is emitted and the match is removed from memory.
- **REQ-MATCH-003** Leaving matchmaking (explicit or disconnect) MUST remove the user from the queue.
  - *Acceptance*: A disconnected queued user is never matched with a stale socket.
- **REQ-MATCH-004** Players MUST be verified connected before a match is created.
  - *Acceptance*: If either candidate socket is gone, no match is created and the live player is re-queued.
- **REQ-MATCH-005** Matchmaking input MUST be validated (numeric rating within queue bounds, identity matching the authenticated user).
  - *Acceptance*: Out-of-range or mismatched payloads are rejected or clamped without crashing the process.
- **REQ-MATCH-006** Elo finalization failure MUST NOT silently lose data: the match is not declared ended, submitted state resets, and the client is notified.
  - *Acceptance*: A forced DB failure during finalize leaves the match active and emits an error feedback.

### Non-Functional

- **REQ-NFR-001** All client-supplied input MUST be validated at entry points; no socket handler or route may throw uncaught exceptions.
- **REQ-NFR-002** Matchmaking MUST have time bounds independent of queue size (bucket-based matching).
- **REQ-NFR-003** Unbounded in-memory stores (rooms, queue nodes, pending connections) MUST have lifecycle cleanup (match end, disconnect removal, temp-file sweep).
- **REQ-NFR-004** Scaling assumption: single-instance deployment with in-memory matchmaking/socket state. Horizontal scaling requires a shared store (e.g., Redis adapter) and is out of scope until documented.

## Governance

- All fixes implementing these requirements must be verifiable against the acceptance criteria above.
- Checklist items in `checklists/critical-issues.md` are marked resolved only when the corresponding acceptance criteria hold.
