import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router"
import { AppSidebar } from "~/components/app-sidebar"
import { Separator } from "~/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { AppCard } from "~/components/app-card"
import { getAppsForUser } from "~/lib/apps"
import { getUserId, getUserOrgIds } from "~/lib/clerk-helpers"
import type { Route } from "./+types/dashboard"

export async function loader(args: Route.LoaderArgs) {
  const userId = await getUserId(args)
  
  if (!userId) {
    return { apps: [] }
  }

  const orgIds = await getUserOrgIds(args)
  const apps = await getAppsForUser(userId, orgIds)
  
  return { apps }
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { apps } = loaderData

  return (
    <>
      <SignedIn>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-lg font-semibold">Dashboard</h1>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div>
                <h2 className="text-2xl font-bold">Apps</h2>
                <p className="text-muted-foreground">
                  Access your available applications
                </p>
              </div>

              {apps.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <p className="text-muted-foreground">
                    No apps available. Contact your administrator to add apps.
                  </p>
                </div>
              ) : (
                <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {apps.map((app) => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              )}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
