import type { ObjectType, ValueOf } from "../../types/primitives";
import Event from "./Event";
import type Listener from "./Listener";

export type OptionalData<O extends ObjectType, K extends keyof O> = ValueOf<O, K> extends void
    ? undefined
    : ValueOf<O, K>;
export type CallbackWithOptionalData<O extends ObjectType, K extends keyof O> = (
    data?: OptionalData<O, K>
) => any;

type EventMap<O extends ObjectType> = {
    [K in keyof O]?: Event<O, K>;
};

export default class Events<O extends ObjectType, K extends keyof O = keyof O> {
    private events: EventMap<O> = {};

    public emit<N extends K>(name: N, data?: OptionalData<O, N>) {
        const event = this.getEvent(name);
        event.execute(data);
    }

    public on<N extends K>(name: N, func: CallbackWithOptionalData<O, N>): Listener<O, N> {
        return this.getEvent(name).on(func);
    }

    public once<N extends K>(name: N, func: CallbackWithOptionalData<O, N>): Listener<O, N> {
        return this.getEvent(name).once(func);
    }

    public getEvent<N extends K>(name: N, keepLastData: boolean = false): Event<O, N> {
        const existingEvent = this.events[name];
        if (!existingEvent) {
            const newEvent = new Event<O, N>(name, keepLastData);
            this.events[name] = newEvent;
            return newEvent;
        }
        return existingEvent;
    }

    public destroy() {
        for (const key in this.events) {
            const event = this.events[key];
            if (event) {
                event.destroy();
            }
        }
        this.events = {};
    }
}
