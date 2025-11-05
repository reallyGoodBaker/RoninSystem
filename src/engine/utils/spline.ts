import { Vector2 } from "@minecraft/server"
import { MathUtils } from "./math"

export enum SplineType {
    Linear,
    Spherical,
    CatmullRom,
    Bezier,
    Hermite,
}

export interface Spline2D {
    type: SplineType
    points: Vector2[]
}

export class SplineHelper {
    static interpolate2(spline: Spline2D, t: number): Vector2 {
        if (spline.points.length === 0) return { x: 0, y: 0 }
        if (spline.points.length === 1) return spline.points[0]

        // Clamp t to [0,1]
        t = Math.max(0, Math.min(1, t))

        switch (spline.type) {
            case SplineType.Linear: {
                const segments = spline.points.length - 1
                const segmentIndex = Math.min(Math.floor(t * segments), segments - 1)
                const localT = (t * segments) % 1
                return MathUtils.lerp(
                    spline.points[segmentIndex],
                    spline.points[segmentIndex + 1],
                    localT
                )
            }

            case SplineType.Spherical: {
                const segments = spline.points.length - 1
                const segmentIndex = Math.min(Math.floor(t * segments), segments - 1)
                const localT = (t * segments) % 1
                return MathUtils.slerp(
                    spline.points[segmentIndex],
                    spline.points[segmentIndex + 1],
                    localT
                )
            }

            case SplineType.CatmullRom: {
                const segments = spline.points.length - 1
                const segmentIndex = Math.min(Math.floor(t * segments), segments - 1)
                const localT = (t * segments) % 1
                return MathUtils.catmullRomInterpolate2(
                    spline.points,
                    segmentIndex,
                    localT
                )
            }

            case SplineType.Bezier:
                return MathUtils.bezierInterpolate2(spline.points, t)

            case SplineType.Hermite:
                return MathUtils.hermiteInterpolate2(spline.points, t)

            default:
                throw new Error(`Unknown spline type: ${spline.type}`)
        }
    }
}
