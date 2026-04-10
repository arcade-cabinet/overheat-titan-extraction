---
name: Avoid GitHub MCP — use gh CLI with GraphQL instead
description: GitHub MCP servers burn context with huge response bodies. Use `gh api graphql -f query='...'` with scoped field selection for every non-trivial GitHub operation.
scope: all
enforced_by: discipline
---

## The rule

Do NOT use GitHub MCP servers for GitHub operations. Use the `gh` CLI
with GraphQL instead.

## Why

User explicit direction: the GitHub MCP is "massively token intensive".
Each call surfaces full issue bodies, comment threads, review diffs, and
metadata whether you need them or not. The `gh` CLI with GraphQL lets you
request exactly the fields you need and nothing more.

## How to apply

- **Prefer** `gh api graphql -f query='...'` for any non-trivial GitHub
  query — issues with specific fields, PR review threads, file-level
  comments, workflow runs.
- **Use** `gh pr view`, `gh issue view`, `gh pr list`, `gh run list`
  for simple lookups.
- **Use** `gh api repos/owner/repo/...` for REST endpoints when GraphQL
  is overkill.
- **Always scope** your GraphQL query to only the fields you need.

## Example

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        title
        state
        reviewThreads(first: 20) {
          nodes {
            isResolved
            comments(first: 5) {
              nodes { author { login } body path line }
            }
          }
        }
      }
    }
  }
' -F owner=arcade-cabinet -F repo=overheat-titan-extract -F number=123
```
