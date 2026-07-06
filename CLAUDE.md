# Claude Code Instructions

## Branch Policy
- Always work directly on `main`
- Never create feature branches
- Always push directly to `main`
- Do not open pull requests

## Project Memory & Notes (Obsidian Vault)
- The Obsidian vault at `../Library App/` is the single source of truth for project memory and documentation — it replaces the old `Memory/` folder convention
- Contains: `Architecture.md`, `Features.md`, `Data Model.md`, `Build History.md`, `Open Issues.md`
- **Do not write session memory to `Memory/` or `.claude/projects/` anymore.** Those are deprecated for this project.
- **One-time migration:** if `Memory/MEMORY.md` or other files in `Memory/` still contain relevant context not yet reflected in the vault, fold that content into the appropriate vault file (e.g. past decisions → `Build History.md`, unresolved items → `Open Issues.md`), then note in `Build History.md` that the migration happened. After this is done once, ignore `Memory/` going forward.
- **At the start of a session:** read the vault files to get up to speed before making changes
- **At the end of a session (or before ending one):** compare the current code state against the vault notes
  - If anything no longer matches the code (outdated architecture, resolved issues still listed as open, schema changes not reflected, new features undocumented), update the relevant file directly
  - If something changed this session that isn't reflected anywhere, add it
  - Treat the code as the source of truth — these notes describe what IS, not what was planned or discussed
  - Don't ask for permission to make these updates, just make them, then briefly summarize what changed and why
- If `../Library App/` doesn't exist or the files aren't found, say so rather than guessing at paths
