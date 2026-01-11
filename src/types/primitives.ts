export type ClassType<T> = new (...args: any[]) => T;
export type ObjectType = { [key: string]: any };
export type Func<T = any, U = any> = (...args: T[]) => U;
export type FuncWithArgs<A extends any[]> = (...args: A) => any;
export type AsyncFunc = (...args: any[]) => Promise<any>;
export type ValueOf<T, U extends keyof T = keyof T> = T[U];
export type Partial<T> = { [P in keyof T]?: T[P] };
export type ValOrArr<T> = { [P in keyof T]?: T[P] | T[P][] };
export type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};
export type Extend<T, U> = T & { [P in keyof U]: U[P] };
export type ExpandObjPropsType<T extends ObjectType, E, U extends keyof T = keyof T> = {
    [name in U]: T[U] | E;
};
export type FilterProps<T, K extends keyof T> = Pick<T, Extract<keyof T, K>>;
