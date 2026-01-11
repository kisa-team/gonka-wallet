import type { ObjectType } from "@/src/types/primitives";
import type { CallbackWithOptionalData, OptionalData } from "@/src/utils/events/Events";
import Listener from "./Listener";

export default class Event<O extends ObjectType, K extends keyof O> {
    private readonly name: K;
    private readonly keepLastData: boolean;
    private listeners: Map<string, Listener<O, K>> = new Map();
    private currentListener: Listener<O, K> | undefined;
    private enabled: boolean = true;
    private stopped: boolean = false;
    private paused: boolean = false;
    private pausedOnListener: Listener<O, K> | undefined;
    private needSort: boolean = false;
    private resumeData: OptionalData<O, K> | null = null;
    private lastData: OptionalData<O, K> | null = null;

    constructor(name: K, keepLastData: boolean = false) {
        this.name = name;
        this.keepLastData = keepLastData;
    }

    public addListener(listener: Listener<O, K>): Listener<O, K> {
        this.listeners.set(listener.getUuid(), listener);
        if (listener.getPriority() !== Listener.DEFAULT_PRIORITY) {
            this.setNeedSort(true);
        }
        return listener;
    }

    public on<N extends K>(func: CallbackWithOptionalData<O, N>): Listener<O, N> {
        return this.addListener(
            new Listener<O, K>(this, func as (data?: OptionalData<O, K>) => any)
        ) as any as Listener<O, N>;
    }

    public once<N extends K>(func: CallbackWithOptionalData<O, N>): Listener<O, N> {
        return this.on(func).setLimit(1);
    }

    public off(listener: Listener<O, K>) {
        if (this.hasListener(listener)) {
            this.listeners.delete(listener.getUuid());
        }
    }

    public execute(data?: OptionalData<O, K>) {
        if (this.needSort) {
            this.sortListeners();
        }
        if (this.keepLastData && data) {
            this.lastData = data;
        }
        this.executeListeners(data);
    }

    private executeListeners(data?: OptionalData<O, K>) {
        for (const listener of this.listeners.values()) {
            if (!this.enabled) {
                return;
            }

            if (this.stopped) {
                this.stopped = false;
                return;
            }

            if (this.paused && data) {
                this.resumeData = data;
                return;
            } else {
                this.resumeData = null;
            }

            this.currentListener = listener;

            if (this.pausedOnListener) {
                if (this.currentListener === this.pausedOnListener) {
                    this.pausedOnListener = undefined;
                }
                continue;
            }

            if (!this.currentListener.isAlive()) {
                this.off(this.currentListener);
                continue;
            }

            this.currentListener.execute(data);
        }
    }

    public enable() {
        this.enabled = true;
    }

    public disable() {
        this.enabled = false;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public isDisabled(): boolean {
        return !this.isEnabled();
    }

    public pause() {
        if (this.isPaused()) {
            return;
        }

        this.paused = true;
        this.pausedOnListener = this.currentListener;
    }

    public isPaused(): boolean {
        return this.paused;
    }

    public async resume() {
        if (!this.isPaused()) {
            return;
        }

        this.paused = false;
        this.executeListeners(this.resumeData!);
    }

    public stop() {
        this.stopped = true;
    }

    public isStopped(): boolean {
        return this.stopped;
    }

    public setNeedSort(needSort: boolean) {
        this.needSort = needSort;
    }

    public sortListeners() {
        console.warn("Sort listeners in Event", this.name);
        this.setNeedSort(false);
        const sorted = [...this.listeners.values()].sort(
            (a, b) => b.getPriority() - a.getPriority()
        );
        this.listeners.clear();
        for (const listener of sorted) {
            this.listeners.set(listener.getUuid(), listener);
        }
    }

    private hasListener(listener: Listener<O, K>): boolean {
        return this.listeners.has(listener.getUuid());
    }

    public getListenersCount(): number {
        return this.listeners.size;
    }

    public getName(): K {
        return this.name;
    }

    public destroy() {
        this.listeners.clear();
    }

    public getLastData(): OptionalData<O, K> | null {
        return this.lastData;
    }
}
