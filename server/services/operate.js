import { getBrowser } from "../../browser/index.js";
import { handle } from "../../agent/anthropic/index.js";
import { generateTransactionId, addLog } from "../../utils/logs.js";

export async function operate(task) {
  const browser = await getBrowser();

  const transactionId = generateTransactionId();
  const onNewMessage = (message) => {
    addLog(transactionId, message);
  };

  addLog(transactionId, {
    role: "task",
    content: [
      {
        type: "text",
        text: task,
      },
    ],
  });
  const response = await handle(task, browser, onNewMessage);

  return response;
}
