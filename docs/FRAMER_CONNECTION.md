# Connecting Cursor to the Framer project

To get up-to-date context from your Framer project (pages, components, structure) while working in this repo, you can connect Cursor to Framer via the **Framer MCP** (Model Context Protocol).

## Steps (do not commit secrets)

1. **Get MCP details from Framer**  
   Framer provides an MCP URL and secret (e.g. in the Framer dashboard or in a doc like `Framer MCP.rtf`). Keep the **secret and full URL out of this repo** (e.g. store only on your machine or in a private note).

2. **Add the Framer MCP server to Cursor**  
   - In Cursor: add an MCP server with `type: "sse"` and the `url` Framer gives you (the URL includes the secret).  
   - Config can live in the project root or in `~/.cursor/mcp.json`.  
   - See [Cursor’s MCP install docs](https://cursor.com/en/install-mcp) for the exact format (e.g. `name: framer`, `type: sse`, `url: ...`).

3. **Restart Cursor**  
   Agent mode will then detect the Framer tool.

4. **Confirm**  
   In the agent panel, ask: “What tools do you have available?” and ensure the Framer MCP is listed. Enable it under Cursor settings → Tools & integrations if needed.

## Security

- **Do not commit** the MCP URL or secret to this repo. The URL contains a secret query parameter; anyone with it could access your Framer project context.
- Keep the connection details in a local file (e.g. `Framer MCP.rtf` on your Desktop) or in Cursor’s MCP config outside the repo.
