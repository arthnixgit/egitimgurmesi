"use client";

import { useSyncExternalStore } from "react";

/** A store that never changes: the values below are fixed for the page load. */
const subscribeNever = () => () => {};

/**
 * Reads a value that only exists in the browser (anything derived from
 * `window`) without setting state inside an effect.
 *
 * The obvious `useState` + `useEffect` version triggers a second render pass on
 * every mount and is flagged by react-hooks/set-state-in-effect.
 * `useSyncExternalStore` is the supported way to express "this value comes from
 * outside React, and the server does not have it": the server snapshot renders,
 * the client snapshot takes over on hydration, and there is no cascading render.
 *
 * `read` must return a value that is stable under Object.is across calls,
 * otherwise React will re-render endlessly.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(subscribeNever, read, () => serverValue);
}
