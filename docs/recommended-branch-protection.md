# Recommended branch protection

Use these settings on the default branch (`main` or `master`) to keep backlog stories releasable:

1. **Require a pull request before merging**
   - At least 1 approving review.
   - Dismiss stale approvals when new commits are pushed.
2. **Require status checks to pass before merging**
   - Required check: CI workflow running `npm run check`.
3. **Require branches to be up to date before merging**
   - Prevent merging outdated branches that bypass newer checks.
4. **Block force pushes and branch deletions on the protected branch**
5. **Require conversation resolution before merging**
6. **Restrict who can push directly to the protected branch**
   - Prefer PR-only changes.

For stacked PRs, merge from the bottom of the stack upward.
