import { createEffect } from "./base/common/responsive"
import { replicable } from "./base/browser/replicator"
import { getAppRoot } from "./base/browser/ui"
import { AppLayout } from "./base/browser/ui/app/appLayout"

new AppLayout().render(getAppRoot())