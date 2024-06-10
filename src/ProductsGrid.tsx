"use client";
import Image from "next/image";
import React from "react";
import { ProductFragment } from "../generated/graphql";

type Product = Pick<ProductFragment, "id" | "name" | "thumbnail" | "pricing">;

const PriceRange = (priceRange: ProductFragment["pricing"]) => {
  const startAmount = priceRange?.priceRange?.start?.gross.amount;
  const stopAmount = priceRange?.priceRange?.stop?.gross.amount;

  const startCurrency = priceRange?.priceRange?.start?.gross.currency;

  return (
    <div>
      <span className="text-sm text-gray-600">
        {startAmount === stopAmount
          ? `${startAmount} ${startCurrency}`
          : `${startAmount} - ${stopAmount} ${startCurrency}`}
      </span>
    </div>
  );
};

// TODO: add to cart
const ProductCard = (product: Product) => {
  return (
    <div className="border p-2 bg-white">
      <p className="text-lg">{product.name}</p>
      {product.pricing && <PriceRange {...product.pricing} />}
      {product.thumbnail && (
        <Image src={product.thumbnail.url} width={256} height={256} alt={product.name} />
      )}
    </div>
  );
};

export const ProductsGrid = ({ products }: { products: Product[] }) => {
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
