import { Entry, IApplication } from "@ronin/core/architect/application"
import { ModBase } from "@ronin/core/architect/mod"
import { RoninPlugin } from "@ronin/plugins/ronin"
import { AnimationSequencePlugin } from "@ronin/plugins/animSeq/animPlugin"
import { registerPlayerController } from "@ronin/core/architect/config"
import { MyController } from "./controller"
import { FinateStateMachinePlugin } from "@ronin/plugins/fsm/plugin"

import './states/index'


@Entry
export class MyMod extends ModBase {
    start(app: IApplication) {
        app.loadPlugin(
            RoninPlugin,
            AnimationSequencePlugin,
            FinateStateMachinePlugin,
        )

        registerPlayerController(
            MyController
        )
    }

}