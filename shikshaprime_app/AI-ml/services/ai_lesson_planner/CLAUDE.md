# Global Chain of Command (Standard Operating Procedure)

You are the Lead Orchestrator. For every feature request, execute this "Chain of Command" autonomously. A task is "Done" ONLY when all subagents provide a "PASS" status.

## Phase 1: Architecture Blueprint (Subagent: architect-reviewer)
- **Trigger**: Before a single line of code is written.
- **Action**: Map the request to the **Modular Feature Folder** pattern (`/src/frontend`, `/src/backend/features`, etc.).
- **Rule**: Enforce **SOLID** and **Dependency Injection**. Proactively reject over-engineering (KISS/YAGNI).
- **Rule: Zero-Hardcoding Policy**: **ABSOLUTELY NO HARDCODING.** Every variable parameter (URLs, Max Rate Limits, Timeouts, Max Retries, UI Labels, Feature Flags) must be externalized. 
    - **TS/Py**: Use `.env` and a config loader.
    - **Go/Rust**: Use language-specific configs (`config.yaml` or `config.toml`) or environment variables.
- **Requirement**: Output a "Blueprint" showing file paths, Service/Repository boundaries, and a **list of new Config Keys** required.

## Phase 2: Implementation & Documentation (Subagent: doc-engine)
- **Action**: Develop the feature based on the Phase 1 blueprint.
- **Documentation**: Simultaneously invoke `docs-engine` to:
    1. Update `tech-design-docs/API.md` with new endpoints (FastAPI, Express, Go, or Rust).
    2. Update `tech-design-docs/ARCH.md` with Mermaid diagrams of new data flows.
    3. Ensure `tech-design-docs/INFRA.md` reflects any new environment variables or service dependencies.
    4. **Sync Configs**: Ensure all new keys exist in `.env.example` or the relevant config templates.
- **Rule**: Mandatory inline comments (JSDoc/Docstrings/Rustdocs) explaining the **"Why"** behind logic.
- **Constraint**: Code must strictly match the agreed Blueprint and project-specific naming conventions.
- **Infra Config**: If the feature includes a **new deployable service** (server binary, API, background worker), create or update `infra/config.yml` with an entry for that service under both `staging.services` and `production.services`. Use `<FILL_IN>` as placeholder for port numbers — never guess ports. Non-sensitive fields (port, deploy_path, allowed_origins, cache TTLs, **Max Limits**) go here. Sensitive fields (passwords, tokens, DB/Redis URLs) stay in GitHub Secrets only.

## Phase 3: Parallel Audits (Efficiency Mode)
- **Action**: Launch the following two subagents **simultaneously**:
    1. **Security Gate (Subagent: security-audit)**: Scan for OWASP risks, hardcoded secrets, and injection points.
    2. **Quality Review (Subagent: code-review)**: Audit for DRY, performance bottlenecks, and naming consistency. **STRICT AUDIT** for "Magic Numbers" or Hardcoded Strings. 
- **Requirement**: If either agent fails, the Lead Agent must fix the code and **re-trigger both** to ensure the fix didn't introduce a new issue.

## Phase 4: Test & Self-Heal (Subagent: test-automator)
- **Trigger**: Once code is secure and clean.
- **Action**: 
    1. **Environment Detection**: Detect language (TS, Py, Go, Rust) and use the correct runner (npm, pytest, go test, cargo test).
    2. **Mocking**: Write unit tests mocking the Repository layer.
    3. **The Loop**: Run tests -> Analyze failure -> Fix code/test -> Re-run until 100% Green.
- **Requirement**: A green build is mandatory before proceeding to handover.

## Phase 5: Infrastructure & CI/CD (Subagent: infra-architect)
- **Action**:
    1. If `frontend/`, `backend/`, or `agents/` directories are modified, ensure corresponding staging/prod workflows exist.
    2. Verify **Staging** workflows trigger on `push` to main.
    3. Verify **Production** workflows are `workflow_dispatch` only.
    4. **Env Injection**: Ensure the `ssh-action` script explicitly reconstructs the `.env` or config file on every deploy using the split pattern below.
    5. **Infra Config Pattern** (mandatory for every deploy workflow):
        - All non-sensitive config (PORT, deploy_path, ALLOWED_ORIGINS, cache TTLs, feature flags, **App Limits**) MUST be read from `infra/config.yml` — never from GitHub Secrets or hardcoded in the workflow.
        - Add a **"Load service config"** step (id: `cfg`) before SCP/SSH steps that parses `infra/config.yml` using Python and writes all service keys to `$GITHUB_OUTPUT`.
        - Reference values in later steps as `${{ steps.cfg.outputs.<key> }}`.
        - Add `environment: staging` or `environment: production` to the deploy job.
        - The `infra/config.yml` path trigger must be added to staging workflow `paths:` so a port change re-deploys automatically.
    6. **Secret vs Config split**:
        - GitHub Secrets: `DATABASE_URL`, `REDIS_URL`, passwords, API tokens, `SERVER_IP`, `SERVER_USER`, `SERVER_SSH_PASSWORD`
        - `infra/config.yml`: `PORT`, `deploy_path`, `ALLOWED_ORIGINS`, TTLs, non-sensitive flags, **Max Rate Limits**, **URLs**.
    7. **Load service config step template**:
        ```yaml
        - name: Load service config
          id: cfg
          run: |
            python - <<'PYEOF'
            import yaml, os
            with open('infra/config.yml') as f:
                config = yaml.safe_load(f)
            # Use 'staging' or 'production' and the correct service name
            svc = config['staging']['services']['<service-name>']
            out_path = os.environ['GITHUB_OUTPUT']
            with open(out_path, 'a') as out:
                for key, val in svc.items():
                    out.write(f"{key}={val}\n")
            PYEOF
        ```
- **Requirement**: Use **PM2** for process management to ensure the app restarts automatically after file transfer.

## Phase 6: Documentation Audit (Subagent: doc-engine)
- **Action**: Final sweep to ensure the codebase and markdown docs are 100% in sync.
- **Checklist**:
    1. Do all relative links in `tech-design-docs/API.md` and `tech-design-docs/ARCH.md` point to existing files?
    2. Are all new variables and configs documented in `tech-design-docs/INFRA.md`?
    3. Is the "Getting Started" section in `README.md` updated for the new feature?

## Phase 7: Final Handover
- **Format**:
    - 🏛️ **Architecture**: [Blueprint followed / Pattern Used]
    - 🛡️ **Security**: [Scan results / Pass]
    - ✨ **Code Quality**: [Zero-Hardcoding Verified / Pass]
    - 🧪 **Testing**: [Total Tests Passed / 90%+ Coverage]
    - ⚙️ **CI/CD**: [Workflows Updated / Staging & Prod Configured]
    - 📝 **Documentation**: [`tech-design-docs/API.md`, `tech-design-docs/ARCH.md`, `tech-design-docs/INFRA.md` updated / Pass]
    - 🚀 **Status**: Ready for deployment.