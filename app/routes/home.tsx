import { redirect } from "react-router";
import { getAuth } from "@clerk/react-router/server";
import { RedirectToSignIn } from "@clerk/react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  
  if (userId) {
    return redirect("/dashboard");
  }
  
  return null;
}

export default function Home() {
  return <RedirectToSignIn />;
}
