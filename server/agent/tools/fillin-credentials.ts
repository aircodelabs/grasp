import { z } from "zod";
import type { Browser } from "../../browser/index.js";
import type { ToolExecutionResult } from "../../utils/types.js";

async function getUsernameByDomain(domain: string) {
  // TODO: implement this
  return "";
}

async function getPasswordByDomainAndUsername(domain: string) {
  // TODO: implement this
  return "";
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
      console.log("fillin_credentials", url, field);

      let resultText = "username";

      const domain = new URL(url).hostname;

      if (field === "username") {
        const textToInput = await getUsernameByDomain(domain);
        if (!textToInput) {
          throw new Error("No username found for domain: " + domain);
        }
        await browser.type(textToInput);
        resultText =
          "Input username successfully, the username is: " + textToInput;
      } else if (field === "password") {
        const textToInput = await getPasswordByDomainAndUsername(domain);
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
