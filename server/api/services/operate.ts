import { getBrowser } from "../../browser/index.js";
import { handle } from "../../agent/index.js";
import { generateTransactionId, addLog } from "../../utils/logs.js";
import type { BasicMessage } from "../../utils/types.js";

export async function operate(task: string) {
  const browser = await getBrowser();

  const transactionId = generateTransactionId();
  const onNewMessage = (message: BasicMessage) => {
    addLog(transactionId, message);
  };

  addLog(transactionId, {
    role: "user",
    content: [
      {
        type: "text",
        text: task,
      },
    ],
  });

  const provider = (process.env.PROVIDER || "anthropic").toLowerCase();
  const text = await handle(provider, task, browser, onNewMessage);
  return text;
}
