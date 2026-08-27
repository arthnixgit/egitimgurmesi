"use client";

import { PackageCard as SharedPackageCard } from "@ega/ui";
import type { PackageProduct } from "../lib/package-catalog";

type PackageCardProps = {
  product: PackageProduct;
};

export function PackageCard({ product }: PackageCardProps) {
  return <SharedPackageCard product={product} />;
}
