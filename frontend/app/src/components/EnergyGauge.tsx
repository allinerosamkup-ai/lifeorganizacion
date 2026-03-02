interface EnergyGaugeProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

const sizeMap = {
    sm: { w: 56, stroke: 4, text: 'text-sm', label: 'text-[10px]' },
    md: { w: 80, stroke: 5, text: 'text-xl', label: 'text-xs' },
    lg: { w: 110, stroke: 6, text: 'text-3xl', label: 'text-sm' },
};

function getEnergyColor(score: number): string {
    if (score >= 70) return '#22c55e'; // green
    if (score >= 40) return '#eab308'; // yellow
    return '#ef4444'; // red
}

function getEnergyLabel(score: number): string {
    if (score >= 70) return 'Alta';
    if (score >= 40) return 'Média';
    return 'Baixa';
}

export function EnergyGauge({ score, size = 'md', showLabel = true }: EnergyGaugeProps) {
    const { w, stroke, text, label } = sizeMap[size];
    const radius = (w - stroke * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = getEnergyColor(score);

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative" style={{ width: w, height: w }}>
                <svg width={w} height={w} className="-rotate-90">
                    {/* Background circle */}
                    <circle
                        cx={w / 2}
                        cy={w / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={stroke}
                        className="text-stone-200"
                    />
                    {/* Progress arc */}
                    <circle
                        cx={w / 2}
                        cy={w / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        className="transition-all duration-700 ease-out"
                    />
                </svg>
                {/* Center score */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-bold ${text}`} style={{ color }}>
                        {score}
                    </span>
                </div>
            </div>
            {showLabel && (
                <span className={`font-semibold ${label} tracking-wide`} style={{ color }}>
                    Energia {getEnergyLabel(score)}
                </span>
            )}
        </div>
    );
}

export { getEnergyColor, getEnergyLabel };
