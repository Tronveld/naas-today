---
allowed-tools: Bash(git checkout:*), Bash(git merge:*), Bash(git push:*), Bash(git status:*), Bash(git log:*), Bash(git branch:*)
description: Merge the development branch into main and push
---

## Context

- Current branch: !`git branch --show-current`
- Branch status: !`git status`
- Recent commits on dev: !`git log dev --oneline -5`
- Commits on dev not yet on main: !`git log main..dev --oneline`

## Your task

1. Review the commits above to confirm there is something to merge.
2. Checkout `main`.
3. Merge `dev` into `main`.
4. Push `main` to the remote.
5. Switch back to `dev`.

Do not use any other tools or do anything else. Do not send any other text or messages besides the tool calls.
