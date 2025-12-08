import { Entry, IApplication } from "@ronin/core/architect/application"
import { ModBase } from "@ronin/core/architect/mod"
import { RoninPlugin } from "@ronin/plugins/ronin"
import { StateTreePlugin } from "@ronin/plugins/stateTree"
import { StateTreeConfKey } from "@ronin/plugins/stateTree/stateTreeComponent"
import { AnimationSequencePlugin } from "@ronin/plugins/animSeq/animPlugin"
import { registerPlayerController } from "@ronin/core/architect/config"
import { MyController } from "./controller"
import { MarieTricksStateTree } from "./stateTrees/marieCombos"

@Entry
export class MyMod extends ModBase {
    start(app: IApplication) {
        app.setConfig(StateTreeConfKey, {
            'minecraft:player': MarieTricksStateTree
        })

        app.loadPlugin(
            RoninPlugin,
            StateTreePlugin,
            AnimationSequencePlugin,
        )

        registerPlayerController(
            MyController
        )
    }

}