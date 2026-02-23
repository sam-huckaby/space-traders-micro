## Architecture constraints (do not deviate)
- ONLY shared state across microfrontends: { token, agentSummary } via HostApi.getSession()/setSession()
- NO shared QueryClient, NO shared ship/system/contract caches, NO Redux store
- Remotes own their own fetching/caching and can refetch freely
- Cross-remote coordination happens via routes/URL params, not shared state
