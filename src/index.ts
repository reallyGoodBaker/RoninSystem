import { Entry, IApplication } from "@ronin/core/architect/application"
import { ModBase } from "@ronin/core/architect/mod"
import { RoninSwordSystem } from "@ronin/plugins/ronin"
import { registerPlayerComponent, registerPlayerController } from "@ronin/core/architect/config"
import { BattleAttributes, MyController } from "./controller"

import './states/index'


@Entry
export class MyMod extends ModBase {
    start(app: IApplication) {
        app.loadPlugin(RoninSwordSystem)

        registerPlayerController(
            MyController
        )

        registerPlayerComponent(
            BattleAttributes,
        )
    }
}