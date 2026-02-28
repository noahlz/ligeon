import type React from 'react'

interface SettingsSectionProps {
  label: string
  children: React.ReactNode
}

export function SettingsSection({ label, children }: SettingsSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</h3>
      {children}
    </div>
  )
}
