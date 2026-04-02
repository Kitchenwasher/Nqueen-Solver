import { SegmentedSelector } from "@/components/shared/segmented-selector";

type StrategySelectorProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
};

export function StrategySelector({ value, onValueChange, options, disabled }: StrategySelectorProps) {
  return <SegmentedSelector value={value} onValueChange={onValueChange} options={options} disabled={disabled} className="flex flex-wrap justify-start" />;
}
