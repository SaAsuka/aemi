"use client"

import { Combobox } from "@base-ui/react/combobox"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, XIcon } from "lucide-react"

export type ComboboxOption = {
  value: string
  label: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "選択...",
  className,
}: {
  options: ComboboxOption[]
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  className?: string
}) {
  const selectedOption = value
    ? options.find((o) => o.value === value) ?? null
    : null

  return (
    <Combobox.Root
      items={options}
      value={selectedOption}
      onValueChange={(item) => onValueChange(item?.value ?? null)}
      itemToStringLabel={(item) => item?.label ?? ""}
      isItemEqualToValue={(item, val) => item.value === val.value}
      openOnInputClick
    >
      <Combobox.InputGroup
        className={cn(
          "flex items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          className
        )}
      >
        <Combobox.Input
          placeholder={placeholder}
          className="h-8 w-full bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        {value && (
          <Combobox.Clear className="flex shrink-0 items-center justify-center px-1 text-muted-foreground hover:text-foreground">
            <XIcon className="size-3.5" />
          </Combobox.Clear>
        )}
        <Combobox.Trigger className="flex shrink-0 items-center justify-center pr-2 text-muted-foreground">
          <ChevronDownIcon className="size-4" />
        </Combobox.Trigger>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="isolate z-50">
          <Combobox.Popup className="w-(--anchor-width) max-h-60 overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Combobox.Empty className="py-6 text-center text-sm text-muted-foreground">
              該当なし
            </Combobox.Empty>
            <Combobox.List className="p-1">
              {(item: ComboboxOption) => (
                <Combobox.Item
                  value={item}
                  className="relative flex cursor-default items-center rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {item.label}
                  <Combobox.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
