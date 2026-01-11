import type Listener from "./Listener";

export default class Listeners {
    private _listeners: Listener[] = [];

    public add(listener: Listener): this {
        this._listeners.push(listener);
        return this;
    }

    public addListeners(...listeners: Listener[]): this {
        listeners.forEach((item) => {
            this.add(item);
        });
        return this;
    }

    public enable(): this {
        this._listeners.forEach((listener) => {
            listener.enable();
        });
        return this;
    }

    public disable(): this {
        this._listeners.forEach((listener) => {
            listener.disable();
        });
        return this;
    }

    public destroy() {
        this.disable();
        this._listeners = [];
    }
}
