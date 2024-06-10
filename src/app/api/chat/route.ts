import { openai } from "@ai-sdk/openai";
import { streamText, tool, type CoreMessage } from "ai";
import { gql } from "urql";
import { z } from "zod";
import { GetProductsQuery, GetProductsQueryVariables } from "../../../../generated/graphql";
import { createClient } from "../../../lib/create-graphq-client";
import { saleorApp } from "../../../saleor-app";

const productFragment = gql`
  fragment Product on Product {
    id
    name
    pricing {
      priceRange {
        start {
          gross {
            amount
            currency
          }
        }
        stop {
          gross {
            amount
            currency
          }
        }
      }
    }
    thumbnail(size: 256, format: WEBP) {
      url
      alt
    }
  }
`;

const getProductsQuery = gql`
  query GetProducts($first: Int, $channel: String, $filter: ProductFilterInput, $search: String) {
    products(first: $first, channel: $channel, filter: $filter, search: $search) {
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
    // TODO: somehow pass context about the shop to the system
    system:
      "You are an e-commerce shop assistant. You help to find products. Don't answer questions unrelated to the shop. When the user provides information that doesn't match any known parameter, try pasting it as search. Always use singular form in search. Keep in mind the previous messages and the context when searching.",
    messages,
    tools: {
      getProducts: tool({
        description: "Get a list of products from API.",
        // TODO: add parameters
        parameters: z.object({
          first: z.number().optional().describe("Number of products to fetch"),
          search: z
            .string()
            .optional()
            .describe("Search query. Use it to search for products by name"),
          filter: z
            .object({
              price: z
                .object({
                  gte: z.number().optional().describe("Minimum price"),
                  lte: z.number().optional().describe("Maximum price"),
                })
                .optional()
                .describe("Price range filter"),
            })
            .optional()
            .describe("Filter products"),
        }),
        execute: async ({ first = 10, filter, search }) => {
          const { data, operation } = await client.query<GetProductsQuery>(getProductsQuery, {
            first,
            channel: "default-channel",
            filter,
            search,
          } as GetProductsQueryVariables);

          console.log("Exected `products` query with: ", JSON.stringify(operation.variables));

          return data?.products?.edges.map(({ node }) => node);
        },
      }),
    },
    // TODO: what did I order before?
    // TODO: please add these items to my cart
    // TODO: what's been recently added to the store?
  });

  return result.toAIStreamResponse();
}
