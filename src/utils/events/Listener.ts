import type { ObjectType } from "@/src/types/primitives";
import type { CallbackWithOptionalData, OptionalData } from "@/src/utils/events/Events";
import { Randomize } from "@/src/utils/Randomize";
import type Event from "./Event";

export default class Listener<O extends ObjectType = ObjectType, K extends keyof O = keyof O> {
    public static DEFAULT_PRIORITY: number = 0;
    private readonly uuid: string = Randomize.getUuid();
    private event: Event<O, K> | undefined;
    private func: CallbackWithOptionalData<O, K> | undefined;
    private enabled: boolean = true;
    private priority: number = Listener.DEFAULT_PRIORITY;
    private executedTimes: number = 0;
    private limit: number | undefined;
    private alive: boolean = true;

    constructor(event: Event<O, K>, func: CallbackWithOptionalData<O, K>) {
        this.event = event;
        this.func = func;
    }

    public execute(data?: OptionalData<O, K>) {
        if (!this.alive) {
            return;
        }

        if (this.limit && ++this.executedTimes >= this.limit) {
            this.alive = false;
        }

        if (this.func) {
            this.func(data);
        }
    }

    public isAlive(): boolean {
        return this.alive;
    }

    public setPriority(priority: number): this {
        this.priority = priority;
        this.event?.setNeedSort(true);
        return this;
    }

    public getPriority(): number {
        return this.priority;
    }

    public setLimit(limit: number): this {
        this.limit = limit;
        return this;
    }

    public getLimit(): number | undefined {
        return this.limit;
    }

    public getUuid(): string {
        return this.uuid;
    }

    public getEvent(): Event<O, K> | undefined {
        return this.event;
    }

    public enable() {
        if (this.isDisabled()) {
            this.getEvent()?.addListener(this);
            this.enabled = true;
        }
    }

    public disable() {
        if (this.isEnabled()) {
            this.getEvent()?.off(this);
            this.enabled = false;
        }
    }

    private isEnabled(): boolean {
        return this.enabled;
    }

    private isDisabled(): boolean {
        return !this.enabled;
    }

    public isListener(): boolean {
        return true;
    }

    public destroy() {
        this.getEvent()?.off(this);
        this.event = undefined;
        this.func = undefined;
    }
}
