// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class ValueUtils {
    public static readonly FACTOR = 0.01;
    public static readonly OBJECTS = { Object: true, Array: true };

    public static limit(num: number, min: number, max: number): number {
        num = Math.max(min, num);
        return Math.min(max, num);
    }

    public static isNumber(value: any): boolean {
        return typeof value === "number" && Number.isNaN(value) === false && Number.isFinite(value);
    }

    public static isBoolean(value: boolean): boolean {
        return typeof value === "boolean";
    }

    public static isString(value: string): boolean {
        return typeof value === "string";
    }

    public static isObject(variable: any): boolean {
        return typeof variable === "object" && variable !== null;
    }

    public static formatMoney(num: number | string, c = 2, d = ".", t = ",") {
        const s = Number(num) < 0 ? "-" : "";
        const absNum = Math.abs(Number(num) || 0).toFixed(c);
        const i = String(Number.parseInt(absNum, 10));
        const j = i.length > 3 ? i.length % 3 : 0;
        return `${s}${j ? `${i.substring(0, j)}${t}` : ""}${i.substring(j).replace(/(\d{3})(?=\d)/g, `$1${t}`)}${
            c
                ? `${d}${Math.abs(Number(num) - (i as any))
                      .toFixed(c)
                      .slice(2)}`
                : ""
        }`;
    }

    public static floor(num: number, maxDecimals: number): number {
        if (!ValueUtils.isNumber(num) || maxDecimals < 0) {
            return num;
        }

        const multiplier = 10 ** maxDecimals;
        const floored = Math.floor(num * multiplier) / multiplier;

        return floored;
    }
}
