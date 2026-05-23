import React from 'react';
import { Input } from '@/components/ui/input';

interface CapitalizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CapitalizedInput = React.forwardRef<HTMLInputElement, CapitalizedInputProps>(
    ({ onChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const input = e.target;
            const start = input.selectionStart;
            const end = input.selectionEnd;

            // Capitalize first letter
            if (input.value) {
                input.value = input.value.charAt(0).toUpperCase() + input.value.slice(1);
            }

            // Restore cursor position
            input.setSelectionRange(start, end);

            if (onChange) {
                onChange(e);
            }
        };

        return <Input ref={ref} onChange={handleChange} {...props} />;
    }
);

CapitalizedInput.displayName = 'CapitalizedInput';
