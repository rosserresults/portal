import { useOrganizationList } from "@clerk/react-router"
import { Checkbox } from "~/components/ui/checkbox"
import { Label } from "~/components/ui/label"
import { Skeleton } from "~/components/ui/skeleton"

interface AppOrgSelectorProps {
  selectedOrgIds: string[]
  onSelectionChange: (orgIds: string[]) => void
  disabled?: boolean
}

export function AppOrgSelector({
  selectedOrgIds,
  onSelectionChange,
  disabled = false,
}: AppOrgSelectorProps) {
  const { organizationList, isLoaded } = useOrganizationList()

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    )
  }

  if (!organizationList || organizationList.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        No organizations available. Create an organization in Clerk to assign apps to it.
      </div>
    )
  }

  const handleOrgToggle = (orgId: string) => {
    if (selectedOrgIds.includes(orgId)) {
      onSelectionChange(selectedOrgIds.filter((id) => id !== orgId))
    } else {
      onSelectionChange([...selectedOrgIds, orgId])
    }
  }

  return (
    <div className="space-y-3">
      <Label>Organizations</Label>
      <div className="space-y-2 rounded-lg border p-3">
        {organizationList.map(({ organization }) => (
          <div key={organization.id} className="flex items-center space-x-2">
            <Checkbox
              id={`org-${organization.id}`}
              checked={selectedOrgIds.includes(organization.id)}
              onCheckedChange={() => handleOrgToggle(organization.id)}
              disabled={disabled}
            />
            <Label
              htmlFor={`org-${organization.id}`}
              className="flex-1 cursor-pointer font-normal"
            >
              {organization.name}
            </Label>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Select organizations that should have access to this app. Leave empty if app is public.
      </p>
    </div>
  )
}
