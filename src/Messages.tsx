"use client";
import { Message as _Message } from "ai/react";
import clsx from "clsx";
import React from "react";
import { ProductsGrid } from "./ProductsGrid";

const Tool = (message: _Message) => {
  return message.toolInvocations?.map((i) => {
    if (i.toolName === "getProducts" && "result" in i) {
      return <ProductsGrid key={i.toolCallId} products={i.result} />;
    }
  });
};

const Pill = ({
  className,
  ...props
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => {
  return <div className={clsx("border rounded-md py-2 px-4 shadow-sm", className)} {...props} />;
};

const Message = (message: _Message) => {
  return (
    <div className={clsx("p-2 flex", message.role === "user" ? "justify-end" : "justify-start")}>
      <Pill
        className={clsx(message.role === "user" ? "bg-white" : "bg-stone-200/60 text-stone-900")}
      >
        {message.content}
        <Tool {...message} />
      </Pill>
    </div>
  );
};

export const Messages = ({ messages }: { messages: _Message[] }) => {
  return (
    <>
      {messages.map((message) => (
        <Message key={message.id} {...message} />
      ))}
    </>
  );
};
