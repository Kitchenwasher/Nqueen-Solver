import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type SegmentedSelectorOption = {
  label: string;
  value: string;
};

type SegmentedSelectorProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedSelectorOption[];
  disabled?: boolean;
  className?: string;
};

export function SegmentedSelector({ value, onValueChange, options, disabled, className }: SegmentedSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) {
          onValueChange(next);
        }
      }}
      variant="outline"
      size="sm"
      disabled={disabled}
      className={className}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
