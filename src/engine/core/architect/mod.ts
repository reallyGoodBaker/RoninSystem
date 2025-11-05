import { StartupEvent } from "@minecraft/server"
import { Resource } from "./resorce"
import { ReflectConfig } from "@ronin/core/architect/reflect"
import { Application } from "./application"

/**
 * 不要直接实现 Mod 接口，请继承 ModBase
 */
export interface Mod extends Resource {
    /**
     * Application 初始化时调用
     */
    start?(app: Application, ev: StartupEvent): void

    /**
     * Application 初始化完成时调用
     * 此时可以访问 actors
     */
    initialized?(app: Application): void

    /**
     * Application 关闭时调用
     */
    exit?(): void
}

export class ModBase implements Mod {

    constructor() {
        Application.modApp = this
        ReflectConfig.mod = this
    }

}