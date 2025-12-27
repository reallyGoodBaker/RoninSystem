import { MariePSequence } from "@/generated/ss/marieP"
import { MariePpSequence } from "@/generated/ss/mariePp"
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

    onEnter(stateTree: StateTree, prevState: State): void {
        this.OnStateTreeEvent.bind(ev => {
            stateTree.tryTransitionTo('pp')
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
}

export class MarieTricksStateTree extends StateTree {
    onStart(): void {
        this.addTask(MariePState.taskName, MariePState.task)
        this.addTask(MariePpState.taskName, MariePpState.task)

        this.Root.appendChild(new MariePState('p'))
        this.Root.appendChild(new MariePpState('pp'))
    }
}