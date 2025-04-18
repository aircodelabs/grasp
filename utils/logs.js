import { v4 as uuidv4 } from "uuid";

const listeners = [];

function generateLogId() {
  return uuidv4();
}

export function registerLogListener(listener) {
  listeners.push(listener);
}

export function unregisterLogListener(listener) {
  listeners.splice(listeners.indexOf(listener), 1);
}

export function generateTransactionId() {
  return uuidv4();
}

export function addLog(transactionId, message) {
  listeners.forEach((listener) => {
    listener({
      transactionId,
      logId: generateLogId(),
      message,
    });
  });
}
