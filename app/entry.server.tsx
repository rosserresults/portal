import { handleRequest } from "@vercel/react-router/entry.server";
import type { AppLoadContext, EntryContext } from "react-router";
import { RouterContextProvider } from "react-router";

export default async function (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext?: AppLoadContext,
): Promise<Response> {
  // When middleware is enabled, ensure loadContext is a RouterContextProvider
  const context = loadContext instanceof RouterContextProvider 
    ? loadContext 
    : new RouterContextProvider();

  return handleRequest(
    request,
    responseStatusCode,
    responseHeaders,
    routerContext,
    context,
  );
}
