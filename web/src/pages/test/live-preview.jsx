import { useEffect, useState } from "react";
import socket from "../../utils/socket";

export function LivePreview() {
  const [src, setSrc] = useState("");

  useEffect(() => {
    socket.on("screenshot", (imageSrc) => {
      setSrc(imageSrc);
    });

    return () => {
      socket.off("screenshot");
    };
  }, []);

  return (
    <div>
      {src ? (
        <img
          src={src}
          alt="Live Preview"
          className="rounded shadow-md max-w-full"
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
