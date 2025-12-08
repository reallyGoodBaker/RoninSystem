import { createComputed, createEffect, createSignal, Getter } from "@editor/base/common/responsive"
import { html } from "../view"

export interface DraggingEvent {
    dx: number
    dy: number
}

export class DraggingUtils {
    static delta(e: DraggingEvent, dir: DragDirection) {
        if (dir === DragDirection.East) {
            return e.dx
        }

        if (dir === DragDirection.West) {
            return -e.dx
        }

        if (dir === DragDirection.North) {
            return -e.dy
        }

        return e.dy
    }

    static accumulate(dragging: Getter<DraggingEvent>) {
        let totalX = 0
        let totalY = 0

        return createComputed(() => {
            const { dx, dy } = dragging()
            totalX += dx
            totalY += dy
            return { dx: totalX, dy: totalY }
        })
    }
}

export enum DragDirection {
    East,
    West,
    North,
    South,
}

function getCursorStyle(dir: DragDirection) {
    return dir < 2 ? 'ew-resize' : 'ns-resize'
}

export function createDraggable() {
    const [ dragging, setMousemove ] = createSignal<DraggingEvent>({ dx: 0, dy: 0 })
    const [ isDragging, setIsDragging ] = createSignal(false)

    const _mousemove = (e: MouseEvent) => {
        setMousemove(prev => {
            prev.dx = e.movementX
            prev.dy = e.movementY
            return prev
        })
    }

    const stopDrag = () => {
        setIsDragging(false)
        setMousemove({ dx: 0, dy: 0 })
        document.body.style.cursor = 'unset'
        document.removeEventListener('mousemove', _mousemove)
        document.removeEventListener('mouseup', stopDrag)
    }

    const startDrag = (dir = DragDirection.East) => {
        setIsDragging(true)
        document.body.style.cursor = getCursorStyle(dir)
        document.addEventListener('mousemove', _mousemove)
        document.addEventListener('mouseup', stopDrag)
    }

    return [
        dragging,
        startDrag,
        isDragging,
    ] as const
}

export function createDraggingView(orientation=DragDirection.East, defaultSize=256) {
    const [ dragEvent, startDrag, dragging ] = createDraggable()
    const [ size, setSize ] = createSignal(defaultSize)
    const orientationClasses = orientation > 1 ? 'h-1 w-full' : 'w-1 h-full'
    const hoverClass = createComputed(() => dragging() ? `bg-blue-500` : 'bg-transparent')

    createEffect(() => {
        setSize(
            DraggingUtils.delta(dragEvent(), orientation) + size()
        )
    })

    const thumbBar = html`
        <div @mousedown="${() => startDrag(orientation)}"
            style="--curosr: ${getCursorStyle(orientation)};"
            class="
                hover:bg-blue-500
                hover:cursor-(--curosr)
                ${orientationClasses}
                ${hoverClass}
                absolute
                ${orientation === DragDirection.East ? 'right-0' :
                    orientation === DragDirection.West ? 'left-0' :
                    orientation === DragDirection.North ? 'top-0' : 'bottom-0'
                }">
        </div>`

    return [
        thumbBar,
        size,
    ] as const
}