import { Vector2, Vector3 } from '@minecraft/server'
import { Vector3Utils } from '@minecraft/math'

export class Vector2Helper {
    static add(a: Vector2, b: Vector2): Vector2 {
        return { x: a.x + b.x, y: a.y + b.y }
    }

    static sub(a: Vector2, b: Vector2): Vector2 {
        return { x: a.x - b.x, y: a.y - b.y }
    }

    static mul(a: Vector2, b: Vector2): Vector2 {
        return { x: a.x * b.x, y: a.y * b.y }
    }

    static div(a: Vector2, b: Vector2): Vector2 {
        return { x: a.x / b.x, y: a.y / b.y }
    }

    static dot(a: Vector2, b: Vector2): number {
        return a.x * b.x + a.y * b.y
    }

    static cross(a: Vector2, b: Vector2): number {
        return a.x * b.y - a.y * b.x
    }

    static normalize(a: Vector2): Vector2 {
        const length = Math.sqrt(a.x * a.x + a.y * a.y)
        return { x: a.x / length, y: a.y / length }
    }

    static length(a: Vector2): number {
        return Math.sqrt(a.x * a.x + a.y * a.y)
    }

    static distance(a: Vector2, b: Vector2): number {
        return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))
    }

    static angle(a: Vector2): number {
        return Math.atan2(a.y, a.x)
    }

    static rotate(a: Vector2, angle: number): Vector2 {
        return { x: a.x * Math.cos(angle) - a.y * Math.sin(angle), y: a.x * Math.sin(angle) + a.y * Math.cos(angle) }
    }

    static clamp(a: Vector2, min: Vector2, max: Vector2): Vector2 {
        return { x: Math.max(min.x, Math.min(max.x, a.x)), y: Math.max(min.y, Math.min(max.y, a.y)) }
    }

    static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
        return { x: MathUtils.lerpValue(a.x, b.x, t), y: MathUtils.lerpValue(a.y, b.y, t) }
    }

    static slerp(a: Vector2, b: Vector2, t: number): Vector2 {
        const dot = Vector2Helper.dot(a, b)
        const theta = Math.acos(Math.min(Math.max(dot, -1), 1))
        if (theta < 1e-6) return Vector2Helper.lerp(a, b, t)
        
        const sinTheta = Math.sin(theta)
        const wa = Math.sin((1 - t) * theta) / sinTheta
        const wb = Math.sin(t * theta) / sinTheta
        return {
            x: wa * a.x + wb * b.x,
            y: wa * a.y + wb * b.y
        }
    }
}

export class MathUtils {
    static lerpValue(a: number, b: number, t: number): number {
        return a + (b - a) * t
    }

    static lerp<T extends number | Vector2 | Vector3>(a: T, b: T, t: number): T {
        if (typeof a === 'number') {
            return MathUtils.lerpValue(a, b as number, t) as T
        }

        //@ts-ignore
        if ('z' in a) {
            return Vector3Utils.lerp(a, b as Vector3, t) as T
        }

        return Vector2Helper.lerp(a as Vector2, b as Vector2, t) as T
    }

    static slerp<T extends Vector2 | Vector3>(a: T, b: T, t: number): T {
        //@ts-ignore
        if ('z' in a) {
            return Vector3Utils.slerp(a, b as Vector3, t) as T
        }

        return Vector2Helper.slerp(a as Vector2, b as Vector2, t) as T
    }

    /**
     * 1D Catmull-Rom样条插值辅助函数
     * @param p0 第一个控制点
     * @param p1 第二个控制点(插值起点)
     * @param p2 第三个控制点(插值终点) 
     * @param p3 第四个控制点
     * @param t 插值参数 [0,1]
     * @returns 插值结果
     */
    static catmullRom1D(p0: number, p1: number, p2: number, p3: number, t: number) {
        const t2 = t * t
        const t3 = t2 * t
        return 0.5 * (
            (2 * p1) +
            (-p0 + p2) * t +
            (2*p0 - 5*p1 + 4*p2 - p3) * t2 +
            (-p0 + 3*p1 - 3*p2 + p3) * t3
        )
    }

