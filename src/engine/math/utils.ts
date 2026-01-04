import { Entity, Vector2, Vector3, world } from "@minecraft/server"
import { multiply, translate, rotateXYZ, transformVec3, invertRigid, inverse, invertRigidFromTR, Mat4 } from "./mat4"


export function boxOverlap(rot: Vector3, rect: Vector3, location: Vector3, dim?: string): Entity[] {
    // rect: full extents (width, height, depth)
    const half = { x: rect.x / 2, y: rect.y / 2, z: rect.z / 2 }
    const dimension = world.getDimension(dim || 'overworld')
    const maxDistance = Math.max(rect.x, rect.y, rect.z) * 0.75 + 1

    const candidates = dimension.getEntities({ location, maxDistance }) || []
    const out: Entity[] = []

    // Build transform M = translate(location) * rotateXYZ(rot) and invert it
    // Prefer direct rigid inverse built from translation+rotation to avoid allocations/multiplications
    const M_inv = invertRigidFromTR(location as Vector3, rot) ?? ((): Mat4 | undefined => {
        const M = multiply(translate({ x: location.x, y: location.y, z: location.z } as Vector3), rotateXYZ(rot))
        return invertRigid(M) ?? inverse(M)
    })()
    if (!M_inv) return []

    for (const en of candidates) {
        const pos = en.location
        if (!pos) continue
        const local = transformVec3(pos as Vector3, M_inv)
        if (
            Math.abs(local.x) <= half.x + 1e-6 &&
            Math.abs(local.y) <= half.y + 1e-6 &&
            Math.abs(local.z) <= half.z + 1e-6
        ) {
            out.push(en)
        }
    }

    return out
}

export function boxOverlapXoz(rot: Vector2, rect: Vector2, location: Vector3, dim?: string, maxYDist=4): Entity[] {

    // rect: (width, depth) on X and Z axes
    const halfX = rect.x / 2
    const halfZ = rect.y / 2
    const dimension = world.getDimension(dim || 'overworld')
    const maxDistance = Math.max(rect.x, rect.y, maxYDist) * 0.5 + 1

    // interpret rot.x as yaw (rotation around Y)
    const angle = rot.x

    const M_inv = invertRigidFromTR(location as Vector3, { x: 0, y: angle, z: 0 } as Vector3) ?? ((): Mat4 | undefined => {
        const M = multiply(translate({ x: location.x, y: location.y, z: location.z } as Vector3), rotateXYZ({ x: 0, y: angle, z: 0 } as Vector3))
        return invertRigid(M) ?? inverse(M)
    })()
    if (!M_inv) return []

    const candidates = dimension.getEntities({ location, maxDistance }) || []
    const out: Entity[] = []

    for (const en of candidates) {
        const pos = en.location
        if (!pos) continue
        const local = transformVec3(pos as Vector3, M_inv)
        if (Math.abs(local.x) <= halfX + 1e-6 && Math.abs(local.z) <= halfZ + 1e-6 && Math.abs(local.y) <= maxYDist + 1e-6) out.push(en)
    }

    return out
}