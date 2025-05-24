![banner](https://github.com/user-attachments/assets/6314baa8-4b90-4b0d-ad85-0ef673e2ceca)

<h1 align="center">Grasp</h1>

<p align="center">
  <a href="https://hub.docker.com/r/getgrasp/grasp"><img src="https://img.shields.io/github/actions/workflow/status/aircodelabs/grasp/docker-publish.yml?style=for-the-badge&logo=docker"></a>
  <a href="https://discord.gg/XFqCA9VqWe"><img src="https://img.shields.io/badge/discord%20community-20B2AA?style=for-the-badge&logo=discord"></a>
</p>

Grasp is an open-source and self-hosted agentic browser. With built-in support for MCP and A2A support, it can seamlessly integrate with any other AI apps or agents.

Here’s a quick example of how Grasp works seamlessly with Claude Desktop to make planning your next Airbnb trip:

https://github.com/user-attachments/assets/b55b5f76-4faa-45b9-a5ab-4c4295dfdf19

Some of the key features include:

- **Isolated browser environment**. Grasp is dockerized, ensuring it never interferes with your local workspace. It can be easily hosted on your machine or in the cloud.
- **Human-like automation**. Grasp operates the browser just like a real human. You can even provide credentials for the agent to log in and retrieve personalized content.
- **Natural language control**. No code needed — simply describe what you want in plain language, and the agent will handle the rest.

## Quick Start

> 🐳 **Before you start:**  
> Make sure [Docker](https://www.docker.com/get-started/) is installed and running on your machine.

Run the following commands to pull and start Grasp:

- Pull the image

```sh
docker pull getgrasp/grasp
```

- Run the container

```sh
docker run -d \
  --name grasp-agent \
  -p 3000:3000 \
  -e ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY \
  getgrasp/grasp
```

Replace YOUR_ANTHROPIC_KEY with your actual [Anthropic API Key](https://console.anthropic.com/settings/keys).

Once the container is running, open [http://localhost:3000](http://localhost:3000) in your browser to access the Grasp console.

## Using other providers

You can use providers other than Anthropic.

To use a different provider, copy the `.env.example` file to `.env` and set the corresponding environment variables. Then run Grasp using `.env` file:

```sh
docker run -d \
  --name grasp-agent \
  --env-file .env \
  -p 3000:3000 \
  getgrasp/grasp
```

The supported providers are:

- Anthropic
- OpenAI
- Amazon Bedrock
- Azure OpenAI

Supporting more providers are working in progress. Free free to [file an issue](https://github.com/aircodelabs/grasp/issues) to request a new provider.

## Enable secure auto-login

Grasp can automatically log in to websites for you. This makes it easier to retrieve personalized content or take actions on websites that require authentication. E.g. star a repo on GitHub, check in to a system, get your following list on X, etc.

The action to input your credentials is performed locally, and your password will **NOT** be sent to any LLM, so it's secure and safe.

To enable the auto-login:

- Copy the `.credentials.example.yml` file to `.credentials.yml` and fill in your credentials for each website.

```sh
cp .credentials.example.yml .credentials.yml
```

- Create a `browser-user-data` directory to store the browser's user data. This will enable the persistent mode so you don't need to login again.

```sh
mkdir -p browser-user-data
```

- Run Grasp by mounting the `.credentials.yml` file and `browser-user-data` directory.

```
docker run -d \
  --name grasp-agent \
  --env-file .env \
  -p 3000:3000 \
  -v $(pwd)/.credentials.yml:/app/.credentials.yml \
  -v $(pwd)/browser-user-data:/app/browser-user-data \
  getgrasp/grasp
```

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
