![grasp-banner](https://github.com/user-attachments/assets/a07cd9c9-6b33-4b55-bdf1-81cc8bfb7d96)

<h1 align="center">Grasp</h1>

Grasp is an open-source and self-hosted browser using agent. With built-in support for MCP and A2A support, it can seamlessly integrate with any other AI apps or agents.

Some of the key features include:

- **Isolated browser environment**. Grasp is dockerized, ensuring it never interferes with your local workspace. It can be easily hosted on your machine or in the cloud.
- **Human-like automation**. Grasp operates the browser just like a real human. You can even provide credentials for the agent to log in and retrieve personalized content.
- **Natural language control**. No code needed — simply describe what you want in plain language, and the agent will handle the rest.

https://github.com/user-attachments/assets/aaf14b00-8aff-44ad-a8c4-46f0b85b4e92

## Quick Start

> 🐳 **Before you start:**  
> Make sure [Docker](https://www.docker.com/get-started/) is installed and running on your machine.

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

Once the container is running, open [http://localhost:3000](http://localhost:3000) in your browser to access the Grasp console.

## Stay in the Loop

Grasp is moving fast — we're shipping new features, expanding integrations, and refining the agent experience every week.  
⭐ Star the repo to stay updated and support the project!

## Tutorials

- [Connect Claude Desktop to Grasp](./docs/tutorials/mcp-claude-desktop.md): Use Grasp as a local MCP tool server and enable Claude to operate the browser.
- [Connect agent to Grasp](./docs/tutorials/a2a-agent.md): Integrate Grasp via A2A for agent-to-agent browser automation.

## Community

We’d love to hear from you。

[Join the Discord](https://discord.gg/XFqCA9VqWe) to share ideas, ask questions, or just hang out.

## License

Licensed under the the Apache-2.0 license.