    /**
     * 2D Catmull-Rom样条插值
     * 在控制点序列中指定位置进行插值，自动处理边界镜像点
     * @param points 控制点数组
     * @param index 当前插值段的起点索引
     * @param t 插值参数 [0,1]
     * @returns 插值结果向量
     */
    static catmullRomInterpolate2(points: Vector2[], index: number, t: number): Vector2 {
        // Handle boundary conditions with mirror points
        const p1 = points[index]
        let p0, p2, p3
        
        if (index === 0) {
            // First point - create mirror point
            p0 = { x: 2*p1.x - points[1].x, y: 2*p1.y - points[1].y }
            p2 = points[1]
            p3 = points.length > 2 ? points[2] : p2
        } else if (index === points.length-1) {
            // Last point - create mirror point
            p0 = points[index-1]
            p2 = { x: 2*p1.x - p0.x, y: 2*p1.y - p0.y }
            p3 = p2
        } else {
            // Middle points
            p0 = points[index-1]
            p2 = points[index+1]
            p3 = index < points.length-2 ? points[index+2] : p2
        }

        return {
            x: this.catmullRom1D(p0.x, p1.x, p2.x, p3.x, t),
            y: this.catmullRom1D(p0.y, p1.y, p2.y, p3.y, t)
        }
    }

    /**
     * 2D贝塞尔曲线插值
     * 使用de Casteljau算法递归计算任意阶贝塞尔曲线
     * @param points 控制点数组
     * @param t 插值参数 [0,1] 
     * @returns 插值结果向量
     */
    static bezierInterpolate2(points: Vector2[], t: number): Vector2 {
        if (points.length === 0) return { x: 0, y: 0 }
        if (points.length === 1) return points[0]

        // De Casteljau's algorithm
        const intermediate: Vector2[] = []
        for (let i = 0; i < points.length - 1; i++) {
            intermediate.push({
                x: points[i].x + (points[i+1].x - points[i].x) * t,
                y: points[i].y + (points[i+1].y - points[i].y) * t
            })
        }
        
        // Recursively compute until we have a single point
        return this.bezierInterpolate2(intermediate, t)
    }

    /**
     * 2D Hermite插值
     * 使用位置点和切线向量进行三次多项式插值
     * 输入数组应为[p0, m0, p1, m1,...]格式，其中p为位置，m为切线
     * @param points 控制点数组(位置和切线交替)
     * @param t 插值参数 [0,1]
     * @returns 插值结果向量
     */
    static hermiteInterpolate2(points: Vector2[], t: number): Vector2 {
        if (points.length === 0) return { x: 0, y: 0 }
        if (points.length === 1) return points[0]

        // Assume points array contains [p0, m0, p1, m1, ...] where p are positions and m are tangents
        const p0 = points[0]
        const m0 = points.length > 1 ? points[1] : { x: 0, y: 0 }
        const p1 = points.length > 2 ? points[2] : p0
        const m1 = points.length > 3 ? points[3] : { x: 0, y: 0 }

        // Hermite basis functions
        const t2 = t * t
        const t3 = t2 * t
        const h00 = 2*t3 - 3*t2 + 1
        const h10 = t3 - 2*t2 + t
        const h01 = -2*t3 + 3*t2
        const h11 = t3 - t2

        return {
            x: h00 * p0.x + h10 * m0.x + h01 * p1.x + h11 * m1.x,
            y: h00 * p0.y + h10 * m0.y + h01 * p1.y + h11 * m1.y
        }
    }
}

export class FloatUtils {
    static greaterThan(a: number, b: number): boolean {
        return a > b && !this.equals(a, b)
    }

    static lessThan(a: number, b: number): boolean {
        return a < b && !this.equals(a, b)
    }

    static equals(a: number, b: number): boolean {
        return Math.abs(a - b) < Number.EPSILON
    }
}