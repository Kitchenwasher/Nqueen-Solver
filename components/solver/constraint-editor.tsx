import { SegmentedSelector } from "@/components/shared/segmented-selector";

type ConstraintEditorProps = {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

const options = [
  { value: "play", label: "Play Queens" },
  { value: "preplace", label: "Pre-place" },
  { value: "blocked", label: "Block" },
  { value: "forbidden", label: "Forbid" },
  { value: "erase", label: "Erase" }
];

export function ConstraintEditor({ value, onValueChange, disabled }: ConstraintEditorProps) {
  return <SegmentedSelector value={value} onValueChange={onValueChange} options={options} disabled={disabled} className="flex flex-wrap justify-start" />;
}
