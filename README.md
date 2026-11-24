# Queue Compass

Compare first-come-first-served and shortest-available-job queue scheduling.

**Status:** implemented browser-local research prototype. Automated tests can be reproduced with the command below. The existing Pages site previously passed smoke checks. The deadline-policy update is locally tested; its latest deployment and browser behavior have not been verified.

## Website

Live website: https://royalpuskar.github.io/queue-compass/

## Problem and approach

Queue designers need to see individual delays and missed deadlines alongside average waiting time. This simulator compares explicit dispatch rules over the same supplied arrivals and service durations, reporting per-job timing evidence. It runs the same pure JavaScript engine in the browser and Node tests. All input is provided by the user or the included synthetic fixture; no external facts are inferred.

## Implemented features

- Editable scenario with a synthetic example and reset control.
- Deterministic analysis, summary metrics, filterable result table, and JSON report export.
- Input validation, explicit errors, and invalidation of outdated reports after edits.
- Keyboard-accessible controls, responsive layout, and large-screen CSS.
- Zero runtime dependencies and no external API calls.

## Install and run

Requirements: Python 3 for a static local server, Node.js 22 or later for tests.

```sh
git clone https://github.com/Royalpuskar/queue-compass.git
cd queue-compass
python3 -m http.server 8000
```

Open http://localhost:8000. Do not open index.html through a file URL; ES modules require a server.

```sh
node --test test.mjs
```

## Example and schema

The complete example in `sample.mjs` defines the supported input shape:

```json
{
  "policy": "shortest",
  "jobs": [
    {
      "id": "A",
      "arrival": 0,
      "duration": 4
    },
    {
      "id": "B",
      "arrival": 1,
      "duration": 5
    },
    {
      "id": "C",
      "arrival": 2,
      "duration": 1
    }
  ]
}
```

Edit one value and select **Run analysis**. **Reset example** restores the fixture. **Export report** downloads the current result; it never publishes it.

Input is capped at 200,000 serialized characters, arrays processed by the engine at 500 elements, and numeric magnitudes at 1e12. Domain constraints are checked inside `engine.mjs`; unsupported structures return an error.

## Deadline-aware scheduling

Set `policy` to `earliest-deadline` to select the ready job with the earliest absolute deadline. Jobs without a deadline rank after those with one. Only already-arrived jobs are considered; running jobs are never preempted. Ties use arrival time, then input order. Existing `fcfs` and `shortest` policies retain their ordering rules.

```json
{"policy":"earliest-deadline","jobs":[
{"id":"long","arrival":0,"duration":5,"deadline":10},
{"id":"urgent","arrival":1,"duration":1,"deadline":2}
]}
```

Expected result: long starts at 0 and finishes at 5; urgent starts at 5, finishes at 6, waits 4, and misses its deadline by 4. This example demonstrates the non-preemptive limitation rather than claiming optimal scheduling.

A job's optional `deadline` is a finite absolute time from 0 to 1e12, in the same units as arrival and duration. A deadline before arrival is allowed and reported honestly. Finishing exactly at a deadline is on time. Missing deadline information produces null lateness/missed-deadline fields and does not count as success or failure.

Rows add turnaround time, deadline, signed lateness, and missed-deadline status. Metrics add maximum wait, idle time (including time before the first arrival), measured deadline count, missed deadline count, and maximum tardiness (lateness clamped to zero). Zero maximum tardiness with zero measured deadlines does not establish deadline compliance. Mean wait is rounded to three decimals; other timing evidence uses JavaScript numbers.

Job IDs must be unique. Empty schedules return zero timing metrics. Zero-duration jobs are valid. Input remains capped at 500 jobs.

## Architecture and request flow

`index.html` loads `app.mjs`, which parses scenario JSON and calls `run` from `engine.mjs`. The engine returns `metrics` and `rows`; the UI renders values with `textContent`, never user-supplied HTML. Editing invalidates the prior report. Export creates a local Blob download.

There is no application authentication, credential store, session cookie, or token lifecycle. GitHub Pages serves public static files. The app does not collect passwords or API keys, contact third-party APIs, persist inputs, or send scenario data over the network. GitHub hosting can still receive ordinary page request metadata. Reloading discards edits.

## Limitations

Single-server non-preemptive simulation with known deterministic service times. No priority aging, task cancellation, context-switch overhead, uncertainty model, network, or scheduler integration. Earliest deadline among ready jobs is a dispatch heuristic here, not a guarantee of feasible or optimal deadline scheduling.

The interface shares a portfolio design system, while this repository has its own domain engine, fixture, and tests. No accuracy, novelty, production-readiness, or 4K visual-test claim is made. Large-screen CSS is not a substitute for device testing.

## Validation

Ten local Node tests pass for this update. They cover deadline ordering, exact deadline boundaries, missing deadlines, urgent arrivals during running jobs, idle gaps, zero-duration jobs, stable ties, and invalid inputs. All three policies are checked over 81 two-job fixtures (243 schedules) for non-overlap, nonnegative wait, unique execution, and finish time equal to service plus idle time. These bounded fixture results are not production performance measurements. Mobile, laptop, and 3840×2160 browser checks have not been performed for this update.

`test.mjs` checks domain outcomes and edge cases, deterministic behavior, input preservation, malformed roots, and size limits. GitHub Actions runs the same suite. Review the tests themselves to see exactly what is covered; passing these checks does not establish security or exhaustive correctness.

## Roadmap

- Add more independently reviewed domain fixtures and explicit schema documentation.
- Add domain-specific form controls alongside the JSON editor.
- Expand accessibility and mobile browser testing.
- Revisit the documented domain limitations before production use.

## Contribution and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [LICENSE](LICENSE).

© 2026 Puskar (Royalpuskar). All rights reserved except permissions granted by the MIT license. Preserve applicable third-party notices.

