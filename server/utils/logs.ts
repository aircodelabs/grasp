import { v4 as uuidv4 } from "uuid";
import type { BasicMessage } from "./types.js";

export interface LogData {
  transactionId: string;
  logId: string;
  message: BasicMessage;
}

export type LogListener = (data: LogData) => void;

const listeners: LogListener[] = [];

function generateLogId(): string {
  return uuidv4();
}

export function registerLogListener(listener: LogListener): void {
  listeners.push(listener);
}

export function unregisterLogListener(listener: LogListener): void {
  const index = listeners.indexOf(listener);
  if (index !== -1) {
    listeners.splice(index, 1);
  }
}

export function generateTransactionId(): string {
  return uuidv4();
}

export function addLog(transactionId: string, message: BasicMessage): void {
  listeners.forEach((listener) => {
    listener({
      transactionId,
      logId: generateLogId(),
      message,
    });
  });
}
