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

  const providerNameOriginal = process.env.PROVIDER || "anthropic";
  const providerName = providerNameOriginal.toLowerCase();
  const text = await handle(providerName, task, browser, onNewMessage);
  return text;
}
