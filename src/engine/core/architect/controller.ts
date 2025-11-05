import { Actor } from './actor'

export interface IController {
    possess(pawn: Possessable): void
    unPossess(): void
    getPawn<T extends Possessable = Possessable>(): T | undefined
}

export class Controller extends Actor implements IController {
    protected pawn: Possessable | null = null

    possess(pawn: Possessable): void {
        if (this.pawn) {
            throw new Error('Controller already possess a pawn')
        }

        this.pawn = pawn
        pawn.onPossess(this)
    }

    unPossess(): void {
        if (!this.pawn) {
            return
        }

        this.pawn.onUnPossess()
        this.pawn = null
    }

    getPawn<T extends Possessable = Possessable>(): T | undefined {
        return this.pawn as T
    }
}

export abstract class PlayerController extends Actor implements IController {
    protected pawn: Possessable | null = null

    possess(pawn: Possessable): void {
        if (this.pawn) {
            throw new Error('Controller already possess a pawn')
        }

        this.pawn = pawn
        pawn.onPossess(this)
    }

    unPossess(): void {
        if (!this.pawn) {
            return
        }

        this.pawn.onUnPossess()
        this.pawn = null
    }

    getPawn<T extends Possessable = Possessable>(): T | undefined {
        return this.pawn as T
    }

    abstract setupInput(): void
}

export interface Possessable {
    getController<T extends IController = IController>(): T
    onPossess(controller: IController): void
    onUnPossess(): void
}