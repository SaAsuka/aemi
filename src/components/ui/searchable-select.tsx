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
          "flex h-9 items-center rounded-lg border border-neutral-300 bg-white transition-colors hover:border-neutral-400 focus-within:border-neutral-950 focus-within:ring-2 focus-within:ring-neutral-950/10",
          className
        )}
      >
        <Combobox.Input
          placeholder={placeholder}
          className="h-full w-full bg-transparent px-3 text-base text-neutral-950 outline-none placeholder:text-neutral-400 sm:text-sm"
        />
        {value && (
          <Combobox.Clear aria-label="選択を外す" className="flex shrink-0 items-center justify-center px-1 text-neutral-400 hover:text-neutral-950">
            <XIcon className="size-3.5" />
          </Combobox.Clear>
        )}
        <Combobox.Trigger className="flex shrink-0 items-center justify-center pr-2.5 text-neutral-500">
          <ChevronDownIcon className="size-4" />
        </Combobox.Trigger>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="isolate z-50">
          <Combobox.Popup className="w-(--anchor-width) max-h-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white text-neutral-950 shadow-xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Combobox.Empty className="py-6 text-center text-sm text-neutral-500">
              見つかりませんでした
            </Combobox.Empty>
            <Combobox.List className="p-1">
              {(item: ComboboxOption) => (
                <Combobox.Item
                  value={item}
                  className="relative flex cursor-default items-center rounded-md py-2 pr-8 pl-3 text-sm outline-hidden select-none data-highlighted:bg-neutral-100"
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
