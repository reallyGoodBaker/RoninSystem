import { Constructor } from "../types"
import { IApplication } from "./application"

export interface IPlugin {
    readonly name: string
    readonly description: string
    startModule(app: IApplication): void
    stopModule?(app: IApplication): void
}

export interface IPluginLoader {
    loadPlugin(...ctor: Constructor<IPlugin>[]): IPluginLoader
    unloadPlugin(...name: string[]): IPluginLoader
    getPlugin(name: string): IPlugin | undefined
}