"use client";
import { Message as _Message } from "ai/react";
import Image from "next/image";
import { ProductFragment } from "../../generated/graphql";
import clsx from "clsx";
import React from "react";

type Product = Pick<ProductFragment, "id" | "name" | "thumbnail">;

const ProductCard = (product: Product) => {
  return (
    <div className="border p-2 bg-white">
      <p className="text-lg">{product.name}</p>
      {product.thumbnail && (
        <Image src={product.thumbnail.url} width={256} height={256} alt={product.name} />
      )}
    </div>
  );
};

const ProductsGrid = ({ products }: { products: Product[] }) => {
  return (
    <ul className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard key={product.id} {...product} />
        </li>
      ))}
    </ul>
  );
};

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
