export interface WordCases {
    singular: string;
    plural: string;
    plural2: string;
}

export const StringUtils = {
    mirror(s: string): string {
        return s.split("").reverse().join("");
    },

    upperFirstLetter(s: string) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    },

    toFixed(s: string, f: number): string {
        return Number.parseFloat(s).toFixed(f);
    },

    truncateCenter(s: string, n: number): string {
        if (s.length > n * 2) {
            return `${s.substring(0, n)}...${s.substring(s.length - n, s.length)}`;
        }
        return s;
    },

    insertValues(str: string, values: { [key: string]: any }) {
        let stringValues = str;
        for (const key in values) {
            stringValues = StringUtils.replaceAll(stringValues, `\${${key}}`, String(values[key]));
        }
        return stringValues;
    },

    replaceAll(str: string, search: string, replace: string): string {
        return str.replace(new RegExp(StringUtils.escapeRegExp(search), "g"), replace);
    },

    escapeRegExp(str: string): string {
        return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1");
    },
};

export function fup(s: string): string {
    return StringUtils.upperFirstLetter(s);
}

export function withNewLines(s: string): React.ReactNode[] {
    return s.split("\n").map((l, i) => <div key={i.toString()}>{l}</div>);
}

export function cap(s: string): string {
    const parts = s.split(" ");
    return parts.map((p) => fup(p)).join(" ");
}

export function wv(s: string, values: { [key: string]: string }): string {
    return StringUtils.insertValues(s, values);
}
