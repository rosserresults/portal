import { Checkbox } from "~/components/ui/checkbox"
import { Label } from "~/components/ui/label"

interface AppOrgSelectorProps {
  selectedOrgIds: string[]
  onSelectionChange: (orgIds: string[]) => void
  disabled?: boolean
  organizations?: Array<{ id: string; name: string }>
}

export function AppOrgSelector({
  selectedOrgIds,
  onSelectionChange,
  disabled = false,
  organizations = [],
}: AppOrgSelectorProps) {
  if (!organizations || organizations.length === 0) {
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
        {organizations.map((org) => (
          <div key={org.id} className="flex items-center space-x-2">
            <Checkbox
              id={`org-${org.id}`}
              checked={selectedOrgIds.includes(org.id)}
              onCheckedChange={() => handleOrgToggle(org.id)}
              disabled={disabled}
            />
            <Label
              htmlFor={`org-${org.id}`}
              className="flex-1 cursor-pointer font-normal"
            >
              {org.name}
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
