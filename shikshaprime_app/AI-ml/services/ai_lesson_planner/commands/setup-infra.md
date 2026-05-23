# /setup-infra
#
# Scaffolds the centralized infra/config.yml pattern and updates GitHub Actions
# deploy workflows to read non-sensitive config from it.
#
# Run this at the start of any new project, or when adding a new deployable service.

You are scaffolding the centralized infrastructure config pattern for this project.
Follow every step exactly. Do not skip steps.

---

## Step 1 — Discover deployable services

Scan `.github/workflows/` for files matching `deploy-*.yml`.
For each file found:
- Extract the service name and environment (staging/prod) from the filename
  (e.g. `deploy-staging-rust-server.yml` → service: `rust-server`, env: `staging`)
- Read the file and note:
  - Current deploy path (look for `target:` in scp-action, or `cd /opt/...` in ssh scripts)
  - Current PORT usage (look for `secrets.PORT`, `vars.PORT`, or hardcoded values)
  - Current ALLOWED_ORIGINS usage
  - Any other non-sensitive env vars written into the `.env` reconstruction block

If no deploy workflows exist yet, scan the source tree for deployable artifacts:
- Rust: look for `[[bin]]` entries in `Cargo.toml`
- Python: look for `[project.scripts]` in `pyproject.toml` or a `main.py`/`app.py`
- TypeScript/Node: look for `"start"` script in `package.json`
- Go: look for `package main` with `func main()` in `.go` files

---

## Step 2 — Create or update `infra/config.yml`

If `infra/config.yml` does not exist, create it with this exact structure:

```yaml
# infra/config.yml
#
# Central non-sensitive configuration for all deployable services.
# One entry per service per environment.
#
# WHAT GOES HERE:
#   ports, deploy paths, non-sensitive env vars (CORS origins, cache TTLs, feature flags)
#
# WHAT STAYS IN GITHUB SECRETS:
#   passwords, API tokens, SSH credentials, database URLs, Redis URLs
#
# HOW WORKFLOWS READ THIS:
#   A "Load service config" step runs Python (pre-installed on ubuntu-latest) to parse
#   this file and write each key to $GITHUB_OUTPUT. Downstream steps reference values
#   as ${{ steps.cfg.outputs.<key> }}.
#
# TO ADD A NEW SERVICE: add an entry under staging.services and production.services.
# TO CHANGE A PORT: edit here and commit — visible in PR diffs, no GitHub UI required.

staging:
  services:
    <service-name>:
      port: <FILL_IN>
      deploy_path: /opt/staging/<service-name>
      # add any other non-sensitive env vars this service needs:
      # allowed_origins: "http://localhost:3000"
      # api_key_cache_ttl: 300

production:
  services:
    <service-name>:
      port: <FILL_IN>
      deploy_path: /opt/prod/<service-name>
      # allowed_origins: "https://yourdomain.com"
      # api_key_cache_ttl: 3600
```

Replace `<service-name>` with the actual service name(s) discovered in Step 1.
Add one entry per service discovered.
Use `<FILL_IN>` as placeholder for ports — do NOT guess port numbers.

If `infra/config.yml` already exists, ADD new service entries to it without removing existing ones.

---

## Step 3 — Update each deploy workflow

For every deploy workflow found in Step 1, apply these changes:

### 3a. Add a "Load service config" step

Add this step BEFORE the SCP step (it must run before any step that needs port/path):

```yaml
      - name: Load service config
        id: cfg
        run: |
          python - <<'PYEOF'
          import yaml, os
          with open('infra/config.yml') as f:
              config = yaml.safe_load(f)
          # Replace 'staging' with 'production' in the prod workflow
          # Replace 'service-name' with the actual service name
          svc = config['staging']['services']['service-name']
          out_path = os.environ['GITHUB_OUTPUT']
          with open(out_path, 'a') as out:
              for key, val in svc.items():
                  out.write(f"{key}={val}\n")
          PYEOF
```

- In staging workflows: use `config['staging']`
- In production workflows: use `config['production']`
- Set the service name to match the key in `infra/config.yml`

### 3b. Replace secret/var references for non-sensitive values

In the SCP step's `target:` field:
- Replace `${{ secrets.STAGING_DEPLOY_PATH }}` → `${{ steps.cfg.outputs.deploy_path }}`
- Replace `${{ secrets.PROD_DEPLOY_PATH }}` → `${{ steps.cfg.outputs.deploy_path }}`
- Replace `${{ vars.STAGING_DEPLOY_PATH }}` → `${{ steps.cfg.outputs.deploy_path }}`

In the SSH `script:` block:
- Replace `cd ${{ secrets.STAGING_DEPLOY_PATH }}` → `cd ${{ steps.cfg.outputs.deploy_path }}`
- Replace `echo "PORT=${{ secrets.PORT }}"` → `echo "PORT=${{ steps.cfg.outputs.port }}"`
- Replace `echo "PORT=${{ vars.PORT }}"` → `echo "PORT=${{ steps.cfg.outputs.port }}"`
- Replace `echo "ALLOWED_ORIGINS=${{ secrets.ALLOWED_ORIGINS }}"` → `echo "ALLOWED_ORIGINS=${{ steps.cfg.outputs.allowed_origins }}"`
- Replace any other non-sensitive vars similarly

Keep ALL of these as `${{ secrets.* }}` — never move them to config:
- `DATABASE_URL`, `REDIS_URL`, `DATABASE_PASSWORD`, `REDIS_PASSWORD`
- `SERVER_IP`, `SERVER_USER`, `SERVER_SSH_PASSWORD`, `SERVER_SSH_KEY`
- Any token, key, password, or credential

### 3c. Add environment declaration to the deploy job (optional but recommended)

If the workflow targets staging, add `environment: staging` to the `build-and-deploy` job.
If it targets production, add `environment: production`.
This enables GitHub environment protection rules and approval gates.

---

## Step 4 — Report to the user

After creating/updating all files, output a clear summary:

```
## Infra Config Setup Complete

### Created/Updated
- infra/config.yml
- .github/workflows/deploy-staging-<service>.yml
- .github/workflows/deploy-prod-<service>.yml

### Fill in before committing
Open `infra/config.yml` and replace these placeholders:

| Service | Environment | Field | Placeholder |
|---------|-------------|-------|-------------|
| <service> | staging | port | <FILL_IN> |
| <service> | production | port | <FILL_IN> |

### What stays in GitHub Secrets (do not move)
- SERVER_IP, SERVER_USER, SERVER_SSH_PASSWORD
- DATABASE_URL, REDIS_URL
- Any other passwords, tokens, or credentials

### How to add the next service
1. Add entry to infra/config.yml under staging.services and production.services
2. Add "Load service config" step to the new service's deploy workflow
3. Commit
```

---

## Rules

- Never put secrets, passwords, tokens, or SSH credentials in `infra/config.yml`
- Never hardcode port numbers directly in workflow files — always read from `infra/config.yml`
- The `infra/config.yml` file is committed to git — treat it as public
- `pyyaml` is pre-installed on `ubuntu-latest` GitHub runners — no install step needed
- If unsure whether a value is sensitive, put it in GitHub Secrets, not the config file
