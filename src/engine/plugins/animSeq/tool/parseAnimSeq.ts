import path from "path"
import { resourcePath, RealRoot } from "../../../utils/tool/conf"
import { walk } from "../../../utils/tool/file"
import fs from 'fs'

export enum AnimPlayingType {
    Once = 0,
    Loop = 1,
    HoldOnLastFrame = 2,
}

export interface AnimationMeta {
    name: string
    duration: number
    override: boolean
    playingType: AnimPlayingType
}

export interface AnimSeqMeta {
    animation: AnimationMeta
    notifies: Record<string, number>
    states: Record<string, [number, number]>
}

function upperCamel(name: string) {
    return name[0].toUpperCase() + name.slice(1)
}

function lowerCamel(name: string) {
    return name[0].toLowerCase() + name.slice(1)
}

function getAnimGenMeta(name: string) {
    const [ _, ...parts ] = name.split('.')
    if (parts.length <= 0) {
        throw new Error(`Invalid animation name: ${name}`)
    }

    if (parts.length == 1) {
        return {
            className: 'Public' + upperCamel(parts[0]),
            namespace: ''
        }
    }

    if (parts.length == 2) {
        return {
            className: upperCamel(parts[0]) + upperCamel(parts[1]),
            namespace: ''
        }
    }

    const namePart = parts.pop() as string
    const descPart = parts.pop() as string
    return {
        className: upperCamel(descPart) + upperCamel(namePart),
        namespace: parts.join('/')
    }
}

interface AnimSeqEvent {
    tick: number
    name: string
}

function getAnimSeqEvents(animSeq: AnimSeqMeta) {
    const { notifies, states } = animSeq
    const animEvents: AnimSeqEvent[] = []

    for (const k in notifies) {
        const time = notifies[k]
        animEvents.push({
            tick: Math.ceil(time * 20),
            name: 'notify' + upperCamel(k)
        })
    }

    for (const k in states) {
        const [ start, end ] = states[k]
        animEvents.push({
            tick: Math.ceil(start * 20),
            name: `state${upperCamel(k)}Start`
        })
        animEvents.push({
            tick: Math.ceil(end * 20),
            name: `state${upperCamel(k)}End`
        })
    }

    return animEvents
}

function methodCode({ name }: AnimSeqEvent) {
    return `
    protected ${name}() {

    }`
}

function animSeqCode(animSeqMeta: AnimSeqMeta) {
    const animMeta = animSeqMeta.animation
    const { className, namespace } = getAnimGenMeta(animMeta.name)
    const animEvents = getAnimSeqEvents(animSeqMeta)
    const fileName = lowerCamel(className)
    const code =
`import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence } from '@ronin/plugins/animSeq/anim'
import animNotifies from './${fileName}.json'

@AnimationSequence
export class ${className}Sequence extends AnimSequence {
    static animation = '${animMeta.name}'
    readonly animation = '${animMeta.name}'
    readonly duration = ${Math.floor(animMeta.duration * 20)}
    readonly playingType: AnimPlayingType = ${animMeta.playingType}
    readonly override = ${animMeta.override}
    readonly animNotifies = animNotifies as AnimSeqEvent[]

${animEvents.map(methodCode).join('\n')}
}
`
    return {
        folder: namespace,
        code,
        fileName,
        events: animEvents
    }
}

function getAnimPlayingType(loop: boolean | string) {
    if (loop == true) {
        return AnimPlayingType.Loop
    }

    if (loop == false) {
        return AnimPlayingType.Once
    }

    return AnimPlayingType.HoldOnLastFrame
}

function getAnimSeqMeta() {
    const notifiesPath = resourcePath('anim_notifies')
    const animationPath = resourcePath('animations')
    const notifies: Record<string, AnimSeqMeta> = {}
    const animations: Record<string, AnimationMeta> = {}

    walk(animationPath, filePath => {
        const buffer = fs.readFileSync(filePath)
        if (filePath.endsWith('.json')) {
            const animDef = JSON.parse(buffer.toString()).animations
            for (const k in animDef) {
                const anim = animDef[k]
                animations[k] = {
                    name: k,
                    override: anim.override_previous_animation ?? false,
                    duration: anim.animation_length ?? Infinity,
                    playingType: getAnimPlayingType(anim.loop)
                }
            }
        }
    })

    walk(notifiesPath, filePath => {
        const buffer = fs.readFileSync(filePath)
        if (filePath.endsWith('.json')) {
            const notifyDef = JSON.parse(buffer.toString()).anim_notifies
            for (const k in notifyDef) {
                const anim = notifyDef[k]
                const animMeta = animations[k]
                if (animMeta) {
                    const animSeq: AnimSeqMeta = {
                        animation: animMeta,
                        notifies: {},
                        states: {}
                    }

                    notifies[k] = animSeq

                    for (const notifyKey in anim) {
                        const data = anim[notifyKey]
                        if (Array.isArray(data)) {
                            animSeq.states[notifyKey] = data as [number, number]
                            continue
                        }

                        animSeq.notifies[notifyKey] = data as number
                    }
                }
            }
        }
    })

    return notifies
}


function writeCode(folder: string, fileName: string, code: string, events: AnimSeqEvent[], exportPath: string) {
    const filePath = path.join(RealRoot, 'src/generated', folder, fileName)
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
    }
    fs.writeFileSync(filePath + '.ts', code)
    fs.writeFileSync(filePath + '.json', JSON.stringify(events, null, 4))
    fs.appendFileSync(
        exportPath,
        `\nimport '${path.join('@/generated', folder, fileName).replace(/\\/g, '/')}'`
    )
}


export function generateCode() {
    const exportPath = path.join(RealRoot, 'src/engine/plugins/animSeq/animPlugin.ts')
    fs.writeFileSync(
        exportPath,
        fs.readFileSync(exportPath).toString().replace(
            /\/\/ AUTO APPEND, DO NOT REMOVE THIS LINE[\s|\S]*/g,
            '// AUTO APPEND, DO NOT REMOVE THIS LINE'
        )
    )
    for (const meta of Object.values(getAnimSeqMeta())) {
        const { folder, fileName, code, events } = animSeqCode(meta)
        writeCode(folder, fileName, code, events, exportPath)
    }
}