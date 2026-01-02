import { tags } from "@ronin/config/tags"
import { profiler } from "@ronin/core/profiler"
import { onEnter, StateDef, StateMachineTemplate } from "@ronin/plugins/fsm/setup"
import { StateTransition, TransitionTriggerType } from "@ronin/plugins/fsm/state"

@StateMachineTemplate('ronin:marie', 'resume')
export class MarieMoves {

    @StateDef(0)
    resume(): StateTransition[] {
        onEnter(() => {
            profiler.info('Marie is resuming')
        })

        return [
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            }
        ]
    }

    @StateDef()
    idle(): StateTransition[] {
        return [
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'attack1',
                tag: tags.skill.slot.attack
            }
        ]
    }
}