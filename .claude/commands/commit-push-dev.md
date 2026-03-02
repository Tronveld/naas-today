---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*), Bash(git push:*)
description: Commit all current changes with an auto-generated message and push to the development branch
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits (for style reference): !`git log --oneline -10`

## Your task

1. Review the diff above and write a concise, accurate commit message that describes what changed and why. Follow the commit style of recent commits shown above.
2. Stage all modified tracked files (do NOT stage .env or other secrets).
3. Create the commit.
4. Push to the `development` branch.

Do not use any other tools or do anything else. Do not send any other text or messages besides the tool calls.
