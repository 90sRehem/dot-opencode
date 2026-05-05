# Graph Report - .  (2026-05-04)

## Corpus Check
- 19 files · ~287,807 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 203 nodes · 355 edges · 18 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `build_ownership_map()` - 15 edges
2. `run_cmd()` - 11 edges
3. `main()` - 11 edges
4. `header()` - 10 edges
5. `main()` - 10 edges
6. `load_files()` - 9 edges
7. `regen_keys_and_qr()` - 8 edges
8. `load_people()` - 8 edges
9. `to_int()` - 7 edges
10. `read_csv()` - 7 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (25): action_logs_opencode(), action_qr_laptop(), action_qr_phone(), action_regenerate(), action_restart_caddy(), action_restart_opencode(), action_start_vpn(), action_status() (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.26
Nodes (23): handle_cochange(), handle_communities(), handle_community(), handle_file(), handle_files(), handle_people(), handle_person(), handle_summary() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.2
Nodes (16): add_months(), find_file_node(), iter_commits_from_git(), iter_commits_from_json(), load_community_files(), load_graph_json(), load_people(), main() (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (17): author_excluded(), build_ownership_map(), compute_community_owners(), ensure_out_dir(), format_offset(), is_excluded(), iter_commits(), load_sensitive_rules() (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (5): authenticate(), createContext(), getExtraHeadersFromEnv(), safeClick(), safeType()

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (15): _collect_block_scalar(), FrontmatterParseError, parse_frontmatter(), _parse_frontmatter_stdlib(), _parse_scalar(), print_report(), Parse frontmatter using PyYAML when available, fallback to stdlib parser., Run all validation checks on a skill folder. (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (13): extract_messages_after(), find_last_planning_update(), get_project_dir(), get_sessions_sorted(), main(), normalize_path(), parse_session_messages(), Extract conversation messages after a certain line number. (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.34
Nodes (13): build_parser(), build_url(), handle_event_detail(), handle_issue_detail(), handle_issue_events(), handle_list_issues(), main(), next_cursor() (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.35
Nodes (10): _ensure_gh_authenticated(), fetch_all(), get_current_pr_ref(), gh_api_graphql(), gh_pr_view_json(), main(), Resolve the PR for the current branch (whatever gh considers associated).     Wo, Call `gh api graphql` using -F variables, avoiding JSON blobs with nulls.     Qu (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (9): detect_database(), detect_pattern(), generate_custom(), generate_diagram(), main(), Detect which architecture pattern matches the text., Detect database type from text., Generate Mermaid diagram from architecture description. (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.52
Nodes (6): checkPlaywrightInstalled(), cleanupOldTempFiles(), getCodeToExecute(), installPlaywright(), main(), wrapCodeIfNeeded()

### Community 11 - "Community 11"
Cohesion: 0.47
Nodes (5): detect_services(), generate_checklist(), main(), Detect AWS services mentioned in text., Generate security checklist for given services.

### Community 12 - "Community 12"
Cohesion: 0.47
Nodes (5): detect_services(), generate_cost_report(), main(), Detect AWS services mentioned in text., Generate cost considerations report for given services.

### Community 13 - "Community 13"
Cohesion: 0.47
Nodes (5): detect_services(), generate_review(), main(), Detect AWS services mentioned in text., Generate review questions for given services and pillars.

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (3): main(), Validate architecture description against rules., validate_architecture()

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (2): main(), parse_args()

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **29 isolated node(s):** `Run a shell command, return (returncode, stdout, stderr).`, `Display a QR-code PNG in the terminal via qrencode.`, `Generate fresh WireGuard key pairs for phone and laptop,     rewrite their .conf`, `Detect which architecture pattern matches the text.`, `Detect database type from text.` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (1 nodes): `check-complete.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `init-session.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Run a shell command, return (returncode, stdout, stderr).`, `Display a QR-code PNG in the terminal via qrencode.`, `Generate fresh WireGuard key pairs for phone and laptop,     rewrite their .conf` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._