import { Actor } from "@ronin/core/architect/actor"
import { Mod } from "@ronin/core/architect/mod"

export class ReflectConfig {

    static mod: Mod
    static #contextSymbol: Actor

    static set contextActor(actor: Actor) {
        this.#contextSymbol = actor
    }

    static unsafeCtxActor() {
        return this.#contextSymbol
    }

    static contextActorRef() {
        return new ActorWeakRef(this.#contextSymbol)
    }
}

export class ActorWeakRef {
    #actor?: Actor

    constructor(actor: Actor) {
        this.#actor = actor
    }

    deref() {
        if (!this.isValid) {
            return void 0
        }
    
        const returnVal = this.#actor
        this.#actor = void 0
        return returnVal
    }

    get isValid() {
        const actor = this.#actor
        if (actor) {
            // @ts-ignore
            return Boolean(actor?.entity?.isValid)
        }

        return false
    }
}