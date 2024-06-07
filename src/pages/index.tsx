"use client";

import { useChat } from "ai/react";
import { Messages } from "./Messages";

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "api/chat",
    initialMessages: [
      {
        content: "Hello! I am your Saleor Store AI companion. How can I help you today?",
        role: "assistant",
        id: "1",
      },
    ],
  });

  return (
    <div className="overflow-y-auto flex flex-col gap-2">
      <Messages messages={messages} />
      <hr className="my-2 bg-black" />
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-6">
          <input
            placeholder="Message Saleor AI companion"
            className="col-span-5 p-2"
            name="prompt"
            value={input}
            onChange={handleInputChange}
            id="input"
          />
          <button className="col-span-1 bg-stone-700 text-white p-2" type="submit">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
