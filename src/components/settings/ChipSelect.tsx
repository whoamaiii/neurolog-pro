import React from 'react';

export const ChipSelect: React.FC<{
    options: readonly { value: string; label: string }[] | string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    maxSelect?: number;
}> = ({ options, selected, onChange, maxSelect }) => {
    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(s => s !== value));
        } else if (!maxSelect || selected.length < maxSelect) {
            onChange([...selected, value]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => {
                const value = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label;
                const isSelected = selected.includes(value);

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => toggleOption(value)}
                        className={`
                            px-3 py-1.5 rounded-full text-sm font-medium transition-all
                            ${isSelected
                                ? 'bg-primary text-white'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            }
                        `}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
};
