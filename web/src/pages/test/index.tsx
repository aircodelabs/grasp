import axios from "axios";
import { useState, useEffect } from "react";
import { UserCircleIcon } from "@heroicons/react/20/solid";
import socket from "../../utils/socket";
import { LivePreview } from "./live-preview";
import { Subheading } from "../../components/heading";
import { Text, Strong } from "../../components/text";
import { Textarea } from "../../components/textarea";
import { Button } from "../../components/button";
import { BasicMessage } from "../../utils/types";

function MessageContent({ content }: { content: BasicMessage["content"] }) {
  return content.map((part, idx) => {
    if (part.type === "text") {
      return <Text key={idx}>{part.text}</Text>;
    }
    if (part.type === "image") {
      return (
        <img
          key={idx}
          className="w-full block"
          src={
            part.dataType === "base64"
              ? `data:${part.mimeType ?? "image/png"};base64,${part.data}`
              : part.data
          }
        />
      );
    }
    if (part.type === "tool_call") {
      return (
        <Text key={idx}>
          Tool call: {part.toolName} {part.args}
        </Text>
      );
    }
    if (part.type === "tool_result") {
      return <MessageContent content={part.content} />;
    }
  });
}

interface Log {
  logId: string;
  message: BasicMessage;
}

export default function Test() {
  const [running, setRunning] = useState(false);
  const [task, setTask] = useState("使用 Google 查询一下今天的天气");
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    socket.on("log", ({ logId, message }: Log) => {
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, { logId, message }];
        // Auto scroll to bottom
        setTimeout(() => {
          const logContainer = document.querySelector("#container");
          if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
          }
        }, 50);
        return newLogs;
      });
    });

    return () => {
      socket.off("log");
    };
  }, []);

  const handleSubmit = async () => {
    setRunning(true);
    try {
      const res = await axios.post("/api/web/operate", { task });
      console.log(res.data);
    } catch (error) {
      console.error("Error occurred while operating:", error);
    }
    setRunning(false);
  };

  /** Test browser action */
  const [browserAction, setBrowserAction] = useState("");
  const [browserActionArgs, setBrowserActionArgs] = useState("");

  const handleBrowserAction = async () => {
    await axios.post("/api/web/test-browser", {
      action: browserAction,
      args: browserActionArgs ? JSON.parse(browserActionArgs) : undefined,
    });
  };

  return (
    <div className="mx-auto flex w-full items-start gap-x-8" id="container">
      <aside className="hidden w-80 shrink-0 lg:flex flex-col gap-4">
        <Subheading>Debug Task</Subheading>
        <Textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter your task"
        />
        <Button onClick={handleSubmit} disabled={running}>
          {running ? "Running..." : "Submit"}
        </Button>
        <Subheading>Logs</Subheading>
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {logs.map(({ logId, message }, idx) => (
              <li key={logId}>
                <div className="relative pb-8">
                  {idx !== logs.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-800"
                    />
                  ) : null}
                  <div className="relative flex items-start space-x-3">
                    <>
                      <div>
                        <div className="relative px-1">
                          <div className="flex size-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white dark:bg-gray-800 dark:ring-gray-800">
                            <UserCircleIcon
                              aria-hidden="true"
                              className="size-5 text-gray-500 dark:text-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <Strong>{message.role.toUpperCase()}</Strong>
                        </div>
                        <div className="mt-2 text-sm text-gray-700 flex flex-col gap-y-1.5">
                          <MessageContent content={message.content} />
                        </div>
                      </div>
                    </>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="sticky top-8 flex-1">
        <LivePreview />
      </main>
    </div>
  );
}
