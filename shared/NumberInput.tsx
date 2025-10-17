import React from "react";
import { Input } from "../ui/input";
export default function NumberInput({ value, onChange, ...rest }: { value: string; onChange: (v: string)=>void } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="number" inputMode="decimal" step="0.1" min="0.1" className="text-right" value={value} onChange={(e)=>onChange(e.target.value)} {...rest} />;
}