import { CommandPermissionLevel, CustomCommandResult, CustomCommandOrigin, CustomCommandParameter, CustomCommandParamType, CustomCommandRegistry, CustomCommandStatus } from "@minecraft/server"
import { commandToken } from "../../tools/command_tokenizer/dist/command_tokenizer"
import { Enum, Required, Optional } from '../../tools/command_tokenizer/dist/command_tokenizer'

export interface CommandOptions {
    name: string
    description: string
    permissionLevel: CommandPermissionLevel
    cheatsRequired: boolean
    parameters: (Enum | Required | Optional)[]
}

export const StringParamType = {
    bool        : CustomCommandParamType.Boolean,
    int         : CustomCommandParamType.Integer,
    float       : CustomCommandParamType.Float,
    string      : CustomCommandParamType.String,
    entity      : CustomCommandParamType.EntitySelector,
    actor       : CustomCommandParamType.EntitySelector,
    player      : CustomCommandParamType.PlayerSelector,
    xyz         : CustomCommandParamType.Location,
    pos         : CustomCommandParamType.Location,
    vec         : CustomCommandParamType.Location,
    text        : CustomCommandParamType.String,
    message     : CustomCommandParamType.String,
    json        : CustomCommandParamType.String,
    item        : CustomCommandParamType.ItemType,
    block       : CustomCommandParamType.BlockType,
    // effect      : CustomCommandParamType.Effect,
    enum        : CustomCommandParamType.Enum,
    // softEnum    : CustomCommandParamType.SoftEnum,
    entities    : CustomCommandParamType.EntityType,
    actor_type  : CustomCommandParamType.EntityType,
    // command     : CustomCommandParamType.Command,
    // selector    : CustomCommandParamType.WildcardSelector,
}

const enumMapping = new Map<string[], string>()

export interface CommandHandlerOptions {
    rawArgs: unknown[]
    origin: CustomCommandOrigin
    success(message?: string): void
    failure(message?: string): void
}

export class CommandRegistry {
    static registerFns = new Set<Function>()
    static registerAll(customRegistry: CustomCommandRegistry) {
        for (const fn of CommandRegistry.registerFns) {
            fn(customRegistry)
        }
    }

    static registerFromOptions<T extends { [K: string]: unknown }>(
        { name, description, permissionLevel, cheatsRequired, parameters }: CommandOptions,
        fn: (args: T, options: CommandHandlerOptions) => void
    ) {
        CommandRegistry.registerFns.add((customRegistry: CustomCommandRegistry) => {
            parameters.filter(token => token.type === 'enum').forEach(({ _0 }) => {
                const key = 'ss:enum_' + String(enumMapping.size)
                enumMapping.set(_0, key)
                customRegistry.registerEnum(key, _0)
            })

            const mandatories: CustomCommandParameter[] = []
            const optionals: CustomCommandParameter[] = []
            const paramNames: string[] = []

            parameters.forEach(param => {
                const { type, _0: value } = param
                if (type === 'enum') {
                    const optional = param.optional
                    const key = enumMapping.get(value)
                    if (!key) {
                        return
                    }

                    paramNames.push(key)
                    return (optional ? optionals : mandatories).push({
                        name: key,
                        type: StringParamType.enum,
                    })
                }

                const { name, vType } = value
                if (type === 'required') {
                    paramNames.push(name)
                    return mandatories.push({
                        name,
                        type: StringParamType[vType as keyof typeof StringParamType],
                    })
                }

                if (type === 'optional') {
                    paramNames.push(name)
                    return optionals.push({
                        name,
                        type: StringParamType[vType as keyof typeof StringParamType],
                    })
                }
            })

            customRegistry.registerCommand({
                cheatsRequired,
                name,
                description,
                permissionLevel,
                mandatoryParameters: mandatories,
                optionalParameters: optionals,
            }, (origin, ...params) => {
                const args: Record<string, unknown> = {}
                paramNames.forEach((name, i) => {
                    args[name] = params[i]
                })
                let result: CustomCommandResult = {
                    status: CustomCommandStatus.Success,
                }
                fn(args as T, {
                    rawArgs: params,
                    origin,
                    success(message?: string) {
                        result.status = CustomCommandStatus.Success
                        result.message = message ?? ''
                    },
                    failure(message?: string) {
                        result.status = CustomCommandStatus.Failure
                        result.message = message ?? ''
                    }
                })

                return result
            })
        })

        return this
    }

    static register<T extends { [K: string]: unknown }>(
        name: string,
        description: string,
        template: string,
        fn: (args: T, options: CommandHandlerOptions) => void,
        permissionLevel: CommandPermissionLevel = CommandPermissionLevel.GameDirectors,
        cheatsRequired = true
    ) {
        const parameters = commandToken(template)
        const commandMeta: CommandOptions = {
            name,
            description,
            permissionLevel,
            cheatsRequired,
            parameters,
        }

        return this.registerFromOptions(commandMeta, fn)
    }
}