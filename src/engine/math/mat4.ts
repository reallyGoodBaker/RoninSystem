import type { Vector3 } from "@minecraft/server"

// Mat4: column-major storage, column-vector convention (v' = M * v)
// Column-major layout: element at (row, col) is stored at index (col*4 + row).
// Coordinate system: follow Minecraft (X: east, Y: up, Z: south).
// Translation is stored in the last column (indices 12..14).
export class Mat4 {
    data: Float32Array

    constructor(data?: Float32Array | number[]) {
        if (!data) this.data = new Float32Array(16)
        else if (data instanceof Float32Array) this.data = data
        else this.data = new Float32Array(data)
    }

    // Map getters to (row, col) using column-major indexing: index = col*4 + row
    get m11() { return this.data[0] }
    get m12() { return this.data[4] }
    get m13() { return this.data[8] }
    get m14() { return this.data[12] }

    get m21() { return this.data[1] }
    get m22() { return this.data[5] }
    get m23() { return this.data[9] }
    get m24() { return this.data[13] }

    get m31() { return this.data[2] }
    get m32() { return this.data[6] }
    get m33() { return this.data[10] }
    get m34() { return this.data[14] }

    get m41() { return this.data[3] }
    get m42() { return this.data[7] }
    get m43() { return this.data[11] }
    get m44() { return this.data[15] }

    static from(data: number[] | Float32Array) {
        return new Mat4(data as any)
    }
}

