export type RequestData = { timestamp: string; value: number };
export type Parameter = { name: string; value: number | string };
export type Prediction = { data: RequestData[] };

function getParameter(parameters: Parameter[] | undefined, name: string, fallback: number): number {
    if (!parameters) { return fallback; }
    const p = parameters.find((x) => x.name === name);
    if (!p) { return fallback; }
    const v = typeof p.value === "number" ? p.value : Number(p.value);
    return Number.isFinite(v) ? v : fallback;
}

function addIsoWeeks(base: Date, weeks: number): string {
    const date = new Date(base);
    date.setUTCDate(date.getUTCDate() + weeks * 7);
    date.setUTCHours(0, 0, 0, 0);
    return date.toISOString();
}

function computeEMA(values: number[], alpha: number): number[] {
    if (!values.length) return [];
    const result: number[] = [];
    let previousValue = values[0];
    result.push(previousValue);
    for (let i = 1; i < values.length; i++) {
        const currentValue = values[i];
        const e = alpha * currentValue + (1 - alpha) * previousValue;
        result.push(e);
        previousValue = e;
    }
    return result;
}

function fitLinearTrend(y: number[]): { a: number; b: number } {
    const n = y.length;
    if (n === 0) return { a: 0, b: 0 };
    if (n === 1) return { a: y[0], b: 0 };

    const xMean = (n - 1) / 2;
    const yMean = y.reduce((s, v) => s + v, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
        const dx = i - xMean;
        num += dx * (y[i] - yMean);
        den += dx * dx;
    }
    if (den === 0) return { a: yMean, b: 0 };
    const b = num / den;
    const a = yMean - b * xMean;
    return { a, b };
}

export function predictSales(params: Parameter[] | undefined, data: RequestData[]): Prediction {
    const rawAlpha = getParameter(params, "ema_alpha", 0.3);
    const alpha = Math.max(0.01, Math.min(0.99, rawAlpha));
    const future = Math.max(1, Math.floor(getParameter(params, "future_weeks", 10)));

    if (!Array.isArray(data) || data.length === 0) return { data: [] };

    const sorted = [...data].slice().sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const values = sorted.map((d) => d.value);

    if (values.length === 1) {
        const single = Math.round(values[0]);
        const out: RequestData[] = [{ timestamp: sorted[0].timestamp, value: single }];
        const lastDate = new Date(sorted[0].timestamp);
        for (let i = 1; i <= future; i++) {
            out.push({ timestamp: addIsoWeeks(lastDate, i), value: single });
        }
        return { data: out };
    }

    const ema = computeEMA(values, alpha);

    const { a, b } = fitLinearTrend(ema);

    const fitted: RequestData[] = [];
    for (let i = 0; i < sorted.length; i++) {
        const fittedVal = a + b * i;
        fitted.push({
            timestamp: sorted[i].timestamp,
            value: Math.round(fittedVal)
        });
    }

    const lastDate = new Date(sorted[sorted.length - 1].timestamp);
    const forecast: RequestData[] = [];
    for (let i = 1; i <= future; i++) {
        const idx = sorted.length - 1 + i;
        const val = a + b * idx;
        forecast.push({
            timestamp: addIsoWeeks(lastDate, i),
            value: Math.round(val)
        });
    }

    return { data: [...fitted, ...forecast] };
}
