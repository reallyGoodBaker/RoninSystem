import { Entry, IApplication } from "@ronin/core/architect/application"
import { ModBase } from "@ronin/core/architect/mod"
import { RoninPlugin } from "@ronin/plugins/ronin"
import { StateTreePlugin } from "@ronin/plugins/stateTree"
import { StateTree } from "@ronin/plugins/stateTree/stateTree"
import { StateTreeConfKey } from "@ronin/plugins/stateTree/stateTreeComponent"


@Entry
export class MyMod extends ModBase {
    start(app: IApplication) {
        app.setConfig(StateTreeConfKey, {
            'minecraft:player': StateTree
        })

        app.loadPlugin(
            RoninPlugin,
            StateTreePlugin,
        )
    }
}