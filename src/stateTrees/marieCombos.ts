import { MariePSequence } from "@/generated/ss/marieP"
import { MariePpSequence } from "@/generated/ss/mariePp"
import { tags } from "@ronin/config/tags"
import { Tag } from "@ronin/core/tag"
import { AnimationSequenceComponent } from "@ronin/plugins/animSeq/anim"
import { State } from "@ronin/plugins/stateTree/state"
import { StateTree } from "@ronin/plugins/stateTree/stateTree"

class MariePState extends State {
    static taskName = 'p'
    static async task(tree: StateTree) {
        const animSeq = tree.getOwner().getComponent(AnimationSequenceComponent)
        await animSeq?.playAnimSeq(MariePSequence.animation)
    }

    taskNames: string[] = [ MariePState.taskName ]

    canEnter(stateTree: StateTree): boolean {
        return Tag.hasTag(stateTree.getOwner(), tags.skill.slot.attack, true)
    }

    onEnter(stateTree: StateTree, prevState: State): void {
        Tag.removeTag(stateTree.getOwner(), tags.skill.slot.attack)
        this.OnStateTreeEvent.bind(async ev => {
            if (ev.tag === tags.skill.slot.attack) {
                Tag.addTag(ev.targetActor, tags.skill.slot.attack)
                await stateTree.tryTransitionTo('pp')
            }
        })
    }
}

class MariePpState extends State {
    static taskName = 'pp'
    static async task(tree: StateTree) {
        const animSeq = tree.getOwner().getComponent(AnimationSequenceComponent)
        await animSeq?.playAnimSeq(MariePpSequence.animation)
    }

    taskNames: string[] = [ MariePpState.taskName ]

    canEnter(stateTree: StateTree): boolean {
        return Tag.hasTag(stateTree.getOwner(), tags.skill.slot.attack, true)
    }

    onEnter(stateTree: StateTree, prevState: State): void {
        Tag.removeTag(stateTree.getOwner(), tags.skill.slot.attack)
    }
}

export class MarieTricksStateTree extends StateTree {
    onStart(): void {
        this.addTask(MariePState.taskName, MariePState.task)
        this.addTask(MariePpState.taskName, MariePpState.task)

        this.root.appendChild(new MariePState('p'))
        this.root.appendChild(new MariePpState('pp'))
        this.root.OnStateTreeEvent.bind(ev => {
            if (ev.tag === tags.skill.slot.attack) {
                Tag.addTag(ev.targetActor, tags.skill.slot.attack)
            }
        })
    }
}