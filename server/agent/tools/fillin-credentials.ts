import { z } from "zod";
import type { Browser } from "../../browser/index.js";
import type { ToolExecutionResult } from "../../utils/types.js";
import path from "path";
import fs from "fs";
import yaml from "yaml";

const CREDENTIALS_BASE_PATH =
  process.env.NODE_ENV === "production" ? "/app" : process.cwd();
const CREDENTIALS_FILE = path.join(CREDENTIALS_BASE_PATH, ".credentials.yml");

let credentialsDB: Record<string, Record<string, string>> = {};

if (fs.existsSync(CREDENTIALS_FILE)) {
  credentialsDB = yaml.parse(fs.readFileSync(CREDENTIALS_FILE, "utf8"));
}

async function getUsernameByDomain(domain: string) {
  return credentialsDB[domain]?.username;
}

async function getPasswordByDomain(domain: string) {
  return credentialsDB[domain]?.password;
}

export default function createTool(browser: Browser) {
  return {
    name: "fillin_credentials",
    description:
      "Fill in username or password into the input field on a website. User do not to provide the credentials, this tool will get the credentials from the database, this tool will get the credentials from the database. Remember this tool only fill in the text, can not perform click or any other action. So you need first click on the input field, and then use this tool.",
    parameters: z.object({
      url: z.string().describe("The full URL of the website are currently on."),
      field: z.enum(["username", "password"]).describe("The field to fill in."),
    }),
    execute: async ({
      url,
      field,
    }: {
      url: string;
      field: "username" | "password";
      username?: string;
    }): Promise<ToolExecutionResult> => {
      let resultText = "username";

      const domain = new URL(url).hostname;

      if (field === "username") {
        const textToInput = await getUsernameByDomain(domain);

        if (!textToInput) {
          return {
            text: `No username found for domain: ${domain}. It's maybe the user didn't provide this credential. Try to achieve the task without login.`,
          };
        }

        await browser.type(textToInput);
        resultText =
          "Input username successfully, the username is: " + textToInput;
      } else if (field === "password") {
        const textToInput = await getPasswordByDomain(domain);
        if (!textToInput) {
          throw new Error("No password found for domain: " + domain);
        }
        await browser.type(textToInput);
        resultText = "Input password successfully.";
      }

      return {
        text: resultText,
      };
    },
  };
}