export function identity() {
    return Mat4.from([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

export function multiply(a: Mat4, b: Mat4) {
    const A = a.data, B = b.data
    const o = new Float32Array(16)

    // Column-major multiplication: C = A * B
    o[0]  = A[0]*B[0]  + A[4]*B[1]  + A[8]*B[2]  + A[12]*B[3]
    o[1]  = A[1]*B[0]  + A[5]*B[1]  + A[9]*B[2]  + A[13]*B[3]
    o[2]  = A[2]*B[0]  + A[6]*B[1]  + A[10]*B[2] + A[14]*B[3]
    o[3]  = A[3]*B[0]  + A[7]*B[1]  + A[11]*B[2] + A[15]*B[3]

    o[4]  = A[0]*B[4]  + A[4]*B[5]  + A[8]*B[6]  + A[12]*B[7]
    o[5]  = A[1]*B[4]  + A[5]*B[5]  + A[9]*B[6]  + A[13]*B[7]
    o[6]  = A[2]*B[4]  + A[6]*B[5]  + A[10]*B[6] + A[14]*B[7]
    o[7]  = A[3]*B[4]  + A[7]*B[5]  + A[11]*B[6] + A[15]*B[7]

    o[8]  = A[0]*B[8]  + A[4]*B[9]  + A[8]*B[10] + A[12]*B[11]
    o[9]  = A[1]*B[8]  + A[5]*B[9]  + A[9]*B[10] + A[13]*B[11]
    o[10] = A[2]*B[8]  + A[6]*B[9]  + A[10]*B[10]+ A[14]*B[11]
    o[11] = A[3]*B[8]  + A[7]*B[9]  + A[11]*B[10]+ A[15]*B[11]

    o[12] = A[0]*B[12] + A[4]*B[13] + A[8]*B[14] + A[12]*B[15]
    o[13] = A[1]*B[12] + A[5]*B[13] + A[9]*B[14] + A[13]*B[15]
    o[14] = A[2]*B[12] + A[6]*B[13] + A[10]*B[14]+ A[14]*B[15]
    o[15] = A[3]*B[12] + A[7]*B[13] + A[11]*B[14]+ A[15]*B[15]

    return Mat4.from(o)
}

export function transformVec3(v: Vector3, m: Mat4): Vector3 {
    const d = m.data
    return {
        x: v.x * d[0] + v.y * d[4] + v.z * d[8]  + d[12],
        y: v.x * d[1] + v.y * d[5] + v.z * d[9]  + d[13],
        z: v.x * d[2] + v.y * d[6] + v.z * d[10] + d[14]
    }
}

export function translate(v: Vector3) {
    return Mat4.from([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        v.x, v.y, v.z, 1
    ])
}

export function rotateX(angle: number) {
    const c = Math.cos(angle), s = Math.sin(angle)
    return Mat4.from([
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s,  c, 0,
        0, 0,  0, 1
    ])
}

export function rotateY(angle: number) {
    const c = Math.cos(angle), s = Math.sin(angle)
    return Mat4.from([
        c, 0, s, 0,
        0, 1, 0, 0,
       -s, 0, c, 0,
        0, 0, 0, 1
    ])
}

export function rotateZ(angle: number) {
    const c = Math.cos(angle), s = Math.sin(angle)
    return Mat4.from([
        c, -s, 0, 0,
        s,  c, 0, 0,
        0,  0, 1, 0,
        0,  0, 0, 1
    ])
}

export function rotateXYZ(rot3: Vector3) {
    return multiply(multiply(rotateX(rot3.x), rotateY(rot3.y)), rotateZ(rot3.z))
}

export function rotateAxis(angle: number, axis: Vector3) {
    const x = axis.x, y = axis.y, z = axis.z
    const c = Math.cos(angle), s = Math.sin(angle)
    const t = 1 - c

    const r00 = x*x*t + c
    const r01 = x*y*t - z*s
    const r02 = x*z*t + y*s

    const r10 = y*x*t + z*s
    const r11 = y*y*t + c
    const r12 = y*z*t - x*s

    const r20 = z*x*t - y*s
    const r21 = z*y*t + x*s
    const r22 = z*z*t + c

    return Mat4.from([
        r00, r01, r02, 0,
        r10, r11, r12, 0,
        r20, r21, r22, 0,
        0,   0,   0,   1
    ])
}

export function scale(v: Vector3) {
    return Mat4.from([
        v.x, 0,   0,   0,
        0,   v.y, 0,   0,
        0,   0,   v.z, 0,
        0,   0,   0,   1
    ])
}

// Keep original misspelling for compatibility
export function transfrom(t: Vector3, r: Vector3, s: Vector3) {
    return multiply(multiply(translate(t), rotateXYZ(r)), scale(s))
}

export function inverse(m: Mat4): Mat4 | undefined {
    const a = m.data
    const a00 = a[0], a01 = a[4], a02 = a[8],  a03 = a[12]
    const a10 = a[1], a11 = a[5], a12 = a[9],  a13 = a[13]
    const a20 = a[2], a21 = a[6], a22 = a[10], a23 = a[14]
    const a30 = a[3], a31 = a[7], a32 = a[11], a33 = a[15]

    const b00 = a00 * a11 - a01 * a10
    const b01 = a00 * a12 - a02 * a10
    const b02 = a00 * a13 - a03 * a10
    const b03 = a01 * a12 - a02 * a11
    const b04 = a01 * a13 - a03 * a11
    const b05 = a02 * a13 - a03 * a12
    const b06 = a20 * a31 - a21 * a30
    const b07 = a20 * a32 - a22 * a30
    const b08 = a20 * a33 - a23 * a30
    const b09 = a21 * a32 - a22 * a31
    const b10 = a21 * a33 - a23 * a31
    const b11 = a22 * a33 - a23 * a32

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
    if (!det) return undefined
    det = 1.0 / det

    const out = new Float32Array(16)
    out[0]  = ( a11 * b11 - a12 * b10 + a13 * b09) * det
    out[4]  = (-a01 * b11 + a02 * b10 - a03 * b09) * det
    out[8]  = ( a31 * b05 - a32 * b04 + a33 * b03) * det
    out[12] = (-a21 * b05 + a22 * b04 - a23 * b03) * det

    out[1]  = (-a10 * b11 + a12 * b08 - a13 * b07) * det
    out[5]  = ( a00 * b11 - a02 * b08 + a03 * b07) * det
    out[9]  = (-a30 * b05 + a32 * b02 - a33 * b01) * det
    out[13] = ( a20 * b05 - a22 * b02 + a23 * b01) * det

    out[2]  = ( a10 * b10 - a11 * b08 + a13 * b06) * det
    out[6]  = (-a00 * b10 + a01 * b08 - a03 * b06) * det
    out[10] = ( a30 * b04 - a31 * b02 + a33 * b00) * det
    out[14] = (-a20 * b04 + a21 * b02 - a23 * b00) * det

    out[3]  = (-a10 * b09 + a11 * b07 - a12 * b06) * det
    out[7]  = ( a00 * b09 - a01 * b07 + a02 * b06) * det
    out[11] = (-a30 * b03 + a31 * b01 - a32 * b00) * det
    out[15] = ( a20 * b03 - a21 * b01 + a22 * b00) * det

    return Mat4.from(out)
}

// Fast inverse for rigid transforms (rotation + translation, no scaling/shear).
// Assumes upper-left 3x3 is orthonormal rotation. Returns undefined if it detects non-finite values.
export function invertRigid(m: Mat4): Mat4 | undefined {
    const a = m.data
    const r00 = a[0], r10 = a[1], r20 = a[2]
    const r01 = a[4], r11 = a[5], r21 = a[6]
    const r02 = a[8], r12 = a[9], r22 = a[10]
    const tx = a[12], ty = a[13], tz = a[14]

    // Transpose of rotation
    const rt00 = r00, rt01 = r10, rt02 = r20
    const rt10 = r01, rt11 = r11, rt12 = r21
    const rt20 = r02, rt21 = r12, rt22 = r22

    // new translation = -R^T * t
    const ntx = -(rt00 * tx + rt01 * ty + rt02 * tz)
    const nty = -(rt10 * tx + rt11 * ty + rt12 * tz)
    const ntz = -(rt20 * tx + rt21 * ty + rt22 * tz)

    const out = new Float32Array(16)
    out[0] = rt00; out[1] = rt10; out[2] = rt20; out[3] = 0
    out[4] = rt01; out[5] = rt11; out[6] = rt21; out[7] = 0
    out[8] = rt02; out[9] = rt12; out[10] = rt22; out[11] = 0
    out[12] = ntx; out[13] = nty; out[14] = ntz; out[15] = 1

    if (!Number.isFinite(ntx) || !Number.isFinite(nty) || !Number.isFinite(ntz)) return undefined
    return Mat4.from(out)
}

// Fast inverse directly from translation + Euler rotation (Rx * Ry * Rz order)
export function invertRigidFromTR(t: Vector3, rot: Vector3): Mat4 | undefined {
    const rx = rot.x, ry = rot.y, rz = rot.z
    const cx = Math.cos(rx), sx = Math.sin(rx)
    const cy = Math.cos(ry), sy = Math.sin(ry)
    const cz = Math.cos(rz), sz = Math.sin(rz)

    // Rotation R = Rx * Ry * Rz
    const R00 = cy * cz
    const R01 = -cy * sz
    const R02 = sy

    const R10 = cx * sz + sx * sy * cz
    const R11 = cx * cz - sx * sy * sz
    const R12 = -sx * cy

    const R20 = sx * sz - cx * sy * cz
    const R21 = sx * cz + cx * sy * sz
    const R22 = cx * cy

    const tx = t.x, ty = t.y, tz = t.z

    // Transpose rotation (inverse)
    const rt00 = R00, rt01 = R10, rt02 = R20
    const rt10 = R01, rt11 = R11, rt12 = R21
    const rt20 = R02, rt21 = R12, rt22 = R22

    const ntx = -(rt00 * tx + rt01 * ty + rt02 * tz)
    const nty = -(rt10 * tx + rt11 * ty + rt12 * tz)
    const ntz = -(rt20 * tx + rt21 * ty + rt22 * tz)

    if (!Number.isFinite(ntx) || !Number.isFinite(nty) || !Number.isFinite(ntz)) return undefined

    const out = new Float32Array(16)
    out[0] = rt00; out[1] = rt01; out[2] = rt02; out[3] = 0
    out[4] = rt10; out[5] = rt11; out[6] = rt12; out[7] = 0
    out[8] = rt20; out[9] = rt21; out[10] = rt22; out[11] = 0
    out[12] = ntx; out[13] = nty; out[14] = ntz; out[15] = 1

    return Mat4.from(out)
}
