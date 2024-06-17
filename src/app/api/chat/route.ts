import { openai } from "@ai-sdk/openai";
import { streamText, tool, type CoreMessage } from "ai";
import { gql } from "urql";
import { z } from "zod";
import {
  GetProductsQuery,
  GetProductsQueryVariables,
  GetAttributesQuery,
  GetAttributesQueryVariables,
} from "../../../../generated/graphql";
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

const getAttributesQuery = gql`
  query GetAttributes($first: Int) {
    attributes(first: $first) {
      edges {
        node {
          name
          choices(first: 100) {
            edges {
              node {
                name
              }
            }
          }
        }
      }
    }
  }
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

  const { data: getAttributesResult } = await client.query<GetAttributesQuery>(getAttributesQuery, {
    first: 100,
  } as GetAttributesQueryVariables);

  const { messages }: { messages: CoreMessage[] } = await req.json();

  const attributes = getAttributesResult?.attributes?.edges.map(({ node }) => ({
    [node.name ?? ""]: node.choices?.edges.map(({ node }) => node.name) ?? [],
  }));

  const stringifiedAttributes = JSON.stringify(attributes);

  console.log("Attributes: ", stringifiedAttributes);

  const result = await streamText({
    model: openai("gpt-4-turbo"),
    // TODO: somehow pass context about the shop to the system
    system: `You are an e-commerce shop assistant. You help to find products. You help to fill the search parameters of the Saleor GraphQL query. You must gather information and pass it to query. Dont use markdown when responding. Don't answer questions unrelated to the shop. When the user provides information that doesn't match any known parameter, try pasting it as search. Always use singular English form in search. A search query can have multiple parameters.  The products are described by attributes. Here are the attributes: ${stringifiedAttributes}.`,
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
          const { data: getProductsResult, operation } = await client.query<GetProductsQuery>(
            getProductsQuery,
            {
              first,
              channel: "default-channel",
              filter,
              search,
            } as GetProductsQueryVariables
          );

          console.log("Executed `products` query with: ", JSON.stringify(operation.variables));

          return getProductsResult?.products?.edges.map(({ node }) => node);
        },
      }),
    },
    // TODO: what did I order before?
    // TODO: please add these items to my cart
    // TODO: what's been recently added to the store?
  });

  return result.toAIStreamResponse();
}
