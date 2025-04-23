# Connect Claude Desktop to Grasp

This guide will walk you through hosting Grasp locally and connecting Claude Desktop to it.

Here's a demo video of the final result:

https://github.com/user-attachments/assets/b55b5f76-4faa-45b9-a5ab-4c4295dfdf19

## Prerequisites

- [Docker](https://www.docker.com/get-started/)
- [Claude Desktop](https://claude.ai/download)
- [Anthropic API Key](https://console.anthropic.com/settings/keys)

## Step 1: Host Grasp locally

Run the following commands to pull and start Grasp:

```sh
# Pull the image
docker pull getgrasp/grasp

# Run the container
docker run -d \
  --name grasp-agent \
  -p 3000:3000 \
  -e ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY \
  getgrasp/grasp
```

Replace YOUR_ANTHROPIC_KEY with your actual [Anthropic API Key](https://console.anthropic.com/settings/keys).

Once the container is running, open http://localhost:3000 in your browser to access the Grasp console.

## Step 2: Connect Claude Desktop to Grasp

1. Make sure the MCP server is running. Visit http://localhost:3000/api/mcp/sse, if you see something like this:

```
event: endpoint
data: /api/mcp/messages?sessionId=ccefbb26-a890-4417-bffd-1b985a22c09d
```

Then the MCP server is running properly.

2. Open Claude Desktop and open the settings dialog.

3. Select the "Developer" tab, and click "Edit Config" button.

4. Open the `claude_desktop_config.json` file, add the following configuration:

```json
{
  "mcpServers": {
    "browser-use": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:3000/api/mcp/sse"]
    }
  }
}
```

5. After saving the config, restart Claude Desktop. And you can find the MCP icon in the toolbar.

6. Send some messages to Claude. If the Claude decides to use the browser, it will open a dialog to ask you to allow using the tool. Click "Allow for this chat" to proceed.

7. Visit http://localhost:3000, you can see a live view of the browser screen and the logs of agent's actions.
