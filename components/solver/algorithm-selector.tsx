import { SegmentedSelector } from "@/components/shared/segmented-selector";

type AlgorithmSelectorProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
};

export function AlgorithmSelector({ value, onValueChange, options, disabled }: AlgorithmSelectorProps) {
  return <SegmentedSelector value={value} onValueChange={onValueChange} options={options} disabled={disabled} className="flex flex-wrap justify-start" />;
}
