import axios from "axios";
import { useState, useEffect } from "react";
import {
  ChatBubbleLeftEllipsisIcon,
  TagIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import socket from "../../utils/socket";
import { Divider } from "../../components/divider";
import { Button } from "../../components/button";
import { LivePreview } from "./live-preview";
import { Textarea } from "../../components/textarea";
import { Subheading } from "../../components/heading";
import { Input } from "../../components/input";
import { Text, Strong } from "../../components/text";

function OneBlock({ block }) {
  if (block.type === "text") {
    return <Text>Text: {block.text}</Text>;
  } else if (block.type === "image") {
    return (
      <img
        class="w-full block"
        src={`data:image/png;base64,${block.source.data}`}
      />
    );
  } else if (block.type === "tool_use") {
    return (
      <Text>
        Tool use: {block.name} {JSON.stringify(block.input)}
      </Text>
    );
  } else if (block.type === "tool_result") {
    return block.content.map((sb) => <OneBlock block={sb} />);
  }
}

export default function Test() {
  const [running, setRunning] = useState(false);
  const [task, setTask] = useState("查询一下今天的天气");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    socket.on("log", ({ logId, message }) => {
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
      // setLogs((prevLogs) => [
      //   ...prevLogs,
      //   {
      //     logId: Date.now(),
      //     message: {
      //       role: "error",
      //       content: {
      //         type: "text",
      //         text: `Error occurred while operating: ${error.message}`,
      //       },
      //     },
      //   },
      // ]);
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
        {/* <Subheading>Task</Subheading>
        <Textarea
          name="task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />
        <Button onClick={handleSubmit} disabled={running}>
          {running ? "Running..." : "Submit"}
        </Button>
        <Divider /> */}
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
                          <Strong>
                            {message.role === "user"
                              ? "TOOL RESULT"
                              : message.role.toUpperCase()}
                          </Strong>
                        </div>
                        <div className="mt-2 text-sm text-gray-700 flex flex-col gap-y-1.5">
                          {message.content.map((block) => (
                            <OneBlock block={block} />
                          ))}
                        </div>
                      </div>
                    </>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {/* <Divider />
        <Subheading>Browser</Subheading>
        <div className="flex flex-col gap-y-2">
          <p>Action</p>
          <Input
            value={browserAction}
            onChange={(e) => setBrowserAction(e.target.value)}
          />
          <p>Args</p>
          <Input
            value={browserActionArgs}
            onChange={(e) => setBrowserActionArgs(e.target.value)}
          />
        </div>
        <Button onClick={handleBrowserAction}>Test</Button> */}
      </aside>

      <main className="sticky top-8 flex-1">
        <LivePreview />
      </main>
    </div>
  );
}
