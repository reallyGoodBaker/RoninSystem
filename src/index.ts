import { Entry, IApplication } from "@ronin/core/architect/application"
import { ModBase } from "@ronin/core/architect/mod"
import { RoninPlugin } from "@ronin/plugins/ronin"

@Entry
export class MyMod extends ModBase {
    start(app: IApplication) {
        app.loadPlugin(RoninPlugin)
    }
}