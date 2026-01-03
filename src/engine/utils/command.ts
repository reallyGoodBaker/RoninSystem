import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, Entity } from "@minecraft/server"
import { CommandHandlerOptions, CommandOptions, CommandRegistry } from "@ronin/core/command"
import { Enum, Required, Optional } from '../../tools/command_tokenizer/dist/command_tokenizer'
import { StringParamType } from '../core/command'
import type { IApplication } from "@ronin/core/architect/application"

enum ParamType {
    Enum = 0,
    Required = 1,
    Optional = 2,
    Origin = 3,
    Success = 4,
    Fail = 5,
    App = 6,
}

interface CommandParam {
    optionalEnum?: boolean
    name?: string
    enums?: string[]
    index: number
    argIndex?: number
    argType?: string
    type: ParamType
}

interface CommandMeta {
    name: string
    description: string
    permissionLevel: CommandPermissionLevel
    cheatsRequired: boolean
    decoratedParams: CommandParam[]
    wrapped: (app: IApplication) => (_: unknown, ev: CommandHandlerOptions) => void
}

const commandMetas = new Map<object, CommandMeta>()

function getMeta(obj: object) {
    let meta = commandMetas.get(obj)
    if (!meta) {
        meta = {
            name: "",
            description: "",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            decoratedParams: [],
            wrapped: () => Function.prototype as any,
        }
        commandMetas.set(obj, meta)
    }

    return meta
}

export namespace Param {
    export function Enum(...enums: string[]): ParameterDecorator {
        return (t: any, p: any, i) => {
            const meta = getMeta(t[p])
            meta.decoratedParams.push({
                enums,
                index: i,
                type: ParamType.Enum,
            })
        }
    }

    export function OptionalEnum(...enums: string[]): ParameterDecorator {
        return (t: any, p: any, i) => {
            const meta = getMeta(t[p])
            meta.decoratedParams.push({
                optionalEnum: true,
                enums,
                index: i,
                type: ParamType.Enum,
            })
        }
    }

    export function Required(type: keyof typeof StringParamType, name?: string): ParameterDecorator {
        return (t: any, p: any, i) => {
            const meta = getMeta(t[p])
            meta.decoratedParams.push({
                argType: type,
                name,
                index: i,
                type: ParamType.Required,
            })
        }
    }

    export function Optional(type: keyof typeof StringParamType, name?: string): ParameterDecorator {
        return (t: any, p: any, i) => {
            const meta = getMeta(t[p])
            meta.decoratedParams.push({
                argType: type,
                name,
                index: i,
                type: ParamType.Optional,
            })
        }
    }

    export const Origin: ParameterDecorator = (t: any, p: any, i) => {
        getMeta(t[p]).decoratedParams.push({
            index: i,
            type: ParamType.Origin,
        })
    }

    export const Success: ParameterDecorator = (t: any, p: any, i) => {
        getMeta(t[p]).decoratedParams.push({
            index: i,
            type: ParamType.Success,
        })
    }

    export const Fail: ParameterDecorator = (t: any, p: any, i) => {
        getMeta(t[p]).decoratedParams.push({
            index: i,
            type: ParamType.Optional,
        })
    }

    export const App: ParameterDecorator = (t: any, p: any, i) => {
        getMeta(t[p]).decoratedParams.push({
            index: i,
            type: ParamType.App,
        })
    }

    export type SuccessOutput = (text: string) => void
    export type FailOutput = (text: string) => void
    export type Origin = CustomCommandOrigin
}

function registerCommandFromMeta({
    decoratedParams,
    name,
    description,
    permissionLevel,
    cheatsRequired,
    wrapped
}: CommandMeta, app: IApplication): void {
    const parameters: (Enum | Required | Optional)[] = []
    let rawIndex = 0

    for (const paramemter of decoratedParams.toReversed()) {
        const { name, type, argType, enums, optionalEnum } = paramemter
        const paramName = name ?? `arg${rawIndex}`
        if (type > 2) {
            continue
        }

        if (type === ParamType.Enum) {
            paramemter.argIndex = rawIndex++
            let param = new Enum(enums ?? [ 'default' ])
            if (optionalEnum) {
                param.optional = true
            }

            parameters.push(param)
            continue
        }

        paramemter.argIndex = rawIndex++
        parameters.push(
            type === ParamType.Required ? new Required({ name: paramName, vType: argType! })
                : new Optional({ name: paramName, vType: argType! }))
    }

    CommandRegistry.registerFromOptions({
        name,
        description,
        permissionLevel,
        cheatsRequired,
        parameters,
    }, wrapped(app))

}

export function registerAllFromAnnotations(app: IApplication) {
    for (const meta of commandMetas.values()) {
        registerCommandFromMeta(meta, app)
    }

    commandMetas.clear()
}

export function CustomCommand(
    description: string,
    permissionLevel: CommandPermissionLevel = CommandPermissionLevel.GameDirectors,
    cheatsRequired: boolean = true,
    name?: string,
    namespace: string = "ss",
): MethodDecorator {
    return (target: any, property, descriptor) => {
        const fn = target[property] as CallableFunction
        let meta = getMeta(fn)
        const { decoratedParams } = meta

        const wrapped = (app: IApplication) => (_: unknown, { success, failure, origin, rawArgs }: CommandHandlerOptions) => {
            const fnArgs: unknown[] = []

            for (const { index, type, argIndex, argType } of decoratedParams) {
                if (type < 3) {
                    if (argType === 'actor') {
                        const entities = rawArgs[argIndex as number] as Entity[]
                        fnArgs[index] = entities.map(en => app.getActor(en.id))
                    } else {
                        fnArgs[index] = rawArgs[argIndex as number]
                    }
                    continue
                }

                switch (type) {
                    case ParamType.Origin:
                        fnArgs[index] = origin
                        continue

                    case ParamType.Success:
                        fnArgs[index] = success
                        continue

                    case ParamType.Fail:
                        fnArgs[index] = failure
                        continue

                    case ParamType.App:
                        fnArgs[index] = app
                        continue
                }

            }

            return fn(...fnArgs)
        }

        meta.name = `${namespace}:${name ?? String(property)}`
        meta.description = description
        meta.permissionLevel = permissionLevel
        meta.cheatsRequired = cheatsRequired
        meta.wrapped = wrapped

        return descriptor
    }
}