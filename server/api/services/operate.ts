import { getBrowser } from "../../browser/index.js";
import { handle } from "../../agent/anthropic/index.js";
import { generateTransactionId, addLog } from "../../utils/logs.js";

export async function operate(task: string) {
  const browser = await getBrowser();

  const transactionId = generateTransactionId();
  const onNewMessage = (message: any) => {
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
  console.log("response", response);
  const result = response
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  console.log("result", result);
  return result;
}
