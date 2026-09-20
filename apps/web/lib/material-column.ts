import type { ExplorerMaterial } from "../components/free-materials-explorer";
import type { ResourceLink } from "./free-materials";

export type MaterialCategoryLike = {
  label: string;
  items: readonly ResourceLink[];
};

/**
 * Flattens the category tree into the single ordered column the free materials
 * page renders.
 *
 * The page used to list categories, so reaching one PDF took two clicks and no
 * material was visible at a glance. Each material now carries its category as a
 * kicker instead: the grouping stays legible without costing a click.
 *
 * Order is category order, then item order within it — both already set by the
 * admin panel's sort fields, so an editor's arrangement carries through.
 */
export function flattenMaterials(categories: readonly MaterialCategoryLike[]): ExplorerMaterial[] {
  return categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      categoryLabel: category.label
    }))
  );
}

/**
 * Splits the column into the left and right stacks that flank the detail pane.
 *
 * The left stack takes the extra card when the count is odd, so the two columns
 * stay balanced and the taller one is on the side the eye starts from.
 */
export function splitIntoColumns<T>(items: readonly T[]): { left: T[]; right: T[] } {
  const half = Math.ceil(items.length / 2);

  return {
    left: items.slice(0, half),
    right: items.slice(half)
  };
}
