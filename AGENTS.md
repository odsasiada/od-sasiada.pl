## Project Context

- **Przeczytaj [`_bmad-output/project-context.md`](./_bmad-output/project-context.md) PRZED implementacją jakiegokolwiek kodu.** Zawiera krytyczne, nieoczywiste reguły (izolacja wielotenantska, pułapki pluginu ecommerce, granica `'use server'`/Turbopack, ceny w groszach) oraz stack z dokładnymi wersjami. W razie wątpliwości wybierz wariant bardziej restrykcyjny.

## Fallow

- Use `fallow audit --format json --quiet` before committing AI-generated changes.
- Use `fallow dead-code --format json --quiet`, `fallow dupes --format json --quiet`, and `fallow health --format json --quiet` for targeted checks.
- Use `fallow list --entry-points --format json --quiet` and `fallow list --boundaries --format json --quiet` to inspect project shape.

<!-- generated:task-matrix:start -->
| When the agent is about to... | Run |
|---|---|
| delete an "unused" export or file | `fallow dead-code --trace <file>:<export>` |
| delete an "unused" dependency | `fallow dead-code --trace-dependency <name>` |
| commit or open a PR | `fallow audit --base <ref>` |
| prioritize refactoring | `fallow health --hotspots --targets` |
| ask who owns code | `fallow health --ownership` |
| check untested-but-reachable code | `fallow health --coverage-gaps` |
| consolidate duplication | `fallow dupes --trace dup:<fingerprint>` |
| find feature flags | `fallow flags` |
| surface security candidates | `fallow security` |
| understand a finding | `fallow explain <issue-type>` |
| scope a monorepo | `--workspace <glob> / --changed-workspaces <ref>` (global flags, prefix any command) |
<!-- generated:task-matrix:end -->
