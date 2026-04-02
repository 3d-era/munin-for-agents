---
name: munin-projectid
description: Use when user says "/munin:projectid", "/projectid", or wants to set the current project ID for Munin memory system. Also use when MCP tools fail with "projectId is required" error.
---

# Munin Project ID Skill

## What I Do

I set or show the current `MUNIN_PROJECT` in the `.env` file of the project directory. This is required for all other Munin MCP tools to work.

## How to Use

### Set project ID
When user provides a project ID (e.g., `/munin:projectid abc123`):
1. Run: `munin-claude env set MUNIN_PROJECT <projectId>`
2. Confirm success with the output message

### Show current project ID
When user asks to show/check current project (e.g., `/munin:projectid` without value):
1. Run: `munin-claude env get MUNIN_PROJECT`
2. Report the current value or "not set" if null

## Integration

This skill ensures `MUNIN_PROJECT` is available so all other Munin skills (memory, architecture, error-catalog) can function correctly.