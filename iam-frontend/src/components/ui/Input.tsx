import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

export default function Input({ label, name, ...props }: InputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} className="input" {...props} />
    </div>
  );
}
