# SEO Skill (seoskill.dev) in Cursor

Official product: https://seoskill.dev  
Docs: https://seoskill.dev/docs/getting-started

## What you already have

Your user-level Cursor MCP (`~/.cursor/mcp.json`) runs the **SEO CLI** MCP server (`seo mcp serve`). In chat it appears as the **`user-seo`** tools:

- `seo_list_reports`, `seo_describe_report`, `seo_run_report`
- `seo_list_providers`, `seo_describe_provider`, `seo_run_provider`

CLI on PATH: `seo` (from `npm i -g seo`). Config: `%AppData%\seo\Config`.

## Project skill

This repo includes `.cursor/skills/seo/SKILL.md` (packaged skill from the CLI plus ChatFPL defaults). Cursor should load it for SEO tasks in this workspace.

## Optional: hosted MCP (no crawl)

Add to `.cursor/mcp.json` in this repo (merged with your global MCP):

```json
{
  "mcpServers": {
    "seoskill-hosted": {
      "url": "https://seoskill.dev/mcp"
    }
  }
}
```

First connect opens Google sign-in for Search Console / GA. Hosted tools include `seo_sites`, `seo_report`, `seo_page`, `seo_compare`, `seo_index`, `seo_research`, `seo_data`, `seo_lint`. Site **crawl**, **Bing**, and some analytics need the **CLI on your machine**, not the hosted server.

## Re-run official installer (terminal)

```powershell
npm i -g seo
seo start
seo mcp install --cursor --reinstall
```

## Example prompts

- `Run the SEO report for chatfpl.ai`
- `Why did clicks drop last month? Was it a core update?`
- `Which pages are close to page one for chatfpl.ai?`
- `Show quick wins for sc-domain:chatfpl.ai`

Facts from reports only; the skill does not tell you what to change without evidence.
