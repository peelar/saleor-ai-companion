import { openai } from "@ai-sdk/openai";
import { streamText, tool, type CoreMessage } from "ai";
import { gql } from "urql";
import { z } from "zod";
import { GetProductsQuery } from "../../../../generated/graphql";
import { createClient } from "../../../lib/create-graphq-client";
import { saleorApp } from "../../../saleor-app";

const productFragment = gql`
  fragment Product on Product {
    id
    name
    thumbnail(size: 256, format: WEBP) {
      url
      alt
    }
  }
`;

const getProductsQuery = gql`
  query GetProducts {
    products(first: 10, channel: "default-channel") {
      edges {
        node {
          ...Product
        }
      }
    }
  }
  ${productFragment}
`;

async function createSaleorClient() {
  const apls = await saleorApp.apl.getAll();
  const authData = apls[0];

  return createClient(authData.saleorApiUrl, async () => ({ token: authData.token }));
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const client = await createSaleorClient();

  const { messages }: { messages: CoreMessage[] } = await req.json();

  const result = await streamText({
    model: openai("gpt-3.5-turbo"),
    system: "You are a helpful assistant.",
    messages,
    tools: {
      getProducts: tool({
        description: "Gets products from Saleor API",
        parameters: z.object({}),
        execute: async () => {
          const { data } = await client.query<GetProductsQuery>(getProductsQuery, {});

          return data?.products?.edges.map(({ node }) => node);
        },
      }),
    },
  });

  return result.toAIStreamResponse();
}
