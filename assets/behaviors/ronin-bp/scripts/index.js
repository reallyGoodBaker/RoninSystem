import { CustomCommandParamType, CustomCommandStatus, CommandPermissionLevel, system, world, GameMode, EntityEquippableComponent, EntityInventoryComponent, InputButton, ButtonState, HeldItemOption, EquipmentSlot, EntityHealthComponent } from '@minecraft/server';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
var Reflect$1;
(function (Reflect) {
    // Metadata Proposal
    // https://rbuckton.github.io/reflect-metadata/
    (function (factory) {
        var root = typeof globalThis === "object" ? globalThis :
            typeof global === "object" ? global :
                typeof self === "object" ? self :
                    typeof this === "object" ? this :
                        sloppyModeThis();
        var exporter = makeExporter(Reflect);
        if (typeof root.Reflect !== "undefined") {
            exporter = makeExporter(root.Reflect, exporter);
        }
        factory(exporter, root);
        if (typeof root.Reflect === "undefined") {
            root.Reflect = Reflect;
        }
        function makeExporter(target, previous) {
            return function (key, value) {
                Object.defineProperty(target, key, { configurable: true, writable: true, value: value });
                if (previous)
                    previous(key, value);
            };
        }
        function functionThis() {
            try {
                return Function("return this;")();
            }
            catch (_) { }
        }
        function indirectEvalThis() {
            try {
                return (void 0, eval)("(function() { return this; })()");
            }
            catch (_) { }
        }
        function sloppyModeThis() {
            return functionThis() || indirectEvalThis();
        }
    })(function (exporter, root) {
        var hasOwn = Object.prototype.hasOwnProperty;
        // feature test for Symbol support
        var supportsSymbol = typeof Symbol === "function";
        var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
        var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
        var supportsCreate = typeof Object.create === "function"; // feature test for Object.create support
        var supportsProto = { __proto__: [] } instanceof Array; // feature test for __proto__ support
        var downLevel = !supportsCreate && !supportsProto;
        var HashMap = {
            // create an object in dictionary mode (a.k.a. "slow" mode in v8)
            create: supportsCreate
                ? function () { return MakeDictionary(Object.create(null)); }
                : supportsProto
                    ? function () { return MakeDictionary({ __proto__: null }); }
                    : function () { return MakeDictionary({}); },
            has: downLevel
                ? function (map, key) { return hasOwn.call(map, key); }
                : function (map, key) { return key in map; },
            get: downLevel
                ? function (map, key) { return hasOwn.call(map, key) ? map[key] : undefined; }
                : function (map, key) { return map[key]; },
        };
        // Load global or shim versions of Map, Set, and WeakMap
        var functionPrototype = Object.getPrototypeOf(Function);
        var _Map = typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
        var _Set = typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
        var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
        var registrySymbol = supportsSymbol ? Symbol.for("@reflect-metadata:registry") : undefined;
        var metadataRegistry = GetOrCreateMetadataRegistry();
        var metadataProvider = CreateMetadataProvider(metadataRegistry);
        /**
         * Applies a set of decorators to a property of a target object.
         * @param decorators An array of decorators.
         * @param target The target object.
         * @param propertyKey (Optional) The property key to decorate.
         * @param attributes (Optional) The property descriptor for the target key.
         * @remarks Decorators are applied in reverse order.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     Example = Reflect.decorate(decoratorsArray, Example);
         *
         *     // property (on constructor)
         *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
         *
         *     // property (on prototype)
         *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
         *
         *     // method (on constructor)
         *     Object.defineProperty(Example, "staticMethod",
         *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
         *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
         *
         *     // method (on prototype)
         *     Object.defineProperty(Example.prototype, "method",
         *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
         *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
         *
         */
        function decorate(decorators, target, propertyKey, attributes) {
            if (!IsUndefined(propertyKey)) {
                if (!IsArray(decorators))
                    throw new TypeError();
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
                    throw new TypeError();
                if (IsNull(attributes))
                    attributes = undefined;
                propertyKey = ToPropertyKey(propertyKey);
                return DecorateProperty(decorators, target, propertyKey, attributes);
            }
            else {
                if (!IsArray(decorators))
                    throw new TypeError();
                if (!IsConstructor(target))
                    throw new TypeError();
                return DecorateConstructor(decorators, target);
            }
        }
        exporter("decorate", decorate);
        // 4.1.2 Reflect.metadata(metadataKey, metadataValue)
        // https://rbuckton.github.io/reflect-metadata/#reflect.metadata
        /**
         * A default metadata decorator factory that can be used on a class, class member, or parameter.
         * @param metadataKey The key for the metadata entry.
         * @param metadataValue The value for the metadata entry.
         * @returns A decorator function.
         * @remarks
         * If `metadataKey` is already defined for the target and target key, the
         * metadataValue for that key will be overwritten.
         * @example
         *
         *     // constructor
         *     @Reflect.metadata(key, value)
         *     class Example {
         *     }
         *
         *     // property (on constructor, TypeScript only)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         static staticProperty;
         *     }
         *
         *     // property (on prototype, TypeScript only)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         property;
         *     }
         *
         *     // method (on constructor)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         static staticMethod() { }
         *     }
         *
         *     // method (on prototype)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         method() { }
         *     }
         *
         */
        function metadata(metadataKey, metadataValue) {
            function decorator(target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
                    throw new TypeError();
                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
            }
            return decorator;
        }
        exporter("metadata", metadata);
        /**
         * Define a unique metadata entry on the target.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param metadataValue A value that contains attached metadata.
         * @param target The target object on which to define metadata.
         * @param propertyKey (Optional) The property key for the target.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     Reflect.defineMetadata("custom:annotation", options, Example);
         *
         *     // property (on constructor)
         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
         *
         *     // property (on prototype)
         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
         *
         *     // method (on constructor)
         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
         *
         *     // method (on prototype)
         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
         *
         *     // decorator factory as metadata-producing annotation.
         *     function MyAnnotation(options): Decorator {
         *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
         *     }
         *
         */
        function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
        }
        exporter("defineMetadata", defineMetadata);
        /**
         * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.hasMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function hasMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryHasMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasMetadata", hasMetadata);
        /**
         * Gets a value indicating whether the target object has the provided metadata key defined.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function hasOwnMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasOwnMetadata", hasOwnMetadata);
        /**
         * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function getMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryGetMetadata(metadataKey, target, propertyKey);
        }
        exporter("getMetadata", getMetadata);
        /**
         * Gets the metadata value for the provided metadata key on the target object.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getOwnMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function getOwnMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("getOwnMetadata", getOwnMetadata);
        /**
         * Gets the metadata keys defined on the target object or its prototype chain.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns An array of unique metadata keys.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getMetadataKeys(Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getMetadataKeys(Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getMetadataKeys(Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getMetadataKeys(Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getMetadataKeys(Example.prototype, "method");
         *
         */
        function getMetadataKeys(target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryMetadataKeys(target, propertyKey);
        }
        exporter("getMetadataKeys", getMetadataKeys);
        /**
         * Gets the unique metadata keys defined on the target object.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns An array of unique metadata keys.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getOwnMetadataKeys(Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
         *
         */
        function getOwnMetadataKeys(target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryOwnMetadataKeys(target, propertyKey);
        }
        exporter("getOwnMetadataKeys", getOwnMetadataKeys);
        /**
         * Deletes the metadata entry from the target object with the provided key.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata entry was found and deleted; otherwise, false.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.deleteMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function deleteMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            var provider = GetMetadataProvider(target, propertyKey, /*Create*/ false);
            if (IsUndefined(provider))
                return false;
            return provider.OrdinaryDeleteMetadata(metadataKey, target, propertyKey);
        }
        exporter("deleteMetadata", deleteMetadata);
        function DecorateConstructor(decorators, target) {
            for (var i = decorators.length - 1; i >= 0; --i) {
                var decorator = decorators[i];
                var decorated = decorator(target);
                if (!IsUndefined(decorated) && !IsNull(decorated)) {
                    if (!IsConstructor(decorated))
                        throw new TypeError();
                    target = decorated;
                }
            }
            return target;
        }
        function DecorateProperty(decorators, target, propertyKey, descriptor) {
            for (var i = decorators.length - 1; i >= 0; --i) {
                var decorator = decorators[i];
                var decorated = decorator(target, propertyKey, descriptor);
                if (!IsUndefined(decorated) && !IsNull(decorated)) {
                    if (!IsObject(decorated))
                        throw new TypeError();
                    descriptor = decorated;
                }
            }
            return descriptor;
        }
        // 3.1.1.1 OrdinaryHasMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasmetadata
        function OrdinaryHasMetadata(MetadataKey, O, P) {
            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
            if (hasOwn)
                return true;
            var parent = OrdinaryGetPrototypeOf(O);
            if (!IsNull(parent))
                return OrdinaryHasMetadata(MetadataKey, parent, P);
            return false;
        }
        // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
        function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
            var provider = GetMetadataProvider(O, P, /*Create*/ false);
            if (IsUndefined(provider))
                return false;
            return ToBoolean(provider.OrdinaryHasOwnMetadata(MetadataKey, O, P));
        }
        // 3.1.3.1 OrdinaryGetMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarygetmetadata
        function OrdinaryGetMetadata(MetadataKey, O, P) {
            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
            if (hasOwn)
                return OrdinaryGetOwnMetadata(MetadataKey, O, P);
            var parent = OrdinaryGetPrototypeOf(O);
            if (!IsNull(parent))
                return OrdinaryGetMetadata(MetadataKey, parent, P);
            return undefined;
        }
        // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
        function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
            var provider = GetMetadataProvider(O, P, /*Create*/ false);
            if (IsUndefined(provider))
                return;
            return provider.OrdinaryGetOwnMetadata(MetadataKey, O, P);
        }
        // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
        function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
            var provider = GetMetadataProvider(O, P, /*Create*/ true);
            provider.OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P);
        }
        // 3.1.6.1 OrdinaryMetadataKeys(O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarymetadatakeys
        function OrdinaryMetadataKeys(O, P) {
            var ownKeys = OrdinaryOwnMetadataKeys(O, P);
            var parent = OrdinaryGetPrototypeOf(O);
            if (parent === null)
                return ownKeys;
            var parentKeys = OrdinaryMetadataKeys(parent, P);
            if (parentKeys.length <= 0)
                return ownKeys;
            if (ownKeys.length <= 0)
                return parentKeys;
            var set = new _Set();
            var keys = [];
            for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
                var key = ownKeys_1[_i];
                var hasKey = set.has(key);
                if (!hasKey) {
                    set.add(key);
                    keys.push(key);
                }
            }
            for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
                var key = parentKeys_1[_a];
                var hasKey = set.has(key);
                if (!hasKey) {
                    set.add(key);
                    keys.push(key);
                }
            }
            return keys;
        }
        // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
        function OrdinaryOwnMetadataKeys(O, P) {
            var provider = GetMetadataProvider(O, P, /*create*/ false);
            if (!provider) {
                return [];
            }
            return provider.OrdinaryOwnMetadataKeys(O, P);
        }
        // 6 ECMAScript Data Types and Values
        // https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values
        function Type(x) {
            if (x === null)
                return 1 /* Null */;
            switch (typeof x) {
                case "undefined": return 0 /* Undefined */;
                case "boolean": return 2 /* Boolean */;
                case "string": return 3 /* String */;
                case "symbol": return 4 /* Symbol */;
                case "number": return 5 /* Number */;
                case "object": return x === null ? 1 /* Null */ : 6 /* Object */;
                default: return 6 /* Object */;
            }
        }
        // 6.1.1 The Undefined Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-undefined-type
        function IsUndefined(x) {
            return x === undefined;
        }
        // 6.1.2 The Null Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-null-type
        function IsNull(x) {
            return x === null;
        }
        // 6.1.5 The Symbol Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-symbol-type
        function IsSymbol(x) {
            return typeof x === "symbol";
        }
        // 6.1.7 The Object Type
        // https://tc39.github.io/ecma262/#sec-object-type
        function IsObject(x) {
            return typeof x === "object" ? x !== null : typeof x === "function";
        }
        // 7.1 Type Conversion
        // https://tc39.github.io/ecma262/#sec-type-conversion
        // 7.1.1 ToPrimitive(input [, PreferredType])
        // https://tc39.github.io/ecma262/#sec-toprimitive
        function ToPrimitive(input, PreferredType) {
            switch (Type(input)) {
                case 0 /* Undefined */: return input;
                case 1 /* Null */: return input;
                case 2 /* Boolean */: return input;
                case 3 /* String */: return input;
                case 4 /* Symbol */: return input;
                case 5 /* Number */: return input;
            }
            var hint = "string" ;
            var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
            if (exoticToPrim !== undefined) {
                var result = exoticToPrim.call(input, hint);
                if (IsObject(result))
                    throw new TypeError();
                return result;
            }
            return OrdinaryToPrimitive(input);
        }
        // 7.1.1.1 OrdinaryToPrimitive(O, hint)
        // https://tc39.github.io/ecma262/#sec-ordinarytoprimitive
        function OrdinaryToPrimitive(O, hint) {
            var valueOf, result, toString_2; {
                var toString_1 = O.toString;
                if (IsCallable(toString_1)) {
                    var result = toString_1.call(O);
                    if (!IsObject(result))
                        return result;
                }
                var valueOf = O.valueOf;
                if (IsCallable(valueOf)) {
                    var result = valueOf.call(O);
                    if (!IsObject(result))
                        return result;
                }
            }
            throw new TypeError();
        }
        // 7.1.2 ToBoolean(argument)
        // https://tc39.github.io/ecma262/2016/#sec-toboolean
        function ToBoolean(argument) {
            return !!argument;
        }
        // 7.1.12 ToString(argument)
        // https://tc39.github.io/ecma262/#sec-tostring
        function ToString(argument) {
            return "" + argument;
        }
        // 7.1.14 ToPropertyKey(argument)
        // https://tc39.github.io/ecma262/#sec-topropertykey
        function ToPropertyKey(argument) {
            var key = ToPrimitive(argument);
            if (IsSymbol(key))
                return key;
            return ToString(key);
        }
        // 7.2 Testing and Comparison Operations
        // https://tc39.github.io/ecma262/#sec-testing-and-comparison-operations
        // 7.2.2 IsArray(argument)
        // https://tc39.github.io/ecma262/#sec-isarray
        function IsArray(argument) {
            return Array.isArray
                ? Array.isArray(argument)
                : argument instanceof Object
                    ? argument instanceof Array
                    : Object.prototype.toString.call(argument) === "[object Array]";
        }
        // 7.2.3 IsCallable(argument)
        // https://tc39.github.io/ecma262/#sec-iscallable
        function IsCallable(argument) {
            // NOTE: This is an approximation as we cannot check for [[Call]] internal method.
            return typeof argument === "function";
        }
        // 7.2.4 IsConstructor(argument)
        // https://tc39.github.io/ecma262/#sec-isconstructor
        function IsConstructor(argument) {
            // NOTE: This is an approximation as we cannot check for [[Construct]] internal method.
            return typeof argument === "function";
        }
        // 7.2.7 IsPropertyKey(argument)
        // https://tc39.github.io/ecma262/#sec-ispropertykey
        function IsPropertyKey(argument) {
            switch (Type(argument)) {
                case 3 /* String */: return true;
                case 4 /* Symbol */: return true;
                default: return false;
            }
        }
        function SameValueZero(x, y) {
            return x === y || x !== x && y !== y;
        }
        // 7.3 Operations on Objects
        // https://tc39.github.io/ecma262/#sec-operations-on-objects
        // 7.3.9 GetMethod(V, P)
        // https://tc39.github.io/ecma262/#sec-getmethod
        function GetMethod(V, P) {
            var func = V[P];
            if (func === undefined || func === null)
                return undefined;
            if (!IsCallable(func))
                throw new TypeError();
            return func;
        }
        // 7.4 Operations on Iterator Objects
        // https://tc39.github.io/ecma262/#sec-operations-on-iterator-objects
        function GetIterator(obj) {
            var method = GetMethod(obj, iteratorSymbol);
            if (!IsCallable(method))
                throw new TypeError(); // from Call
            var iterator = method.call(obj);
            if (!IsObject(iterator))
                throw new TypeError();
            return iterator;
        }
        // 7.4.4 IteratorValue(iterResult)
        // https://tc39.github.io/ecma262/2016/#sec-iteratorvalue
        function IteratorValue(iterResult) {
            return iterResult.value;
        }
        // 7.4.5 IteratorStep(iterator)
        // https://tc39.github.io/ecma262/#sec-iteratorstep
        function IteratorStep(iterator) {
            var result = iterator.next();
            return result.done ? false : result;
        }
        // 7.4.6 IteratorClose(iterator, completion)
        // https://tc39.github.io/ecma262/#sec-iteratorclose
        function IteratorClose(iterator) {
            var f = iterator["return"];
            if (f)
                f.call(iterator);
        }
        // 9.1 Ordinary Object Internal Methods and Internal Slots
        // https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
        // 9.1.1.1 OrdinaryGetPrototypeOf(O)
        // https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
        function OrdinaryGetPrototypeOf(O) {
            var proto = Object.getPrototypeOf(O);
            if (typeof O !== "function" || O === functionPrototype)
                return proto;
            // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
            // Try to determine the superclass constructor. Compatible implementations
            // must either set __proto__ on a subclass constructor to the superclass constructor,
            // or ensure each class has a valid `constructor` property on its prototype that
            // points back to the constructor.
            // If this is not the same as Function.[[Prototype]], then this is definately inherited.
            // This is the case when in ES6 or when using __proto__ in a compatible browser.
            if (proto !== functionPrototype)
                return proto;
            // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
            var prototype = O.prototype;
            var prototypeProto = prototype && Object.getPrototypeOf(prototype);
            if (prototypeProto == null || prototypeProto === Object.prototype)
                return proto;
            // If the constructor was not a function, then we cannot determine the heritage.
            var constructor = prototypeProto.constructor;
            if (typeof constructor !== "function")
                return proto;
            // If we have some kind of self-reference, then we cannot determine the heritage.
            if (constructor === O)
                return proto;
            // we have a pretty good guess at the heritage.
            return constructor;
        }
        // Global metadata registry
        // - Allows `import "reflect-metadata"` and `import "reflect-metadata/no-conflict"` to interoperate.
        // - Uses isolated metadata if `Reflect` is frozen before the registry can be installed.
        /**
         * Creates a registry used to allow multiple `reflect-metadata` providers.
         */
        function CreateMetadataRegistry() {
            var fallback;
            if (!IsUndefined(registrySymbol) &&
                typeof root.Reflect !== "undefined" &&
                !(registrySymbol in root.Reflect) &&
                typeof root.Reflect.defineMetadata === "function") {
                // interoperate with older version of `reflect-metadata` that did not support a registry.
                fallback = CreateFallbackProvider(root.Reflect);
            }
            var first;
            var second;
            var rest;
            var targetProviderMap = new _WeakMap();
            var registry = {
                registerProvider: registerProvider,
                getProvider: getProvider,
                setProvider: setProvider,
            };
            return registry;
            function registerProvider(provider) {
                if (!Object.isExtensible(registry)) {
                    throw new Error("Cannot add provider to a frozen registry.");
                }
                switch (true) {
                    case fallback === provider: break;
                    case IsUndefined(first):
                        first = provider;
                        break;
                    case first === provider: break;
                    case IsUndefined(second):
                        second = provider;
                        break;
                    case second === provider: break;
                    default:
                        if (rest === undefined)
                            rest = new _Set();
                        rest.add(provider);
                        break;
                }
            }
            function getProviderNoCache(O, P) {
                if (!IsUndefined(first)) {
                    if (first.isProviderFor(O, P))
                        return first;
                    if (!IsUndefined(second)) {
                        if (second.isProviderFor(O, P))
                            return first;
                        if (!IsUndefined(rest)) {
                            var iterator = GetIterator(rest);
                            while (true) {
                                var next = IteratorStep(iterator);
                                if (!next) {
                                    return undefined;
                                }
                                var provider = IteratorValue(next);
                                if (provider.isProviderFor(O, P)) {
                                    IteratorClose(iterator);
                                    return provider;
                                }
                            }
                        }
                    }
                }
                if (!IsUndefined(fallback) && fallback.isProviderFor(O, P)) {
                    return fallback;
                }
                return undefined;
            }
            function getProvider(O, P) {
                var providerMap = targetProviderMap.get(O);
                var provider;
                if (!IsUndefined(providerMap)) {
                    provider = providerMap.get(P);
                }
                if (!IsUndefined(provider)) {
                    return provider;
                }
                provider = getProviderNoCache(O, P);
                if (!IsUndefined(provider)) {
                    if (IsUndefined(providerMap)) {
                        providerMap = new _Map();
                        targetProviderMap.set(O, providerMap);
                    }
                    providerMap.set(P, provider);
                }
                return provider;
            }
            function hasProvider(provider) {
                if (IsUndefined(provider))
                    throw new TypeError();
                return first === provider || second === provider || !IsUndefined(rest) && rest.has(provider);
            }
            function setProvider(O, P, provider) {
                if (!hasProvider(provider)) {
                    throw new Error("Metadata provider not registered.");
                }
                var existingProvider = getProvider(O, P);
                if (existingProvider !== provider) {
                    if (!IsUndefined(existingProvider)) {
                        return false;
                    }
                    var providerMap = targetProviderMap.get(O);
                    if (IsUndefined(providerMap)) {
                        providerMap = new _Map();
                        targetProviderMap.set(O, providerMap);
                    }
                    providerMap.set(P, provider);
                }
                return true;
            }
        }
        /**
         * Gets or creates the shared registry of metadata providers.
         */
        function GetOrCreateMetadataRegistry() {
            var metadataRegistry;
            if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
                metadataRegistry = root.Reflect[registrySymbol];
            }
            if (IsUndefined(metadataRegistry)) {
                metadataRegistry = CreateMetadataRegistry();
            }
            if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
                Object.defineProperty(root.Reflect, registrySymbol, {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: metadataRegistry
                });
            }
            return metadataRegistry;
        }
        function CreateMetadataProvider(registry) {
            // [[Metadata]] internal slot
            // https://rbuckton.github.io/reflect-metadata/#ordinary-object-internal-methods-and-internal-slots
            var metadata = new _WeakMap();
            var provider = {
                isProviderFor: function (O, P) {
                    var targetMetadata = metadata.get(O);
                    if (IsUndefined(targetMetadata))
                        return false;
                    return targetMetadata.has(P);
                },
                OrdinaryDefineOwnMetadata: OrdinaryDefineOwnMetadata,
                OrdinaryHasOwnMetadata: OrdinaryHasOwnMetadata,
                OrdinaryGetOwnMetadata: OrdinaryGetOwnMetadata,
                OrdinaryOwnMetadataKeys: OrdinaryOwnMetadataKeys,
                OrdinaryDeleteMetadata: OrdinaryDeleteMetadata,
            };
            metadataRegistry.registerProvider(provider);
            return provider;
            function GetOrCreateMetadataMap(O, P, Create) {
                var targetMetadata = metadata.get(O);
                var createdTargetMetadata = false;
                if (IsUndefined(targetMetadata)) {
                    if (!Create)
                        return undefined;
                    targetMetadata = new _Map();
                    metadata.set(O, targetMetadata);
                    createdTargetMetadata = true;
                }
                var metadataMap = targetMetadata.get(P);
                if (IsUndefined(metadataMap)) {
                    if (!Create)
                        return undefined;
                    metadataMap = new _Map();
                    targetMetadata.set(P, metadataMap);
                    if (!registry.setProvider(O, P, provider)) {
                        targetMetadata.delete(P);
                        if (createdTargetMetadata) {
                            metadata.delete(O);
                        }
                        throw new Error("Wrong provider for target.");
                    }
                }
                return metadataMap;
            }
            // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
            function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return false;
                return ToBoolean(metadataMap.has(MetadataKey));
            }
            // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
            function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return undefined;
                return metadataMap.get(MetadataKey);
            }
            // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
            function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ true);
                metadataMap.set(MetadataKey, MetadataValue);
            }
            // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
            function OrdinaryOwnMetadataKeys(O, P) {
                var keys = [];
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return keys;
                var keysObj = metadataMap.keys();
                var iterator = GetIterator(keysObj);
                var k = 0;
                while (true) {
                    var next = IteratorStep(iterator);
                    if (!next) {
                        keys.length = k;
                        return keys;
                    }
                    var nextValue = IteratorValue(next);
                    try {
                        keys[k] = nextValue;
                    }
                    catch (e) {
                        try {
                            IteratorClose(iterator);
                        }
                        finally {
                            throw e;
                        }
                    }
                    k++;
                }
            }
            function OrdinaryDeleteMetadata(MetadataKey, O, P) {
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return false;
                if (!metadataMap.delete(MetadataKey))
                    return false;
                if (metadataMap.size === 0) {
                    var targetMetadata = metadata.get(O);
                    if (!IsUndefined(targetMetadata)) {
                        targetMetadata.delete(P);
                        if (targetMetadata.size === 0) {
                            metadata.delete(targetMetadata);
                        }
                    }
                }
                return true;
            }
        }
        function CreateFallbackProvider(reflect) {
            var defineMetadata = reflect.defineMetadata, hasOwnMetadata = reflect.hasOwnMetadata, getOwnMetadata = reflect.getOwnMetadata, getOwnMetadataKeys = reflect.getOwnMetadataKeys, deleteMetadata = reflect.deleteMetadata;
            var metadataOwner = new _WeakMap();
            var provider = {
                isProviderFor: function (O, P) {
                    var metadataPropertySet = metadataOwner.get(O);
                    if (!IsUndefined(metadataPropertySet) && metadataPropertySet.has(P)) {
                        return true;
                    }
                    if (getOwnMetadataKeys(O, P).length) {
                        if (IsUndefined(metadataPropertySet)) {
                            metadataPropertySet = new _Set();
                            metadataOwner.set(O, metadataPropertySet);
                        }
                        metadataPropertySet.add(P);
                        return true;
                    }
                    return false;
                },
                OrdinaryDefineOwnMetadata: defineMetadata,
                OrdinaryHasOwnMetadata: hasOwnMetadata,
                OrdinaryGetOwnMetadata: getOwnMetadata,
                OrdinaryOwnMetadataKeys: getOwnMetadataKeys,
                OrdinaryDeleteMetadata: deleteMetadata,
            };
            return provider;
        }
        /**
         * Gets the metadata provider for an object. If the object has no metadata provider and this is for a create operation,
         * then this module's metadata provider is assigned to the object.
         */
        function GetMetadataProvider(O, P, Create) {
            var registeredProvider = metadataRegistry.getProvider(O, P);
            if (!IsUndefined(registeredProvider)) {
                return registeredProvider;
            }
            if (Create) {
                if (metadataRegistry.setProvider(O, P, metadataProvider)) {
                    return metadataProvider;
                }
                throw new Error("Illegal state.");
            }
            return undefined;
        }
        // naive Map shim
        function CreateMapPolyfill() {
            var cacheSentinel = {};
            var arraySentinel = [];
            var MapIterator = /** @class */ (function () {
                function MapIterator(keys, values, selector) {
                    this._index = 0;
                    this._keys = keys;
                    this._values = values;
                    this._selector = selector;
                }
                MapIterator.prototype["@@iterator"] = function () { return this; };
                MapIterator.prototype[iteratorSymbol] = function () { return this; };
                MapIterator.prototype.next = function () {
                    var index = this._index;
                    if (index >= 0 && index < this._keys.length) {
                        var result = this._selector(this._keys[index], this._values[index]);
                        if (index + 1 >= this._keys.length) {
                            this._index = -1;
                            this._keys = arraySentinel;
                            this._values = arraySentinel;
                        }
                        else {
                            this._index++;
                        }
                        return { value: result, done: false };
                    }
                    return { value: undefined, done: true };
                };
                MapIterator.prototype.throw = function (error) {
                    if (this._index >= 0) {
                        this._index = -1;
                        this._keys = arraySentinel;
                        this._values = arraySentinel;
                    }
                    throw error;
                };
                MapIterator.prototype.return = function (value) {
                    if (this._index >= 0) {
                        this._index = -1;
                        this._keys = arraySentinel;
                        this._values = arraySentinel;
                    }
                    return { value: value, done: true };
                };
                return MapIterator;
            }());
            var Map = /** @class */ (function () {
                function Map() {
                    this._keys = [];
                    this._values = [];
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                }
                Object.defineProperty(Map.prototype, "size", {
                    get: function () { return this._keys.length; },
                    enumerable: true,
                    configurable: true
                });
                Map.prototype.has = function (key) { return this._find(key, /*insert*/ false) >= 0; };
                Map.prototype.get = function (key) {
                    var index = this._find(key, /*insert*/ false);
                    return index >= 0 ? this._values[index] : undefined;
                };
                Map.prototype.set = function (key, value) {
                    var index = this._find(key, /*insert*/ true);
                    this._values[index] = value;
                    return this;
                };
                Map.prototype.delete = function (key) {
                    var index = this._find(key, /*insert*/ false);
                    if (index >= 0) {
                        var size = this._keys.length;
                        for (var i = index + 1; i < size; i++) {
                            this._keys[i - 1] = this._keys[i];
                            this._values[i - 1] = this._values[i];
                        }
                        this._keys.length--;
                        this._values.length--;
                        if (SameValueZero(key, this._cacheKey)) {
                            this._cacheKey = cacheSentinel;
                            this._cacheIndex = -2;
                        }
                        return true;
                    }
                    return false;
                };
                Map.prototype.clear = function () {
                    this._keys.length = 0;
                    this._values.length = 0;
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                };
                Map.prototype.keys = function () { return new MapIterator(this._keys, this._values, getKey); };
                Map.prototype.values = function () { return new MapIterator(this._keys, this._values, getValue); };
                Map.prototype.entries = function () { return new MapIterator(this._keys, this._values, getEntry); };
                Map.prototype["@@iterator"] = function () { return this.entries(); };
                Map.prototype[iteratorSymbol] = function () { return this.entries(); };
                Map.prototype._find = function (key, insert) {
                    if (!SameValueZero(this._cacheKey, key)) {
                        this._cacheIndex = -1;
                        for (var i = 0; i < this._keys.length; i++) {
                            if (SameValueZero(this._keys[i], key)) {
                                this._cacheIndex = i;
                                break;
                            }
                        }
                    }
                    if (this._cacheIndex < 0 && insert) {
                        this._cacheIndex = this._keys.length;
                        this._keys.push(key);
                        this._values.push(undefined);
                    }
                    return this._cacheIndex;
                };
                return Map;
            }());
            return Map;
            function getKey(key, _) {
                return key;
            }
            function getValue(_, value) {
                return value;
            }
            function getEntry(key, value) {
                return [key, value];
            }
        }
        // naive Set shim
        function CreateSetPolyfill() {
            var Set = /** @class */ (function () {
                function Set() {
                    this._map = new _Map();
                }
                Object.defineProperty(Set.prototype, "size", {
                    get: function () { return this._map.size; },
                    enumerable: true,
                    configurable: true
                });
                Set.prototype.has = function (value) { return this._map.has(value); };
                Set.prototype.add = function (value) { return this._map.set(value, value), this; };
                Set.prototype.delete = function (value) { return this._map.delete(value); };
                Set.prototype.clear = function () { this._map.clear(); };
                Set.prototype.keys = function () { return this._map.keys(); };
                Set.prototype.values = function () { return this._map.keys(); };
                Set.prototype.entries = function () { return this._map.entries(); };
                Set.prototype["@@iterator"] = function () { return this.keys(); };
                Set.prototype[iteratorSymbol] = function () { return this.keys(); };
                return Set;
            }());
            return Set;
        }
        // naive WeakMap shim
        function CreateWeakMapPolyfill() {
            var UUID_SIZE = 16;
            var keys = HashMap.create();
            var rootKey = CreateUniqueKey();
            return /** @class */ (function () {
                function WeakMap() {
                    this._key = CreateUniqueKey();
                }
                WeakMap.prototype.has = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                    return table !== undefined ? HashMap.has(table, this._key) : false;
                };
                WeakMap.prototype.get = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                    return table !== undefined ? HashMap.get(table, this._key) : undefined;
                };
                WeakMap.prototype.set = function (target, value) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ true);
                    table[this._key] = value;
                    return this;
                };
                WeakMap.prototype.delete = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                    return table !== undefined ? delete table[this._key] : false;
                };
                WeakMap.prototype.clear = function () {
                    // NOTE: not a real clear, just makes the previous data unreachable
                    this._key = CreateUniqueKey();
                };
                return WeakMap;
            }());
            function CreateUniqueKey() {
                var key;
                do
                    key = "@@WeakMap@@" + CreateUUID();
                while (HashMap.has(keys, key));
                keys[key] = true;
                return key;
            }
            function GetOrCreateWeakMapTable(target, create) {
                if (!hasOwn.call(target, rootKey)) {
                    if (!create)
                        return undefined;
                    Object.defineProperty(target, rootKey, { value: HashMap.create() });
                }
                return target[rootKey];
            }
            function FillRandomBytes(buffer, size) {
                for (var i = 0; i < size; ++i)
                    buffer[i] = Math.random() * 0xff | 0;
                return buffer;
            }
            function GenRandomBytes(size) {
                if (typeof Uint8Array === "function") {
                    var array = new Uint8Array(size);
                    if (typeof crypto !== "undefined") {
                        crypto.getRandomValues(array);
                    }
                    else if (typeof msCrypto !== "undefined") {
                        msCrypto.getRandomValues(array);
                    }
                    else {
                        FillRandomBytes(array, size);
                    }
                    return array;
                }
                return FillRandomBytes(new Array(size), size);
            }
            function CreateUUID() {
                var data = GenRandomBytes(UUID_SIZE);
                // mark as random - RFC 4122 § 4.4
                data[6] = data[6] & 0x4f | 0x40;
                data[8] = data[8] & 0xbf | 0x80;
                var result = "";
                for (var offset = 0; offset < UUID_SIZE; ++offset) {
                    var byte = data[offset];
                    if (offset === 4 || offset === 6 || offset === 8)
                        result += "-";
                    if (byte < 16)
                        result += "0";
                    result += byte.toString(16).toLowerCase();
                }
                return result;
            }
        }
        // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
        function MakeDictionary(obj) {
            obj.__ = undefined;
            delete obj.__;
            return obj;
        }
    });
})(Reflect$1 || (Reflect$1 = {}));

class $PanicError extends Error {}
function $panic() {
  throw new $PanicError();
}
const moonbitlang$core$builtin$$JSArray$push = (arr, val) => { arr.push(val); };
const moonbitlang$core$builtin$$JSArray$set_length = (arr, len) => { arr.length = len; };
const moonbitlang$core$array$$JSArray$copy = (arr) => arr.slice(0);
function Token$Enum(param0) {
  this._0 = param0;
}
Token$Enum.prototype.$tag = 0;
Token$Enum.prototype.type = 'enum';
function Token$Required(param0) {
  this._0 = param0;
}
Token$Required.prototype.$tag = 1;
Token$Required.prototype.type = 'required';
function Token$Optional(param0) {
  this._0 = param0;
}
Token$Optional.prototype.$tag = 2;
Token$Optional.prototype.type = 'optional';
const $64$moonbitlang$47$core$47$builtin$46$ForeachResult$Continue$0$ = { $tag: 0 };
function moonbitlang$core$string$$String$substring$46$inner(self, start, end) {
  const len = self.length;
  let end$2;
  if (end === undefined) {
    end$2 = len;
  } else {
    const _Some = end;
    end$2 = _Some;
  }
  return start >= 0 && (start <= end$2 && end$2 <= len) ? self.substring(start, end$2) : $panic();
}
function moonbitlang$core$array$$Array$push$0$(self, value) {
  moonbitlang$core$builtin$$JSArray$push(self, value);
}
function moonbitlang$core$array$$Array$push$1$(self, value) {
  moonbitlang$core$builtin$$JSArray$push(self, value);
}
function moonbitlang$core$builtin$$println$0$(input) {
  console.log(input);
}
function moonbitlang$core$array$$Array$unsafe_truncate_to_length$0$(self, new_len) {
  moonbitlang$core$builtin$$JSArray$set_length(self, new_len);
}
function moonbitlang$core$array$$Array$clear$0$(self) {
  moonbitlang$core$array$$Array$unsafe_truncate_to_length$0$(self, 0);
}
function moonbitlang$core$array$$Array$copy$0$(self) {
  return moonbitlang$core$array$$JSArray$copy(self);
}
function moonbitlang$core$string$$code_point_of_surrogate_pair(leading, trailing) {
  return (((Math.imul(leading - 55296 | 0, 1024) | 0) + trailing | 0) - 56320 | 0) + 65536 | 0;
}
function moonbitlang$core$string$$String$iter(self) {
  const _p = (yield_) => {
    const len = self.length;
    let _tmp = 0;
    while (true) {
      const index = _tmp;
      if (index < len) {
        const c1 = self.charCodeAt(index);
        if (55296 <= c1 && c1 <= 56319 && (index + 1 | 0) < len) {
          const _tmp$2 = index + 1 | 0;
          const c2 = self.charCodeAt(_tmp$2);
          if (56320 <= c2 && c2 <= 57343) {
            const c = moonbitlang$core$string$$code_point_of_surrogate_pair(c1, c2);
            const _bind = yield_(c);
            if (_bind === 1) {
              _tmp = index + 2 | 0;
              continue;
            } else {
              return 0;
            }
          }
        }
        const _bind = yield_(c1);
        if (_bind === 1) ; else {
          return 0;
        }
        _tmp = index + 1 | 0;
        continue;
      } else {
        return 1;
      }
    }
  };
  return _p;
}
function username$command_tokenizer$$error$0$(message) {
  moonbitlang$core$builtin$$println$0$(message);
}
function username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env) {
  const enums = _env._1;
  const tokens = _env._0;
  if (enums.length > 0) {
    moonbitlang$core$array$$Array$push$1$(tokens, new Token$Enum(moonbitlang$core$array$$Array$copy$0$(enums)));
    moonbitlang$core$array$$Array$clear$0$(enums);
    return;
  } else {
    return;
  }
}
function username$command_tokenizer$$command_tokens(c) {
  const chars = `${c}\u0000`;
  const tokens = [];
  const enums = [];
  const char_index = { val: -1 };
  const state = { val: 0 };
  const capture0_start = { val: -1 };
  const capture0_end = { val: -1 };
  const capture1_start = { val: -1 };
  const capture1_end = { val: -1 };
  const capture2_start = { val: -1 };
  const capture2_end = { val: -1 };
  const _env = { _0: tokens, _1: enums };
  let _foreach_result = $64$moonbitlang$47$core$47$builtin$46$ForeachResult$Continue$0$;
  const _bind = moonbitlang$core$string$$String$iter(chars);
  _bind((char) => {
    char_index.val = char_index.val + 1 | 0;
    _L: {
      _L$2: {
        _L$3: {
          _L$4: {
            if (char === 124) {
              const _bind$2 = state.val;
              switch (_bind$2) {
                case 1: {
                  state.val = 3;
                  capture0_end.val = char_index.val;
                  moonbitlang$core$array$$Array$push$0$(enums, moonbitlang$core$string$$String$substring$46$inner(c, capture0_start.val, capture0_end.val));
                  break;
                }
                case 2: {
                  state.val = 3;
                  break;
                }
                default: {
                  username$command_tokenizer$$error$0$("Unexpected '|' character");
                }
              }
            } else {
              if (char === 32) {
                break _L$4;
              } else {
                if (char === 10) {
                  break _L$4;
                } else {
                  if (char === 60) {
                    _L$5: {
                      _L$6: {
                        const _bind$2 = state.val;
                        switch (_bind$2) {
                          case 0: {
                            break _L$6;
                          }
                          case 2: {
                            break _L$6;
                          }
                          default: {
                            username$command_tokenizer$$error$0$("Unexpected '<' character");
                          }
                        }
                        break _L$5;
                      }
                      state.val = 4;
                      username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env);
                    }
                  } else {
                    if (char === 62) {
                      const _bind$2 = state.val;
                      switch (_bind$2) {
                        case 14: {
                          state.val = 0;
                          moonbitlang$core$array$$Array$push$1$(tokens, new Token$Required({ name: moonbitlang$core$string$$String$substring$46$inner(c, capture1_start.val, capture1_end.val), vType: moonbitlang$core$string$$String$substring$46$inner(c, capture2_start.val, capture2_end.val) }));
                          break;
                        }
                        case 10: {
                          state.val = 0;
                          moonbitlang$core$array$$Array$push$1$(tokens, new Token$Required({ name: moonbitlang$core$string$$String$substring$46$inner(c, capture1_start.val, capture1_end.val), vType: moonbitlang$core$string$$String$substring$46$inner(c, capture2_start.val, char_index.val) }));
                          break;
                        }
                        default: {
                          username$command_tokenizer$$error$0$("Unexpected '>' character");
                        }
                      }
                    } else {
                      if (char === 91) {
                        _L$5: {
                          _L$6: {
                            const _bind$2 = state.val;
                            switch (_bind$2) {
                              case 0: {
                                break _L$6;
                              }
                              case 2: {
                                break _L$6;
                              }
                              default: {
                                username$command_tokenizer$$error$0$("Unexpected '[' character");
                              }
                            }
                            break _L$5;
                          }
                          state.val = 5;
                          username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env);
                        }
                      } else {
                        if (char === 93) {
                          const _bind$2 = state.val;
                          switch (_bind$2) {
                            case 15: {
                              state.val = 0;
                              moonbitlang$core$array$$Array$push$1$(tokens, new Token$Optional({ name: moonbitlang$core$string$$String$substring$46$inner(c, capture1_start.val, capture1_end.val), vType: moonbitlang$core$string$$String$substring$46$inner(c, capture2_start.val, capture2_end.val) }));
                              break;
                            }
                            case 11: {
                              state.val = 0;
                              moonbitlang$core$array$$Array$push$1$(tokens, new Token$Optional({ name: moonbitlang$core$string$$String$substring$46$inner(c, capture1_start.val, capture1_end.val), vType: moonbitlang$core$string$$String$substring$46$inner(c, capture2_start.val, char_index.val) }));
                              break;
                            }
                            default: {
                              username$command_tokenizer$$error$0$("Unexpected ']' character");
                            }
                          }
                        } else {
                          if (char === 58) {
                            const _bind$2 = state.val;
                            switch (_bind$2) {
                              case 8: {
                                state.val = 6;
                                capture1_end.val = char_index.val;
                                break;
                              }
                              case 9: {
                                state.val = 7;
                                capture1_end.val = char_index.val;
                                break;
                              }
                              case 12: {
                                state.val = 6;
                                break;
                              }
                              case 13: {
                                state.val = 7;
                                break;
                              }
                              default: {
                                username$command_tokenizer$$error$0$("Unexpected ':' character");
                              }
                            }
                          } else {
                            if (char >= 97 && char <= 122) {
                              break _L$2;
                            } else {
                              if (char >= 65 && char <= 90) {
                                break _L$2;
                              } else {
                                if (char >= 48 && char <= 57) {
                                  break _L$2;
                                } else {
                                  if (char === 95) {
                                    break _L$2;
                                  } else {
                                    if (char === 0) {
                                      const _bind$2 = state.val;
                                      switch (_bind$2) {
                                        case 1: {
                                          capture0_end.val = char_index.val;
                                          moonbitlang$core$array$$Array$push$0$(enums, moonbitlang$core$string$$String$substring$46$inner(c, capture0_start.val, capture0_end.val));
                                          username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env);
                                          break;
                                        }
                                        case 2: {
                                          username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env);
                                          break;
                                        }
                                        case 0: {
                                          break;
                                        }
                                        default: {
                                          username$command_tokenizer$$error$0$("Unexpected character");
                                        }
                                      }
                                    } else {
                                      username$command_tokenizer$$error$0$("Unexpected character");
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            break _L$3;
          }
          const _bind$2 = state.val;
          switch (_bind$2) {
            case 1: {
              state.val = 2;
              capture0_end.val = char_index.val;
              moonbitlang$core$array$$Array$push$0$(enums, moonbitlang$core$string$$String$substring$46$inner(c, capture0_start.val, capture0_end.val));
              break;
            }
            case 8: {
              state.val = 12;
              capture1_end.val = char_index.val;
              break;
            }
            case 9: {
              state.val = 13;
              capture1_end.val = char_index.val;
              break;
            }
            case 10: {
              state.val = 14;
              capture2_end.val = char_index.val;
              break;
            }
            case 11: {
              state.val = 15;
              capture2_end.val = char_index.val;
              break;
            }
            default: {
              return 1;
            }
          }
        }
        break _L;
      }
      _L$3: {
        _L$4: {
          _L$5: {
            _L$6: {
              const _bind$2 = state.val;
              switch (_bind$2) {
                case 0: {
                  break _L$6;
                }
                case 3: {
                  break _L$6;
                }
                case 2: {
                  state.val = 1;
                  username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env);
                  capture0_start.val = char_index.val;
                  break;
                }
                case 12: {
                  break _L$4;
                }
                case 14: {
                  break _L$4;
                }
                case 15: {
                  break _L$4;
                }
                case 13: {
                  break _L$4;
                }
                case 4: {
                  state.val = 8;
                  capture1_start.val = char_index.val;
                  break;
                }
                case 5: {
                  state.val = 9;
                  capture1_start.val = char_index.val;
                  break;
                }
                case 6: {
                  state.val = 10;
                  capture2_start.val = char_index.val;
                  break;
                }
                case 7: {
                  state.val = 11;
                  capture2_start.val = char_index.val;
                  break;
                }
                default: {
                  return 1;
                }
              }
              break _L$5;
            }
            state.val = 1;
            capture0_start.val = char_index.val;
          }
          break _L$3;
        }
        username$command_tokenizer$$error$0$("Unexpected identifier");
      }
    }
    return 1;
  });
  const _tmp = _foreach_result;
  switch (_tmp.$tag) {
    case 0: {
      break;
    }
    case 1: {
      break;
    }
    case 2: {
      const _return = _tmp;
      return _return._0;
    }
    case 3: {
      $panic();
      break;
    }
    default: {
      $panic();
    }
  }
  return tokens;
}

const StringParamType = {
    bool: CustomCommandParamType.Boolean,
    int: CustomCommandParamType.Integer,
    float: CustomCommandParamType.Float,
    string: CustomCommandParamType.String,
    entity: CustomCommandParamType.EntitySelector,
    actor: CustomCommandParamType.EntitySelector,
    player: CustomCommandParamType.PlayerSelector,
    xyz: CustomCommandParamType.Location,
    pos: CustomCommandParamType.Location,
    vec: CustomCommandParamType.Location,
    text: CustomCommandParamType.String,
    message: CustomCommandParamType.String,
    json: CustomCommandParamType.String,
    item: CustomCommandParamType.ItemType,
    block: CustomCommandParamType.BlockType,
    // effect      : CustomCommandParamType.Effect,
    enum: CustomCommandParamType.Enum,
    // softEnum    : CustomCommandParamType.SoftEnum,
    entities: CustomCommandParamType.EntityType,
    actor_type: CustomCommandParamType.EntityType,
    // command     : CustomCommandParamType.Command,
    // selector    : CustomCommandParamType.WildcardSelector,
};
const enumMapping = new Map();
class CommandRegistry {
    static registerFns = new Set();
    static registerAll(customRegistry) {
        for (const fn of CommandRegistry.registerFns) {
            fn(customRegistry);
        }
    }
    static registerFromOptions({ name, description, permissionLevel, cheatsRequired, parameters }, fn) {
        CommandRegistry.registerFns.add((customRegistry) => {
            parameters.filter(token => token.type === 'enum').forEach(({ _0 }) => {
                const key = 'ss:enum_' + String(enumMapping.size);
                enumMapping.set(_0, key);
                customRegistry.registerEnum(key, _0);
            });
            const mandatories = [];
            const optionals = [];
            const paramNames = [];
            parameters.forEach(param => {
                const { type, _0: value } = param;
                if (type === 'enum') {
                    const optional = param.optional;
                    const key = enumMapping.get(value);
                    if (!key) {
                        return;
                    }
                    paramNames.push(key);
                    return (optional ? optionals : mandatories).push({
                        name: key,
                        type: StringParamType.enum,
                    });
                }
                const { name, vType } = value;
                if (type === 'required') {
                    paramNames.push(name);
                    return mandatories.push({
                        name,
                        type: StringParamType[vType],
                    });
                }
                if (type === 'optional') {
                    paramNames.push(name);
                    return optionals.push({
                        name,
                        type: StringParamType[vType],
                    });
                }
            });
            customRegistry.registerCommand({
                cheatsRequired,
                name,
                description,
                permissionLevel,
                mandatoryParameters: mandatories,
                optionalParameters: optionals,
            }, (origin, ...params) => {
                const args = {};
                paramNames.forEach((name, i) => {
                    args[name] = params[i];
                });
                let result = {
                    status: CustomCommandStatus.Success,
                };
                fn(args, {
                    rawArgs: params,
                    origin,
                    success(message) {
                        result.status = CustomCommandStatus.Success;
                        result.message = message ?? '';
                    },
                    failure(message) {
                        result.status = CustomCommandStatus.Failure;
                        result.message = message ?? '';
                    }
                });
                return result;
            });
        });
        return this;
    }
    static register(name, description, template, fn, permissionLevel = CommandPermissionLevel.GameDirectors, cheatsRequired = true) {
        const parameters = username$command_tokenizer$$command_tokens(template);
        const commandMeta = {
            name,
            description,
            permissionLevel,
            cheatsRequired,
            parameters,
        };
        return this.registerFromOptions(commandMeta, fn);
    }
}

var ParamType;
(function (ParamType) {
    ParamType[ParamType["Enum"] = 0] = "Enum";
    ParamType[ParamType["Required"] = 1] = "Required";
    ParamType[ParamType["Optional"] = 2] = "Optional";
    ParamType[ParamType["Origin"] = 3] = "Origin";
    ParamType[ParamType["Success"] = 4] = "Success";
    ParamType[ParamType["Fail"] = 5] = "Fail";
    ParamType[ParamType["App"] = 6] = "App";
})(ParamType || (ParamType = {}));
const commandMetas = new Map();
function getMeta(obj) {
    let meta = commandMetas.get(obj);
    if (!meta) {
        meta = {
            name: "",
            description: "",
            permissionLevel: CommandPermissionLevel.GameDirectors,
            cheatsRequired: false,
            decoratedParams: [],
            wrapped: () => Function.prototype,
        };
        commandMetas.set(obj, meta);
    }
    return meta;
}
var Param;
(function (Param) {
    function Enum(...enums) {
        return (t, p, i) => {
            const meta = getMeta(t[p]);
            meta.decoratedParams.push({
                enums,
                index: i,
                type: ParamType.Enum,
            });
        };
    }
    Param.Enum = Enum;
    function OptionalEnum(...enums) {
        return (t, p, i) => {
            const meta = getMeta(t[p]);
            meta.decoratedParams.push({
                optionalEnum: true,
                enums,
                index: i,
                type: ParamType.Enum,
            });
        };
    }
    Param.OptionalEnum = OptionalEnum;
    function Required(type, name) {
        return (t, p, i) => {
            const meta = getMeta(t[p]);
            meta.decoratedParams.push({
                argType: type,
                name,
                index: i,
                type: ParamType.Required,
            });
        };
    }
    Param.Required = Required;
    function Optional(type, name) {
        return (t, p, i) => {
            const meta = getMeta(t[p]);
            meta.decoratedParams.push({
                argType: type,
                name,
                index: i,
                type: ParamType.Optional,
            });
        };
    }
    Param.Optional = Optional;
    Param.Origin = (t, p, i) => {
        getMeta(t[p]).decoratedParams.push({
            index: i,
            type: ParamType.Origin,
        });
    };
    Param.Success = (t, p, i) => {
        getMeta(t[p]).decoratedParams.push({
            index: i,
            type: ParamType.Success,
        });
    };
    Param.Fail = (t, p, i) => {
        getMeta(t[p]).decoratedParams.push({
            index: i,
            type: ParamType.Optional,
        });
    };
    Param.App = (t, p, i) => {
        getMeta(t[p]).decoratedParams.push({
            index: i,
            type: ParamType.App,
        });
    };
})(Param || (Param = {}));
function registerCommandFromMeta({ decoratedParams, name, description, permissionLevel, cheatsRequired, wrapped }, app) {
    const parameters = [];
    let rawIndex = 0;
    for (const paramemter of decoratedParams.toReversed()) {
        const { name, type, argType, enums, optionalEnum } = paramemter;
        const paramName = name ?? `arg${rawIndex}`;
        if (type > 2) {
            continue;
        }
        if (type === ParamType.Enum) {
            paramemter.argIndex = rawIndex++;
            let param = new Token$Enum(enums ?? ['default']);
            if (optionalEnum) {
                param.optional = true;
            }
            parameters.push(param);
            continue;
        }
        paramemter.argIndex = rawIndex++;
        parameters.push(type === ParamType.Required ? new Token$Required({ name: paramName, vType: argType })
            : new Token$Optional({ name: paramName, vType: argType }));
    }
    CommandRegistry.registerFromOptions({
        name,
        description,
        permissionLevel,
        cheatsRequired,
        parameters,
    }, wrapped(app));
}
function registerAllFromAnnotations(app) {
    for (const meta of commandMetas.values()) {
        registerCommandFromMeta(meta, app);
    }
    commandMetas.clear();
}
function CustomCommand(description, permissionLevel = CommandPermissionLevel.GameDirectors, cheatsRequired = true, name, namespace = "ss") {
    return (target, property, descriptor) => {
        const fn = target[property];
        let meta = getMeta(fn);
        const { decoratedParams } = meta;
        const wrapped = (app) => (_, { success, failure, origin, rawArgs }) => {
            const fnArgs = [];
            for (const { index, type, argIndex, argType } of decoratedParams) {
                if (type < 3) {
                    if (argType === 'actor') {
                        const entities = rawArgs[argIndex];
                        fnArgs[index] = entities.map(en => app.getActor(en.id));
                    }
                    else {
                        fnArgs[index] = rawArgs[argIndex];
                    }
                    continue;
                }
                switch (type) {
                    case ParamType.Origin:
                        fnArgs[index] = origin;
                        continue;
                    case ParamType.Success:
                        fnArgs[index] = success;
                        continue;
                    case ParamType.Fail:
                        fnArgs[index] = failure;
                        continue;
                    case ParamType.App:
                        fnArgs[index] = app;
                        continue;
                }
            }
            return fn(...fnArgs);
        };
        meta.name = `${namespace}:${String(property)}`;
        meta.description = description;
        meta.permissionLevel = permissionLevel;
        meta.cheatsRequired = cheatsRequired;
        meta.wrapped = wrapped;
        return descriptor;
    };
}

class EventLinked {
    static map = new Map();
    HEAD = {
        prev: null,
        next: null
    };
    END = this.HEAD;
    count = 0;
    append(listener, rawListener) {
        const prev = this.END;
        const cur = {
            prev, listener, rawListener, next: null,
        };
        cur.prev = prev;
        cur.listener = listener;
        cur.rawListener = rawListener;
        cur.next = null;
        prev.next = cur;
        this.END = cur;
        EventLinked.map.set(rawListener || listener, cur);
        this.count++;
        return this;
    }
    prepend(listener, rawListener) {
        const prev = this.HEAD;
        const next = prev.next;
        const cur = {
            prev, listener, rawListener, next
        };
        prev.next = cur;
        if (next) {
            next.prev = cur;
        }
        EventLinked.map.set(rawListener || listener, cur);
        this.count++;
        return this;
    }
    delete(rawListener) {
        let map = EventLinked.map, cur = map.get(rawListener);
        if (!cur || !cur.prev) {
            return;
        }
        let pre = cur.prev;
        pre.next = cur.next;
        if (cur.next) {
            cur.next.prev = pre;
        }
        map.delete(rawListener);
        this.count--;
        requestIdleCallback(() => {
            cur.prev = null;
            cur.next = null;
        });
        return this;
    }
    deleteAll() {
        let node = this.HEAD;
        while (node = node.next) {
            node.prev = null;
            node.next = null;
            EventLinked.map.delete(node.rawListener || node.listener);
        }
        this.HEAD.next = null;
        this.count = 0;
        return this;
    }
    [Symbol.iterator]() {
        let ptr = this.HEAD;
        return {
            next() {
                if (ptr.next) {
                    ptr = ptr.next;
                }
                else {
                    return {
                        value: ptr,
                        done: true,
                    };
                }
                return {
                    value: ptr,
                    done: false
                };
            }
        };
    }
}

class ReflectConfig {
    static mod;
    static #contextSymbol;
    static set contextActor(actor) {
        this.#contextSymbol = actor;
    }
    static unsafeCtxActor() {
        return this.#contextSymbol;
    }
    static contextActorRef() {
        return new ActorWeakRef(this.#contextSymbol);
    }
}
class ActorWeakRef {
    #actor;
    constructor(actor) {
        this.#actor = actor;
    }
    deref() {
        if (!this.isValid) {
            return void 0;
        }
        const returnVal = this.#actor;
        this.#actor = void 0;
        return returnVal;
    }
    get isValid() {
        const actor = this.#actor;
        if (actor) {
            // @ts-ignore
            return Boolean(actor?.entity?.isValid);
        }
        return false;
    }
}

/**
 * 组件
 * 若需要 `Component.update()`, allowTicking 必须为 `true`
 */
class Component {
    /**
     * 不要在 `Component.start()`, `Component.update()` 生命周期以外使用这个变量
     * 这个变量只在以上两个生命周期内有效
     * 若需要长期持有当前 `contextActor`, 请使用 {@link ReflectConfig.contextActorRef}
     */
    get actor() {
        return ReflectConfig.unsafeCtxActor();
    }
    /**
     * 组件 ticking 是否启用
     * 若组件 ticking 未启用，则不会调用 `Component.update()`
     */
    allowTicking = false;
    /**
     * 下一次更新前移除组件本身
     */
    remove() {
        return this.removeComponent(this);
    }
    getComponent(arg) {
        return this.actor.getComponent(arg);
    }
    addComponent(arg1, component) {
        const { promise, resolve } = Promise.withResolvers();
        this.actor.beforeNextUpdate(actor => {
            actor.addComponent(arg1, component);
            resolve();
        });
        return promise;
    }
    removeComponent(arg) {
        const { promise, resolve } = Promise.withResolvers();
        this.actor.beforeNextUpdate(actor => {
            actor.removeComponent(arg);
            resolve();
        });
        return promise;
    }
}

/**
 * 一个 发布-订阅 模式的事件触发器类，相比于 EventSignal, EventInstigator 可以为``特定事件``添加多个回调函数
 *
 * 相较于 EventSignal, EventInstigator 的删除事件性能较好，用于需要频繁删除监听器的情况，否则请使用 EventSignal
 */
class EventInstigator {
    events = {};
    addListener(eventName, callback) {
        let eventLinked = this.events[eventName];
        if (!eventLinked) {
            eventLinked = (this.events[eventName] = new EventLinked());
        }
        eventLinked.append(callback);
    }
    trigger(eventName, ...args) {
        const eventLinked = this.events[eventName];
        if (eventLinked) {
            for (const cb of eventLinked) {
                cb.listener?.(...args);
            }
        }
    }
    removeListener(eventName, callback) {
        const eventLinked = this.events[eventName];
        if (eventLinked) {
            eventLinked.delete(callback);
        }
    }
    on = this.addListener;
    off = this.removeListener;
}
/**
 * 一个 发布-订阅 模式的事件触发器类，是 {@link EventInstigator} 的 {@link Component} 实现
 */
class EventComponent extends Component {
    events = {};
    addListener(eventName, callback) {
        let eventLinked = this.events[eventName];
        if (!eventLinked) {
            eventLinked = (this.events[eventName] = new EventLinked());
        }
        eventLinked.append(callback);
    }
    trigger(eventName, ...args) {
        const eventLinked = this.events[eventName];
        if (eventLinked) {
            for (const cb of eventLinked) {
                cb.listener?.(...args);
            }
        }
    }
    removeListener(eventName, callback) {
        const eventLinked = this.events[eventName];
        if (eventLinked) {
            eventLinked.delete(callback);
        }
    }
    on = this.addListener;
    off = this.removeListener;
}
/**
 * 一个事件 Observable，可以绑定多个回调函数，当事件触发时，所有绑定的回调函数都会被调用
 */
class EventSignal {
    _observers = [];
    addListener = (callback) => {
        this._observers.push(callback);
    };
    /**
     * 尽可能不使用 off，因为 off 性能较差
     * @param callback
     */
    removeListener = (callback) => {
        const callbackIndex = this._observers.indexOf(callback);
        if (callbackIndex !== -1) {
            this._observers.splice(callbackIndex, 1);
        }
    };
    trigger = (...args) => {
        this._observers.forEach(callback => callback.apply(undefined, args));
    };
    on = this.addListener;
    off = this.removeListener;
}
/**
 * 一个事件委托，只能绑定一个回调函数
 */
class EventDelegate {
    onNotify_;
    bind = (callback, thisArg) => {
        if (thisArg) {
            this.onNotify_ = callback.bind(thisArg);
            return;
        }
        this.onNotify_ = callback;
    };
    call = (...args) => {
        this.onNotify_?.apply(undefined, args);
    };
    unbind = () => {
        this.onNotify_ = undefined;
    };
}

class ObjectHelperClass extends EventInstigator {
    /**
     * 深度优先，忽略根节点，
     * 无法确定是否后序，v8引擎通常是后序
     */
    traverse(object, callback, path = []) {
        Object.entries(object).forEach(([k, v]) => {
            const _path = [...path, k];
            if (this.isObject(v)) {
                ObjectHelper.traverse(v, callback, _path);
            }
            callback(v, k, object, _path);
        });
    }
    isObject(obj) {
        return obj !== null && typeof obj === 'object';
    }
    newObject(ctor, args = []) {
        const object = Reflect.construct(ctor, args);
        this.trigger('construct', ctor, object, args);
        return object;
    }
}
const ObjectHelper = new ObjectHelperClass();

const tickableClasses = new Set();
var ticking;
(function (ticking_1) {
    function queue(task) {
        system.run(task);
    }
    ticking_1.queue = queue;
    function timeout(fn, delay) {
        system.runTimeout(fn, delay);
    }
    ticking_1.timeout = timeout;
    function repeat(fn, interval) {
        system.runInterval(fn, interval);
    }
    ticking_1.repeat = repeat;
    function tickable(group, fn) {
        const ticking = getTickingGroup(group);
        const _tickable = {
            allowTicking: true,
            tickingGroup: group,
            tick: fn,
        };
        ticking.add(fn);
        return _tickable;
    }
    ticking_1.tickable = tickable;
    const tickingGroups = new Map();
    class Ticking {
        group;
        dilation;
        lastTick = 0;
        lastDate = 0;
        tickables = new Set();
        constructor(group, dilation) {
            this.group = group;
            this.dilation = dilation;
        }
        add(tickable) {
            this.tickables.add(tickable);
        }
        remove(tickable) {
            this.tickables.delete(tickable);
        }
        tick() {
            const currTick = system.currentTick;
            const currDate = Date.now();
            const dt = (currTick - this.lastTick) * this.dilation;
            const dms = (currDate - this.lastDate) * this.dilation;
            for (const { tick, update, allowTicking } of this.tickables) {
                if (allowTicking) {
                    (tick ?? update)?.(dt, dms);
                }
            }
            this.lastTick = currTick;
            this.lastDate = currDate;
        }
    }
    ticking_1.Ticking = Ticking;
    function getTickingGroup(group) {
        let ticking = tickingGroups.get(group);
        if (!ticking) {
            ticking = new Ticking(group, 1);
            tickingGroups.set(group, ticking);
        }
        return ticking;
    }
    ticking_1.getTickingGroup = getTickingGroup;
    function tick(group) {
        tickingGroups.get(group)?.tick();
    }
    ticking_1.tick = tick;
    function clear(group) {
        tickingGroups.delete(group);
    }
    ticking_1.clear = clear;
    function clearAll() {
        tickingGroups.clear();
    }
    ticking_1.clearAll = clearAll;
    function addTickingObject(tickable) {
        getTickingGroup(tickable.tickingGroup).add(tickable);
    }
    ticking_1.addTickingObject = addTickingObject;
    function removeTickingObject(tickable) {
        getTickingGroup(tickable.tickingGroup).remove(tickable);
    }
    ticking_1.removeTickingObject = removeTickingObject;
    /**
     * 自动将所有Tickable对象添加到ticking调度中
     */
    ObjectHelper.addListener('construct', (ctor, inst) => {
        const instance = inst;
        if (tickableClasses.has(ctor)) {
            ticking.addTickingObject(instance);
        }
    });
})(ticking || (ticking = {}));

class Resources {
    static with(res, fn) {
        let ret = null;
        res?.enter?.();
        try {
            ret = [fn(), null];
        }
        catch (error) {
            ret = [null, error];
        }
        res?.exit?.();
        return ret;
    }
    static async withAsync(res, afn) {
        let ret = null;
        res?.enter?.();
        try {
            ret = [await afn(), null];
        }
        catch (error) {
            ret = [null, error];
        }
        res?.exit?.();
        return ret;
    }
    static resouceMapping = new Map();
    static load(...res) {
        return res.map(r => {
            const res = Reflect.construct(r, []);
            this.resouceMapping.set(r, res);
            res?.enter?.();
            return res;
        });
    }
    static getResouce(ctor) {
        return this.resouceMapping.get(ctor);
    }
    static unload(...res) {
        for (const r of res) {
            const res = this.resouceMapping.get(r);
            res?.exit?.();
            this.resouceMapping.delete(r);
        }
    }
}

const isTag = Symbol('isTag');
var TagEventType;
(function (TagEventType) {
    TagEventType[TagEventType["Add"] = 0] = "Add";
    TagEventType[TagEventType["Remove"] = 1] = "Remove";
})(TagEventType || (TagEventType = {}));
class Tag {
    tag;
    static _tagMap = new Map();
    static constructable = (() => {
        let allowTagConstruct = false;
        const enter = () => allowTagConstruct = true;
        const exit = () => allowTagConstruct = false;
        return new Proxy({
            enter,
            exit
        }, {
            get(t, p, r) {
                if (p === 'allowTagConstruct') {
                    return allowTagConstruct;
                }
                return t[p];
            },
            set(t, p, v, r) {
                return false;
            }
        });
    })();
    static isValid(tagStr) {
        const container = tagStr.trim().split('.');
        return !container.some(v => !v.match(/[\w\$]+/));
    }
    static from(tagStr) {
        return new Tag(tagStr);
    }
    static of(tag) {
        // @ts-ignore
        return tag[isTag] === Object.prototype ? tag : Tag._tagMap.get(tag);
    }
    _isValid;
    _childTag = new Set();
    [isTag] = Object.prototype;
    // create
    constructor(tag) {
        this.tag = tag;
        if (!Tag.constructable.allowTagConstruct) {
            throw new Error('Tag class is not allowed to construct');
        }
        if (this._isValid = Tag.isValid(tag)) {
            Tag._tagMap.set(tag, this);
        }
    }
    get isValid() {
        return this._isValid;
    }
    toString() {
        if (this._isValid) {
            return this.tag;
        }
        return '';
    }
    matchTag(comparator, exact = false) {
        // 无效的tag不进行匹配
        if (!this.isValid || !comparator.isValid) {
            return false;
        }
        // 正常情况下相同字符串构造的tag引用是相同的
        if (exact) {
            return this === comparator;
        }
        // 直接查找缓存
        if (this._childTag.has(comparator)) {
            return true;
        }
        // 缓存未命中，进行匹配
        if (this.tag.startsWith(comparator.tag)) {
            this._childTag.add(comparator);
            return true;
        }
        return false;
    }
    match(comparator, exact = false) {
        return this.matchTag(Tag.of(comparator), exact);
    }
    static hasTag(taggable, tag, exact = false) {
        const tagObj = Tag.of(tag);
        // 减少不必要的遍历
        return taggable.getTags()
            .some(t => Tag.of(t).matchTag(tagObj, exact));
    }
    static hasTagAll(taggable, tags, exact = false) {
        return tags.every(tag => Tag.hasTag(taggable, tag, exact));
    }
    static hasTagAny(taggable, tags, exact = false) {
        return tags.some(tag => Tag.hasTag(taggable, tag, exact));
    }
    static addTag(taggable, tag) {
        const tagObj = Tag.of(tag);
        if (tagObj.isValid) {
            taggable.addTag(tagObj.tag);
            taggable.OnTagChange.trigger(TagEventType.Add, tagObj);
        }
    }
    static addTags(taggable, tags) {
        tags.forEach(tag => Tag.addTag(taggable, tag));
    }
    static removeTag(taggable, tag) {
        const tagObj = Tag.of(tag);
        taggable.removeTag(tagObj.tag);
        tagObj._childTag.delete(tagObj);
        taggable.OnTagChange.trigger(TagEventType.Remove, tagObj);
    }
    static removeTags(taggable, tags) {
        tags.forEach(tag => Tag.removeTag(taggable, tag));
    }
    static discardTag(tag) {
        const tagObj = Tag.of(tag);
        Tag._tagMap.delete(tagObj.tag);
        // 清除缓存让gc回收
        tagObj._childTag.clear();
        tagObj._isValid = false;
        system.run(() => {
            for (const player of world.getAllPlayers()) {
                player.removeTag(tagObj.tag);
            }
        });
    }
    /**
     * @param object 参数会被修改并返回
     */
    static fromObject(object) {
        return Resources.with(this.constructable, () => {
            ObjectHelper.traverse(object, (obj, key, parent, path) => {
                const tag = this.from(path.join('.'));
                if (obj === null) {
                    if (!tag.isValid) {
                        return null;
                    }
                    parent[key] = tag;
                }
            });
            return Object.freeze(object);
        })[0];
    }
}
class TaggableObject {
    OnTagChange = new EventSignal();
    hasTag(tag, exact = false) {
        return Tag.hasTag(this, tag, exact);
    }
    hasTagAll(tags, exact = false) {
        return Tag.hasTagAll(this, tags, exact);
    }
    hasTagAny(tags, exact = false) {
        return Tag.hasTagAny(this, tags, exact);
    }
    addTags(...tags) {
        Tag.addTags(this, tags);
    }
    removeTags(...tags) {
        Tag.removeTags(this, tags);
    }
    discardTag(tag) {
        Tag.discardTag(tag);
    }
}

const isActor = Symbol('isActor');
class Actor extends TaggableObject {
    id;
    constructor(id) {
        super();
        this.id = id;
        ticking.addTickingObject(this);
    }
    [isActor] = true;
    static isActor(obj) {
        return obj && obj[isActor] === true;
    }
    components = new Map();
    beforeNextTickCbs = new Set();
    tickingGroup = 'actor';
    tags = new Set();
    allowTicking = true;
    getTags() {
        return Array.from(this.tags);
    }
    addTag(tag) {
        this.tags.add(tag);
    }
    removeTag(tag) {
        this.tags.delete(tag);
    }
    addComponent(arg1, component) {
        if (Array.isArray(arg1)) {
            for (const comp of arg1) {
                this.addComponent(comp);
            }
            return this;
        }
        const [key, comp] = typeof arg1 === 'string'
            ? [arg1, component]
            : [arg1.constructor.name, arg1];
        if (!comp) {
            throw new Error('Component must be provided when adding a component.');
        }
        this.components.set(key, comp);
        comp.attach?.();
        this._componentsReady.add(key);
        // component周期已到达started，不再需要执行tryStart
        // 此时可以直接执行start
        if (this._componentsStarted) {
            ReflectConfig.contextActor = this;
            comp.start?.();
        }
        return this;
    }
    removeComponent(arg) {
        const key = typeof arg === 'string' ? arg : arg.name;
        const component = this.components.get(key);
        if (component) {
            component.detach?.();
        }
        this.components.delete(key);
        return this;
    }
    getComponent(arg) {
        return this.components.get(typeof arg === 'string' ? arg : arg.name);
    }
    getComponents() {
        return Array.from(this.components.values());
    }
    clear() {
        for (const component of this.components.values()) {
            component.detach?.();
        }
        this.components.clear();
        this._componentsStarted = false;
        this._componentsReady.clear();
    }
    beforeNextUpdate(cb) {
        this.beforeNextTickCbs.add(cb);
    }
    tick = (dt, dms) => {
        // 如果组件未准备好，则不更新
        if (!this._componentsStarted) {
            return;
        }
        // 执行 beforeNextUpdate 回调
        this.beforeNextTickCbs.forEach(cb => cb(this));
        this.beforeNextTickCbs.clear();
        ReflectConfig.contextActor = this;
        for (const component of this.components.values()) {
            if (component.allowTicking) {
                component.update?.(dt, dms);
            }
        }
    };
    start() {
        if (this._componentsStarted) {
            return;
        }
        ReflectConfig.contextActor = this;
        for (const component of this.components.values()) {
            component.start?.();
        }
    }
    despawn() { }
    _componentsReady = new Set();
    _componentsStarted = false;
    tryStart() {
        // 如果组件已经开始，则不再尝试
        if (this._componentsStarted)
            return;
        // 所有组件都已准备好时，调用 start 方法
        if (this._componentsReady.size === this.components.size) {
            this.start();
            // 标记组件已开始
            this._componentsStarted = true;
        }
    }
}

const PROFIER_CONFIG = {
    SLOW: 6,
    FAST: 2.78,
    SLOW_COLOR: '§c',
    MEDIUM_COLOR: '§e',
    FAST_COLOR: '§a',
    NUM_FIXED: 2,
    TOKENS: {
        FN: '§6',
        GET: '§3',
        ID: '§b',
        CLASS: '§a',
        STR: '§v',
        BOOL: '§1',
        NUM: '§5',
        ENT: '§5',
        R: '§r'
    },
    ANIM: {
        TRACK_WIDTH: 20,
        TRACK_STYLE: '-',
        TRACK_COLOR: '§7',
        NOTIFY: {
            COLOR: '§6',
            POINT_STYLE: '◆',
        },
        STATE: {
            BAR_COLOR: '§3',
            BAR_STYLE: '-',
            BAR_STYLE_START: '+',
            BAR_STYLE_END: '+',
        },
        PROGRESS: '§g'
    },
    RECEV_CONF: {
        GAME_MODE: GameMode.Creative,
        TAGS: ['profiler']
    }
};

const { TOKENS: TOKENS$2, FAST, SLOW, FAST_COLOR, SLOW_COLOR, MEDIUM_COLOR, NUM_FIXED, RECEV_CONF } = PROFIER_CONFIG;
var profiler;
(function (profiler) {
    function _write(level, message) {
        function _writeToDebuggers(message) {
            world.getPlayers({
                gameMode: RECEV_CONF.GAME_MODE,
                tags: RECEV_CONF.TAGS,
            }).forEach(player => {
                player.sendMessage(message);
            });
        }
        switch (level) {
            case 'debug':
            case 'info':
                _writeToDebuggers(`§b[INFO]§r\n${message}`);
                break;
            case 'warn':
                _writeToDebuggers(`§e[WARN]§r\n${message}`);
                break;
            case 'error':
                _writeToDebuggers(`§c[ERR]§r\n${message}`);
                break;
        }
    }
    function out(level, message) {
        _write(level, message);
    }
    const rawTypes = ['string', 'number', 'boolean', 'bigint', 'undefined', 'symbol'];
    const objField = (type, k, v) => `  ${TOKENS$2.ID}${k}§r: ${type}${type === TOKENS$2.STR ? `'${v}'` : v}§r`;
    const fnField = (name, isGetter = false) => `  ${isGetter ? TOKENS$2.GET : TOKENS$2.FN}${isGetter ? 'get ' : ''}${name ?? '[anonymous]'}§r()`;
    const rawTypeMapping = {
        string: TOKENS$2.STR,
        number: TOKENS$2.NUM,
        boolean: TOKENS$2.BOOL,
        bigint: TOKENS$2.NUM,
        undefined: '§7',
        symbol: TOKENS$2.STR
    };
    const ignoredRawTypes = [
        Object.prototype,
        Array.prototype,
        Function.prototype,
        String.prototype,
        Number.prototype,
        Boolean.prototype,
        BigInt.prototype,
        Symbol.prototype,
        Error.prototype,
    ];
    const customPrinters = new Map();
    function registerCustomPrinter(matcher, printer) {
        customPrinters.set(matcher, printer);
    }
    profiler.registerCustomPrinter = registerCustomPrinter;
    function registerCustomTypePrinter(type, printer) {
        customPrinters.set(inst => inst instanceof type, printer);
    }
    profiler.registerCustomTypePrinter = registerCustomTypePrinter;
    function format(...message) {
        return message.map(m => {
            const typeOf = typeof m;
            if (rawTypes.includes(typeOf)) {
                return String(m);
            }
            if (typeOf === 'function') {
                return m.name || 'anonymous()';
            }
            if ('nameTag' in m) {
                return m.nameTag;
            }
            if ('typeId' in m) {
                return m.typeId;
            }
            if (customPrinters.size) {
                for (const [matcher, printer] of customPrinters) {
                    if (matcher(m)) {
                        return printer(m);
                    }
                }
            }
            let current = m;
            const objectInfo = [];
            do {
                Object.entries(Object.getOwnPropertyDescriptors(current)).map(([k, v_]) => {
                    if (k === 'constructor') {
                        return;
                    }
                    if (v_.get) {
                        return objectInfo.push(fnField(k, true));
                    }
                    const v = v_.value;
                    const rawType = typeof v;
                    if (rawTypes.includes(rawType)) {
                        return objectInfo.push(objField(rawTypeMapping[rawType], k, v));
                    }
                    if (rawType === 'function') {
                        return objectInfo.push(fnField(v.name));
                    }
                    if ('nameTag' in v) {
                        return objectInfo.push(objField(TOKENS$2.ENT, k, `${v.nameTag}<${v.typeId}>`));
                    }
                    if ('typeId' in v) {
                        return objectInfo.push(objField(TOKENS$2.ENT, k, v.typeId.replace('minecraft:', '')));
                    }
                    return objectInfo.push(objField(TOKENS$2.CLASS, k, v?.constructor?.name || '{}'));
                });
            } while (!ignoredRawTypes.includes(current = Reflect.getPrototypeOf(current)));
            objectInfo.unshift(`${m?.constructor?.name || ''} {}:`);
            objectInfo.push('');
            return objectInfo.join('\n');
        }).join(' ');
    }
    profiler.format = format;
    function print(level, ...message) {
        out(level, format(...message));
    }
    profiler.print = print;
    function debug(...message) {
        print('debug', ...message);
    }
    profiler.debug = debug;
    function info(...message) {
        print('info', ...message);
    }
    profiler.info = info;
    function warn(...message) {
        print('warn', ...message);
    }
    profiler.warn = warn;
    function error(...message) {
        print('error', ...message);
    }
    profiler.error = error;
    function prof(name, fn, ...args) {
        const start = Date.now();
        const result = fn(...args);
        const end = Date.now();
        const duration = end - start;
        info(`Task ${TOKENS$2.FN}${name}§r executed in ${duration < FAST ? FAST_COLOR
            : duration < SLOW ? MEDIUM_COLOR
                : SLOW_COLOR}${duration.toFixed(NUM_FIXED)}ms`);
        return result;
    }
    profiler.prof = prof;
})(profiler || (profiler = {}));

class Pawn extends Actor {
    entityRef;
    constructor(entityRef) {
        super(entityRef.id);
        this.entityRef = entityRef;
    }
    static isPawn(actor) {
        return actor instanceof Pawn;
    }
    controller = null;
    onPossess(controller) {
        this.controller = controller;
    }
    onUnPossess() {
        this.controller = null;
    }
    getController() {
        return this.controller;
    }
    get entity() {
        if (this.entityRef && this.entityRef.isValid) {
            return this.entityRef;
        }
        this.entityRef = null;
        return null;
    }
    getNativeComponent(componentId) {
        const comp = this.entity?.getComponent(componentId);
        if (!comp || !comp.isValid) {
            return;
        }
        return comp;
    }
    /**
     * 快捷方式，设置生物装备
     * @param slot
     * @returns
     */
    setEquipment(slot, equipment) {
        const equippable = this.getNativeComponent(EntityEquippableComponent.componentId);
        return Boolean(equippable?.setEquipment(slot, equipment));
    }
    /**
     * 快捷方式，获取生物装备
     * @param slot
     * @returns
     */
    getEquipment(slot) {
        const equippable = this.getNativeComponent(EntityEquippableComponent.componentId);
        if (!equippable?.isValid) {
            return;
        }
        return equippable.getEquipment(slot);
    }
    _inv;
    /**
     * 快捷方式，获取生物背包
     * @returns
     */
    get inventory() {
        if (this._inv?.isValid) {
            return this._inv;
        }
        return (this._inv = this.getNativeComponent(EntityInventoryComponent.componentId));
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Clamps the passed in number to the passed in min and max values.
 *
 * @public
 */
function clampNumber(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

class PlayerController extends Actor {
    pawn = null;
    possess(pawn) {
        if (this.pawn) {
            throw new Error('Controller already possess a pawn');
        }
        this.pawn = pawn;
        pawn.onPossess(this);
    }
    unPossess() {
        if (!this.pawn) {
            return;
        }
        this.pawn.onUnPossess();
        this.pawn = null;
    }
    getPawn() {
        return this.pawn;
    }
}

function inputState(defaultValue) {
    return {
        value: defaultValue,
        lastUpdate: system.currentTick,
    };
}
var ChargingState;
(function (ChargingState) {
    ChargingState[ChargingState["None"] = 0] = "None";
    ChargingState[ChargingState["Started"] = 1] = "Started";
    ChargingState[ChargingState["Triggered"] = 2] = "Triggered";
    ChargingState[ChargingState["Compeleted"] = 3] = "Compeleted";
})(ChargingState || (ChargingState = {}));
var ChargeEventState;
(function (ChargeEventState) {
    ChargeEventState[ChargeEventState["None"] = 0] = "None";
    ChargeEventState[ChargeEventState["Cancel"] = 1] = "Cancel";
    ChargeEventState[ChargeEventState["Finish"] = 2] = "Finish";
    ChargeEventState[ChargeEventState["Compelete"] = 3] = "Compelete";
})(ChargeEventState || (ChargeEventState = {}));
var PredefinedInput;
(function (PredefinedInput) {
    PredefinedInput[PredefinedInput["Jump"] = 0] = "Jump";
    PredefinedInput[PredefinedInput["Sneak"] = 1] = "Sneak";
    PredefinedInput[PredefinedInput["Sprint"] = 2] = "Sprint";
    PredefinedInput[PredefinedInput["Attack"] = 3] = "Attack";
    PredefinedInput[PredefinedInput["Interact"] = 4] = "Interact";
    PredefinedInput[PredefinedInput["Movement"] = 5] = "Movement";
})(PredefinedInput || (PredefinedInput = {}));
class InputComponent extends EventComponent {
    static canUsePlayerSwing = Boolean(world.afterEvents.playerSwingStart);
    static inputStacks = new Map();
    allowTicking = true;
    static {
        // 原生玩家按键输入 (跳跃/潜行)
        world.afterEvents.playerButtonInput.subscribe(ev => {
            if (ev.button === InputButton.Jump) {
                return InputComponent.inputStacks.get(ev.player.id)?.push({
                    button: 'Jump',
                    value: ev.newButtonState === ButtonState.Pressed,
                    ticks: system.currentTick,
                });
            }
            if (ev.button === InputButton.Sneak) {
                return InputComponent.inputStacks.get(ev.player.id)?.push({
                    button: 'Sneak',
                    value: ev.newButtonState === ButtonState.Pressed,
                    ticks: system.currentTick,
                });
            }
        });
        system.beforeEvents.startup.subscribe(ev => {
            ev.itemComponentRegistry.registerCustomComponent('ss:chargeable', {});
        });
        // 原生玩家右键按下输入
        world.afterEvents.itemUse.subscribe(ev => {
            // 只在使用可长按物品时触发
            if (ev.itemStack.hasComponent('ss:chargeable')) {
                InputComponent.inputStacks.get(ev.source.id)?.push({
                    button: 'Interact',
                    value: true,
                    ticks: system.currentTick,
                });
            }
        });
        function quickRestoreInteract(id) {
            InputComponent.inputStacks.get(id)?.push({
                button: 'Interact',
                value: true,
                ticks: system.currentTick,
            });
            system.runTimeout(() => {
                InputComponent.inputStacks.get(id)?.push({
                    button: 'Interact',
                    value: false,
                    ticks: system.currentTick,
                });
            }, 2);
        }
        function quickRestoreAttack(id) {
            InputComponent.inputStacks.get(id)?.push({
                button: 'Attack',
                value: true,
                ticks: system.currentTick,
            });
            system.runTimeout(() => {
                InputComponent.inputStacks.get(id)?.push({
                    button: 'Attack',
                    value: false,
                    ticks: system.currentTick,
                });
            }, 2);
        }
        world.afterEvents.playerPlaceBlock.subscribe(ev => quickRestoreInteract(ev.player.id));
        world.afterEvents.playerInteractWithBlock.subscribe(ev => quickRestoreInteract(ev.player.id));
        world.afterEvents.playerInteractWithEntity.subscribe(ev => quickRestoreInteract(ev.player.id));
        // 原生玩家右键松开输入 (需要chargable)
        world.afterEvents.itemReleaseUse.subscribe(ev => {
            return InputComponent.inputStacks.get(ev.source.id)?.push({
                button: 'Interact',
                value: false,
                ticks: system.currentTick,
            });
        });
        // 模拟玩家按键输入 (冲刺)
        system.afterEvents.scriptEventReceive.subscribe(({ sourceEntity, id }) => {
            if (!sourceEntity) {
                return;
            }
            switch (id) {
                case 'ss:sprintEnd':
                    return InputComponent.inputStacks.get(sourceEntity.id)?.push({
                        button: 'Sprint',
                        value: false,
                        ticks: system.currentTick,
                    });
                case 'ss:sprintStart':
                    return InputComponent.inputStacks.get(sourceEntity.id)?.push({
                        button: 'Sprint',
                        value: true,
                        ticks: system.currentTick,
                    });
            }
        });
        if (this.canUsePlayerSwing) {
            world.afterEvents.playerSwingStart.subscribe(ev => quickRestoreAttack(ev.player.id), { heldItemOption: HeldItemOption.AnyItem });
            world.afterEvents.playerSwingStart.subscribe(ev => quickRestoreAttack(ev.player.id), { heldItemOption: HeldItemOption.NoItem });
        }
        // 原生玩家攻击输入
        world.beforeEvents.playerBreakBlock.subscribe(ev => quickRestoreAttack(ev.player.id));
    }
    get bindActor() {
        return this.actor.getPawn();
    }
    start() {
        if (this.bindActor?.entity) {
            InputComponent.inputStacks.set(this.bindActor.entity.id, []);
        }
    }
    inputMapping = {
        Jump: inputState(false),
        Sneak: inputState(false),
        Sprint: inputState(false),
        Attack: inputState(false),
        Interact: inputState(false),
        Movement: inputState({ x: 0, y: 0 }),
    };
    getInput(key) {
        return this.inputMapping[key].value;
    }
    getChargeEventStateFromMainhand(dt) {
        const mainhand = this.bindActor?.getEquipment(EquipmentSlot.Mainhand);
        if (!mainhand) {
            return ChargeEventState.None;
        }
        const { triggerThreshold, holdThreshold } = mainhand.getComponent('ss:chargeable')?.customComponentParameters.params || {};
        return this.getChargeEventState(dt, triggerThreshold ?? 0, holdThreshold ?? Number.MAX_SAFE_INTEGER);
    }
    getChargingStateFromMainhand(dt) {
        const mainhand = this.bindActor?.getEquipment(EquipmentSlot.Mainhand);
        if (!mainhand) {
            return ChargingState.None;
        }
        const { triggerThreshold, holdThreshold } = mainhand.getComponent('ss:chargeable')?.customComponentParameters.params || {};
        return this.getChargingState(dt, triggerThreshold ?? 0, holdThreshold ?? Number.MAX_SAFE_INTEGER);
    }
    getChargingState(dt, triggerThreshold, holdThreshold) {
        const duration = triggerThreshold + holdThreshold;
        if (dt < 0) {
            return ChargingState.None;
        }
        if (dt < triggerThreshold) {
            return ChargingState.Started;
        }
        if (dt < duration) {
            return ChargingState.Triggered;
        }
        return ChargingState.Compeleted;
    }
    getChargeEventState(dt, triggerThreshold, holdThreshold) {
        const duration = triggerThreshold + holdThreshold;
        if (dt < 0) {
            return ChargeEventState.None;
        }
        if (dt < triggerThreshold) {
            return ChargeEventState.Cancel;
        }
        if (dt < duration) {
            return ChargeEventState.Finish;
        }
        return ChargeEventState.Compelete;
    }
    stop() {
        if (this.bindActor?.entity) {
            InputComponent.inputStacks.delete(this.bindActor.entity.id);
        }
    }
    destroy() {
        if (this.bindActor?.entity) {
            InputComponent.inputStacks.clear();
        }
    }
    update() {
        if (!this.bindActor?.entity) {
            return;
        }
        const actorId = this.bindActor.entity.id;
        const stack = InputComponent.inputStacks.get(actorId);
        if (!stack) {
            return;
        }
        for (const { button, value, ticks } of stack) {
            // 更新输入状态
            const localInput = this.inputMapping[button];
            if (localInput.value !== value) {
                const dt = ticks - localInput.lastUpdate;
                localInput.value = value;
                localInput.lastUpdate = ticks;
                this.trigger(button, value, dt);
            }
        }
        stack.length = 0;
    }
    getInputVector() {
        return this.useSimulatedVector
            ? this.inputMapping.Movement.value
            : this.bindActor?.entity?.inputInfo.getMovementVector();
    }
    useSimulatedVector = false;
    static performPressing(id, key, value) {
        InputComponent.inputStacks.get(id)?.push({
            button: key,
            value: value,
            ticks: system.currentTick,
        });
    }
    static performVector(id, x, y) {
        InputComponent.inputStacks.get(id)?.push({
            button: 'Movement',
            value: { x, y },
            ticks: system.currentTick,
        });
    }
    isMovingForward() {
        return this.getInputVector().y > 0.5;
    }
}

class BasePlayer extends Pawn {
    /**
     * ### 玩家血量
     */
    #health = 20;
    get health() {
        return this.#health;
    }
    set health(value) {
        const player = this.entity;
        if (player) {
            const health = player.getComponent(EntityHealthComponent.componentId);
            if (health.isValid) {
                const old = health.currentValue;
                if (old === value) {
                    return;
                }
                health.setCurrentValue(clampNumber(value, 0, 20));
            }
        }
    }
}
class BasePlayerController extends PlayerController {
    inputComponent = new InputComponent();
    setupInput() {
        this.addComponent(this.inputComponent);
    }
}

/**
 * 允许自动绑定 `Actor` 的生物类型
 */
const AutoSpawns = [
    'minecraft:player',
];
/**
 * 生物初始化时加载的组件
 * 若需要对特定生物进行自定义 {@link Actor} 绑定，请使用 {@link Application.spawnActor}
 */
const ActorComponents = [];
/**
 * 玩家初始化时加载的组件
 */
const PlayerComponents = [];
/**
 * 生物初始化时加载的 {@link Actor} 类
 */
const SpawnClasses = {
    'minecraft:player': BasePlayer,
};
/**
 * 玩家初始化时加载的 {@link Controller} 类
 */
const PlayerControllerClass = BasePlayerController;
/**
 * 生物初始化时加载的 {@link Controller} 类
 */
const AiControllerClasses = {};

function registerPlayerComponent(...ctor) {
    PlayerComponents.push(...ctor);
}
let overridePlayerControllerClass = null;
function registerPlayerController(ctor) {
    overridePlayerControllerClass = ctor;
}
function registerPlayerSpawnClass(ctor) {
    SpawnClasses['minecraft:player'] = ctor;
}
class SpawnConfig {
    static instance;
    static getInst() {
        if (!this.instance) {
            this.instance = new SpawnConfig();
        }
        return this.instance;
    }
    specifiedActorComponents = {};
    actorComponentsLoader = (entityType) => [
        ...ActorComponents.map(c => new c()),
        ...((entityType ? this.specifiedActorComponents[entityType] : []) ?? []).map(c => new c())
    ];
    playerComponentsLoader = () => {
        return [
            ...this.actorComponentsLoader('minecraft:player'),
            ...PlayerComponents.map(c => new c())
        ];
    };
    defaultSpawnClass = Actor;
    spawnClass = SpawnClasses;
    defaultPlayerControllerClass = BasePlayerController;
    aiClass = AiControllerClasses;
    registerPlayerComponent(ctor) {
        PlayerComponents.push(ctor);
    }
    registerSpecifiedActorComponent(entityType, ...ctors) {
        let ctorList = this.specifiedActorComponents[entityType] ?? [];
        this.specifiedActorComponents[entityType] = ctorList.concat(ctors);
    }
    registerActorComponent(ctor) {
        ActorComponents.push(ctor);
    }
    registerSpawnClass(entityType, ctor) {
        this.spawnClass[entityType] = ctor;
    }
    registerPlayerControllerClass(ctor) {
        this.defaultPlayerControllerClass = ctor;
    }
    registerAiControllerClass(entityType, ctor) {
        this.aiClass[entityType] = ctor;
    }
    findSpawnClass(entityType, strict = false) {
        if (!strict) {
            return this.spawnClass[entityType]
                ?? this.defaultSpawnClass
                ?? Actor;
        }
        return this.spawnClass[entityType];
    }
    findPlayerControllerClass() {
        return overridePlayerControllerClass ?? PlayerControllerClass ?? this.defaultPlayerControllerClass;
    }
    findAiControllerClass(entityType) {
        return this.aiClass[entityType];
    }
    canAutoSpawn(entityType) {
        return AutoSpawns.includes(entityType);
    }
    registerAutoSpawn(entityType) {
        AutoSpawns.push(entityType);
    }
}

const { TOKENS: TOKENS$1 } = PROFIER_CONFIG;
class Application extends EventInstigator {
    actors = new Map();
    spawnConfig = SpawnConfig.getInst();
    static getInst() {
        return Resources.getResouce(Application);
    }
    static modApp = null;
    initialized = false;
    spawnActor(id, spawnClass, ...components) {
        const actor = Reflect.construct(spawnClass, [id]);
        components.forEach(component => actor.addComponent(component));
        this.actors.set(id, actor);
        try {
            this.trigger('actorSpawned', actor, spawnClass, components);
        }
        catch (error) {
            profiler.error(error);
        }
        return actor;
    }
    despawnActor(id) {
        if (!this.initialized) {
            throw new Error('Application must be initialized before despawning actors.');
        }
        const actor = this.actors.get(id);
        try {
            this.trigger('actorDespawn', actor, id);
        }
        catch (error) {
            profiler.error(error);
        }
        if (actor) {
            actor.despawn();
        }
        this.actors.delete(id);
    }
    despawnEntityActor(entity) {
        if (!this.initialized) {
            throw new Error('Application must be initialized before despawning actors.');
        }
        const id = entity.id;
        const actor = this.actors.get(id);
        try {
            this.trigger('actorDespawn', actor, id);
        }
        catch (error) {
            profiler.error(error);
        }
        if (actor) {
            actor.despawn();
            if (actor.entity) {
                actor.entity.remove();
            }
        }
        this.actors.delete(id);
    }
    getActor(id) {
        return this.actors.get(id);
    }
    spawnEntityActor(entity, arg1, ...components) {
        if (typeof entity === 'string') {
            const type = entity;
            const loc = arg1;
            const actorClass = components.shift();
            const entity_ = world.getDimension(loc.dimension).spawnEntity(type, loc);
            return this.spawnEntityActor(entity_, actorClass, ...components);
        }
        if (Array.isArray(arg1)) {
            return this.spawnEntityActor(entity, this.spawnConfig
                .findSpawnClass(entity.typeId), ...arg1);
        }
        const actorClass = arg1;
        const existingActor = this.actors.get(entity.id);
        if (existingActor) {
            try {
                this.trigger('actorSpawned', existingActor, actorClass, components);
            }
            catch (error) {
                profiler.error(error);
            }
            return existingActor;
        }
        const actor = Reflect.construct(actorClass, [entity]);
        components.forEach(component => actor.addComponent(component));
        this.actors.set(entity.id, actor);
        try {
            this.trigger('actorSpawned', actor, actorClass, components);
        }
        catch (error) {
            profiler.error(error);
        }
        return actor;
    }
    isValidActor(actor) {
        return this.actors.has(actor.id);
    }
    serverStarted = Promise.withResolvers();
    playerControllers = [];
    getControllerByActorId(id) {
        const pawn = this.getActor(id);
        if (!pawn) {
            return;
        }
        return pawn.getController();
    }
    enter = () => {
        if (this.initialized)
            return;
        const spawnConfig = this.spawnConfig;
        this.setConfig('SpawnConfig', spawnConfig);
        system.beforeEvents.startup.subscribe(ev => {
            this.serverStarted.resolve(ev);
            this.initialized = true;
            Application.modApp?.start?.(this, ev);
            // 从装饰器中注册所有指令
            registerAllFromAnnotations(this);
            // start 进行指令注册
            CommandRegistry.registerAll(ev.customCommandRegistry);
            const tryCreatePawnForPlayer = (player) => {
                if (spawnConfig.canAutoSpawn('minecraft:player')) {
                    const id = `pc_${this.playerControllers.length}`;
                    const pc = this.spawnActor(id, spawnConfig.findPlayerControllerClass());
                    this.playerControllers.push(pc);
                    const playerPawn = this.spawnEntityActor(player, spawnConfig.findSpawnClass(player.typeId), ...spawnConfig.playerComponentsLoader());
                    pc.possess(playerPawn);
                    // PlayerController 特有的初始化
                    pc.setupInput();
                    pc.tryStart();
                    // 保证Actor Components 在 Controller Components 之后初始化
                    playerPawn.tryStart();
                }
            };
            world.afterEvents.playerSpawn.subscribe(ev => tryCreatePawnForPlayer(ev.player));
            const tryCreatePawnForEntity = (entity) => {
                const spawnClass = spawnConfig.findSpawnClass(entity.typeId, true);
                const enId = entity.id;
                if (enId !== 'minecraft:player' &&
                    spawnConfig.canAutoSpawn(enId) &&
                    spawnClass) {
                    const actor = this.spawnEntityActor(entity, spawnClass, ...spawnConfig.actorComponentsLoader(enId));
                    const aiControllerClass = spawnConfig.findAiControllerClass(enId);
                    if (aiControllerClass) {
                        const conKey = `ac_${aiControllerClass.name}_${enId}`;
                        const aiController = this.spawnActor(conKey, aiControllerClass);
                        aiController.possess(actor);
                        aiController.tryStart();
                    }
                    actor.tryStart();
                }
            };
            world.afterEvents.entitySpawn.subscribe(ev => tryCreatePawnForEntity(ev.entity));
            world.beforeEvents.entityRemove.subscribe(ev => this.despawnActor(ev.removedEntity.id));
            system.run(() => {
                for (const actor of this.actors.values()) {
                    actor.tryStart();
                }
                Application.modApp?.initialized?.(this);
            });
        });
        system.beforeEvents.shutdown.subscribe(() => {
            Application.modApp?.exit?.();
        });
        //start actor ticking
        ticking.repeat(() => ticking.tick('actor'));
    };
    exit() {
        ticking.clearAll();
    }
    getPlayerController(index = 0) {
        return this.playerControllers.at(index);
    }
    plugins = new Map();
    loadPlugin(...ctor) {
        ctor.forEach(ctor => {
            const plugin = Reflect.construct(ctor, []);
            plugin.startModule(this);
            this.plugins.set(plugin.name, plugin);
        });
        return this;
    }
    unloadPlugin(...name) {
        name.forEach(name => {
            const plugin = this.plugins.get(name);
            if (plugin) {
                plugin?.stopModule?.(this);
                this.plugins.delete(name);
            }
        });
        return this;
    }
    getPlugin(name) {
        return this.plugins.get(name);
    }
    _config = {};
    getConfig(name, defaultVal) {
        return this._config[name] ?? defaultVal;
    }
    setConfig(name, value) {
        this._config[name] = value;
    }
}
/**
 * 不要实例化这个类，这里 export 是为了防止 tree-shaking
 */
class ApplicationCommands {
    show_actor(entities, app) {
        entities.map(entity => {
            const actor = app.getActor(entity.id);
            profiler.info(actor);
        });
    }
    show_actors(app) {
        profiler.info([...app.actors.keys()]);
    }
    show_controller(entities, app) {
        entities.forEach(entity => {
            const actor = app.getActor(entity.id);
            if (!actor) {
                return profiler.error(`Actor ${entity.id} not found`);
            }
            profiler.info(actor.getController());
        });
    }
    show_components(entities, app) {
        entities.forEach(entity => {
            const actor = app.getActor(entity.id);
            if (!actor) {
                return profiler.error(`Actor ${entity.id} not found`);
            }
            profiler.info(actor.getComponents());
        });
    }
    show_controller_components(entities, app) {
        entities.forEach(entity => {
            const actor = app.getActor(entity.id);
            if (!actor) {
                return profiler.error(`Actor ${entity.id} not found`);
            }
            const controller = actor.getController();
            if (!Actor.isActor(controller)) {
                return profiler.error(`Actor ${entity.id} is not a pawn`);
            }
            profiler.info(controller.getComponents());
        });
    }
    show_plugins(app) {
        const messages = Array.from(app.plugins.values())
            .map(({ name, description }) => `\n${TOKENS$1.ID}${name}§r: ${TOKENS$1.STR}${description}`);
        profiler.info(`已加载${messages.length}个插件:`, ...messages);
    }
}
__decorate([
    CustomCommand('查看 Actor'),
    __param(0, Param.Required('entity', 'actors')),
    __param(1, Param.App),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], ApplicationCommands.prototype, "show_actor", null);
__decorate([
    CustomCommand('查看所有 Actors'),
    __param(0, Param.App),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Application]),
    __metadata("design:returntype", void 0)
], ApplicationCommands.prototype, "show_actors", null);
__decorate([
    CustomCommand('查看 Player Controller / AI Controller'),
    __param(0, Param.Required('entity', 'actors')),
    __param(1, Param.App),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Application]),
    __metadata("design:returntype", void 0)
], ApplicationCommands.prototype, "show_controller", null);
__decorate([
    CustomCommand('查看 Actor Components'),
    __param(0, Param.Required('entity', 'pawn')),
    __param(1, Param.App),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Application]),
    __metadata("design:returntype", void 0)
], ApplicationCommands.prototype, "show_components", null);
__decorate([
    CustomCommand('查看 Controller Components'),
    __param(0, Param.Required('entity', 'pawn')),
    __param(1, Param.App),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Application]),
    __metadata("design:returntype", void 0)
], ApplicationCommands.prototype, "show_controller_components", null);
__decorate([
    CustomCommand('查看 Application Plugins'),
    __param(0, Param.App),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Application]),
    __metadata("design:returntype", void 0)
], ApplicationCommands.prototype, "show_plugins", null);
function Entry(fn) {
    Resources.load(fn, Application);
}

class ModBase {
    constructor() {
        Application.modApp = this;
        ReflectConfig.mod = this;
    }
}

class ControlKitComponent extends Component {
    start() {
        const input = this.actor?.getController()?.getComponent(InputComponent);
        if (!input) {
            this.remove();
            return;
        }
        const actor = ReflectConfig.contextActorRef().deref();
        input.addListener('Interact', pressing => {
            if (!pressing) {
                return;
            }
            const item = actor.getEquipment(EquipmentSlot.Mainhand)?.typeId;
            if (item === 'ss:control.det_up') {
                return actor.determination += 1;
            }
            if (item === 'ss:control.det_down') {
                return actor.determination -= 1;
            }
            if (item === 'ss:control.detlvl_up') {
                return actor.determLevel += 1;
            }
            if (item === 'ss:control.detlvl_down') {
                return actor.determLevel -= 1;
            }
            if (item === 'ss:control.mental_up') {
                return actor.mental += 1;
            }
            if (item === 'ss:control.mental_down') {
                return actor.mental -= 1;
            }
        });
    }
}

var DeterminationState;
(function (DeterminationState) {
    DeterminationState[DeterminationState["Sane"] = 0] = "Sane";
    DeterminationState[DeterminationState["Neutral"] = 1] = "Neutral";
    DeterminationState[DeterminationState["Insane"] = 2] = "Insane";
})(DeterminationState || (DeterminationState = {}));
/**
 * ### 关于 `Sane` `Insane` `Neutral`:
 * - Sane: 决心 > 0，理智状态，可以正常使用所有战技（天，地，人，武器战技），10%伤害加成
 * - Neutral: 决心大于一定值，中立状态，可以正常使用所有战技，无伤害加成
 * - Insane: 决心小于一定值，无法使用部分战技（地，人），25%伤害加成，理智值开始恢复，受伤伤害提升10%
 *
 * ### 决心的获得:
 * - 每次使用战技，根据战技损失一定决心
 * - 格挡成功损失一定决心
 * - 被击中损失一定决心
 * - 完美格挡获得一定决心
 * - 进入疯狂状态后，决心开始逐渐恢复
 * - 某些战技有特殊的决心恢复效果
 * - 某些战技有特殊的决心损失效果
 * - 闪避不消耗也不会获得决心
 *
 * ### 关于决心的容量:
 * - 决心的容量取决于玩家的决心等级，当决心不够时使用战技有可能直接陷入疯狂状态
 * - 提升决心等级可以提升决心的容量
 *
 * ### 关于理智:
 * - 理智值影响玩家的决心状态，理智值越高，越不容易陷入疯狂状态（即使决心等级很低）
 * - 理智最高 10 级，每提升一级，玩家进入疯狂的概率减少10%
 * - 理智达到最高等级时，玩家将难以进入疯狂状态
 */
class RoninModPlayer extends Pawn {
    /**
     * ### 玩家血量
     */
    #health = 20;
    get health() {
        return this.#health;
    }
    set health(value) {
        const player = this.entity;
        if (player) {
            const health = player.getComponent(EntityHealthComponent.componentId);
            if (health.isValid) {
                const old = health.currentValue;
                if (old === value) {
                    return;
                }
                health.setCurrentValue(clampNumber(value, 0, 20));
            }
        }
    }
    /**
     * ### 玩家决心
     */
    #determination = 0;
    #determLevel = 2;
    get determLevel() {
        return this.#determLevel;
    }
    set determLevel(value) {
        this.#determLevel = clampNumber(value, 2, 20);
    }
    upgradeDetermination() {
        this.determLevel += 1;
    }
    downgradeDetermination() {
        this.determLevel -= 1;
    }
    get determination() {
        return this.#determination;
    }
    set determination(value) {
        this.#determination = clampNumber(value, -this.#determLevel, this.#determLevel);
    }
    resetDetermination() {
        this.#determination = 0;
    }
    #mental = 1;
    get mental() {
        return this.#mental;
    }
    set mental(value) {
        this.#mental = clampNumber(value, 1, 10);
    }
    upgradeMental() {
        this.mental += 1;
    }
    downgradeMental() {
        this.mental -= 1;
    }
    isSane() {
        return this.#determination > 0;
    }
    isNeutral() {
        return !this.isSane() && Math.abs(this.#determination) / this.#determLevel <= this.mental / 10;
    }
    isInsane() {
        return !this.isSane() && !this.isNeutral();
    }
    get determinationState() {
        if (this.isSane()) {
            return DeterminationState.Sane;
        }
        else if (this.isNeutral()) {
            return DeterminationState.Neutral;
        }
        else {
            return DeterminationState.Insane;
        }
    }
    get damageMultiplier() {
        return this.isSane() ? 1.1
            : this.isNeutral() ? 1
                : 1.25;
    }
    get hurtMultiplier() {
        return this.isInsane() ? 1.1 : 1;
    }
}

var Styles;
(function (Styles) {
    Styles["Black"] = "\u00A70";
    Styles["DarkBlue"] = "\u00A71";
    Styles["DarkGreen"] = "\u00A72";
    Styles["DarkAqua"] = "\u00A73";
    Styles["DarkRed"] = "\u00A74";
    Styles["DarkPurple"] = "\u00A75";
    Styles["Gold"] = "\u00A76";
    Styles["Gray"] = "\u00A77";
    Styles["DarkGray"] = "\u00A78";
    Styles["Blue"] = "\u00A79";
    Styles["Green"] = "\u00A7a";
    Styles["Aqua"] = "\u00A7b";
    Styles["Red"] = "\u00A7c";
    Styles["LightPurple"] = "\u00A7d";
    Styles["Yellow"] = "\u00A7e";
    Styles["White"] = "\u00A7f";
    Styles["MinecoinGold"] = "\u00A7g";
    Styles["Obfuscated"] = "\u00A7k";
    Styles["Bold"] = "\u00A7l";
    Styles["Italic"] = "\u00A7o";
    Styles["Reset"] = "\u00A7r";
})(Styles || (Styles = {}));

class MessageBlock {
    id;
    constructor(id, text = '', styles = []) {
        this.id = id;
        this.text = text;
        this.styles = styles;
    }
    #text = '';
    get text() {
        return this.#text;
    }
    set text(text) {
        this.#text = text;
        this.changed = true;
    }
    #styles = [];
    get styles() {
        return this.#styles;
    }
    set styles(styles) {
        this.#styles = styles;
        this.changed = true;
    }
    content = [];
    changed = true;
    cache = '';
    #selfMessageStr() {
        if (!this.changed) {
            return this.cache;
        }
        this.changed = false;
        this.cache = this.styles.join('') + this.text + Styles.Reset;
        return this.cache;
    }
    toString() {
        return this.#selfMessageStr() +
            this.content.map(content => content.toString()).join('');
    }
    addContent(content) {
        this.content.push(content);
        return this;
    }
    removeContent(arg) {
        if (typeof arg === 'number') {
            this.content.splice(arg, 1);
        }
        else if (typeof arg === 'string') {
            this.removeContentById(arg);
        }
        else {
            this.removeContentById(arg.id);
        }
    }
    removeContentById(id) {
        const index = this.content.findIndex(content => {
            if (typeof content === 'string') {
                return false;
            }
            else {
                return content.id === id;
            }
        });
        if (index !== -1) {
            this.removeContent(index);
        }
    }
    findById(id) {
        return this.content.find(content => {
            if (typeof content === 'string') {
                return false;
            }
            else {
                return content.id === id;
            }
        });
    }
    createInline(id, text, styles = []) {
        const existed = this.findById(id);
        if (existed) {
            return existed;
        }
        const msg = new MessageBlock(id, text.trim(), styles);
        this.addContent(msg);
        return msg;
    }
    createBlock(id, text, styles = []) {
        const existed = this.findById(id);
        if (existed) {
            return existed;
        }
        const msg = new MessageBlock(id, '\n' + text.trim(), styles);
        this.addContent(msg);
        return msg;
    }
}

class ActionBarComponent extends Component {
    message = new MessageBlock('ActionBar.Root');
    allowTicking = true;
    update() {
        const player = this.actor.entity;
        if (player && player.onScreenDisplay.isValid) {
            player.onScreenDisplay.setActionBar(this.message.toString());
        }
    }
}

class DeterminationHudComponent extends Component {
    allowTicking = true;
    static maxWidth = 40;
    static StyleRed = [Styles.Red];
    static StyleWhite = [Styles.White];
    static StyleSaneTrack = [Styles.DarkAqua];
    static StyleNetrualTrack = [Styles.Gold];
    static StyleInsaneTrack = [Styles.DarkRed];
    message = new MessageBlock('ActionBar.Det');
    value = this.message.createInline('ActionBar.Det.Value', '');
    bar = this.message.createInline('ActionBar.Det.Bar', '');
    text = this.message.createInline('ActionBar.Det.Text', '');
    insaneTrack = this.bar.createInline('ActionBar.Det.InsaneTrack', '', DeterminationHudComponent.StyleInsaneTrack);
    neutralTrack = this.bar.createInline('ActionBar.Det.NeutralTrack', '', DeterminationHudComponent.StyleNetrualTrack);
    saneTrack = this.bar.createInline('ActionBar.Det.SaneTrack', '', DeterminationHudComponent.StyleSaneTrack);
    fillText = '▎';
    emptyText = '▎';
    start() {
        const actionBar = this.getComponent(ActionBarComponent);
        if (actionBar && actionBar.message) {
            actionBar.message.addContent(this.message);
        }
        this.text.styles = [Styles.White];
        if (!(this.actor instanceof RoninModPlayer)) {
            this.removeComponent(this);
        }
    }
    update() {
        const player = this.actor;
        const progress = 0.5 + player.determination / (player.determLevel * 2);
        const blockSize = clampNumber(Math.round(progress * DeterminationHudComponent.maxWidth), 0, DeterminationHudComponent.maxWidth);
        const insaneProgress = 0.5 - player.mental / 20;
        const HalfWidth = DeterminationHudComponent.maxWidth / 2;
        this.value.text = this.fillText.repeat(blockSize);
        this.text.text = String(player.determination).padStart(4, ' ')
            + '/' + String(player.determLevel);
        this.value.styles = progress < insaneProgress
            ? DeterminationHudComponent.StyleRed
            : DeterminationHudComponent.StyleWhite;
        this.saneTrack.text = '';
        this.neutralTrack.text = '';
        let spaceLeft = DeterminationHudComponent.maxWidth - blockSize;
        const insanePadSize = Math.round(insaneProgress * DeterminationHudComponent.maxWidth);
        if (progress >= insaneProgress) {
            this.insaneTrack.text = '';
        }
        else {
            const fillSize = insanePadSize - blockSize;
            this.insaneTrack.text = this.emptyText.repeat(fillSize);
            spaceLeft -= fillSize;
        }
        if (progress >= 0.5) {
            this.neutralTrack.text = '';
        }
        else if (progress < insaneProgress) {
            const fillSize = HalfWidth - insanePadSize;
            this.neutralTrack.text = this.emptyText.repeat(fillSize);
            spaceLeft -= fillSize;
        }
        else {
            const fillSize = HalfWidth - blockSize;
            this.neutralTrack.text = this.emptyText.repeat(fillSize);
            spaceLeft -= fillSize;
        }
        this.saneTrack.text = this.emptyText.repeat(spaceLeft);
    }
}

/**
 * 若要拓展此类，请继承 RoninModPlayer
 * 并复写 setupInput() 方法，但一定要调用 super.setupInput()
 *
 * 如果只是需要监听输入事件，请直接获取 RoninPlayerController
 */
class RoninPlayerController extends PlayerController {
    inputComponent = new InputComponent();
    OnAttack = new EventSignal();
    OnInteract = new EventSignal();
    OnSneak = new EventSignal();
    OnSprint = new EventSignal();
    OnJump = new EventSignal();
    setupInput() {
        this.addComponent(this.inputComponent);
        this.getPawn()?.addComponent(new ControlKitComponent());
        this.inputComponent.addListener('Attack', this.OnAttack.trigger);
        this.inputComponent.addListener('Interact', this.OnInteract.trigger);
        this.inputComponent.addListener('Sprint', this.OnSprint.trigger);
        this.inputComponent.addListener('Sneak', this.OnSneak.trigger);
        this.inputComponent.addListener('Jump', this.OnJump.trigger);
    }
}

const { ANIM: { PROGRESS, TRACK_STYLE, TRACK_WIDTH, STATE, NOTIFY, TRACK_COLOR }, TOKENS } = PROFIER_CONFIG;
var AnimPlayingType;
(function (AnimPlayingType) {
    AnimPlayingType[AnimPlayingType["Once"] = 0] = "Once";
    AnimPlayingType[AnimPlayingType["Loop"] = 1] = "Loop";
    AnimPlayingType[AnimPlayingType["HoldOnLastFrame"] = 2] = "HoldOnLastFrame";
})(AnimPlayingType || (AnimPlayingType = {}));
class AnimSequence {
    layers;
    Onfinished = new EventSignal();
    _animOwner;
    constructor(layers) {
        this.layers = layers;
    }
    ticksPlayed = 0;
    isPlaying = false;
    finished = false;
    resetState() {
        this.ticksPlayed = 0;
        this.isPlaying = false;
    }
    restore() {
        this.resetState();
        this.finished = false;
    }
    restart(layers) {
        this.restore();
        this.start(layers);
    }
    start(layers) {
        if (this.isPlaying) {
            return;
        }
        this.ticksPlayed = 0;
        this.isPlaying = true;
        const pawn = this.layers.animComp.actor;
        this._animOwner = pawn;
        pawn.entity?.playAnimation(this.animation, this.options);
        this.onStart(layers);
    }
    stop() {
        this.resetState();
        this.onStopped(true);
        this.Onfinished.trigger(true);
    }
    update(layers) {
        if (!this.isPlaying) {
            return;
        }
        this.onUpdate(layers);
        const offsetTick = this.ticksPlayed++;
        this.callNotify(offsetTick);
        if (offsetTick == this.duration) {
            if (this.playingType === AnimPlayingType.Once) {
                this.finished = true;
                this.resetState();
                this.onEnd();
                this.onStopped(false);
                this.Onfinished.trigger(false);
                return;
            }
            if (this.playingType === AnimPlayingType.HoldOnLastFrame) {
                this.resetState();
                this.onEnd();
                return;
            }
            this.ticksPlayed = 0;
        }
    }
    findNotify(tick) {
        return this.animNotifEvents.find(e => e.tick === tick);
    }
    getNotifyStates(tick) {
        const result = [];
        const _t = tick * 0.05;
        for (const [name, [start, end]] of Object.entries(this.states)) {
            if (_t >= start && _t < end) {
                result.push(name);
            }
        }
        return result;
    }
    getNotifies(tick) {
        const result = [];
        const _t = tick * 0.05;
        for (const [name, t] of Object.entries(this.notifies)) {
            if (_t >= t && _t < t + 0.05) {
                result.push(name);
            }
        }
        return result;
    }
    callNotify(tick) {
        const methodName = this.findNotify(tick)?.name;
        if (methodName in this) {
            this[methodName]();
        }
    }
    getOwner() {
        return this._animOwner;
    }
    onUpdate(layers) { }
    onStart(layers) { }
    onEnd() { }
    onStopped(canceled) { }
    static formatAnimSeq(animSeq) {
        const ticks = animSeq.ticksPlayed;
        const { animation, duration, playingType, notifies, states } = animSeq;
        const scale = TRACK_WIDTH / duration;
        const progress = Math.round(ticks * scale);
        const currentNotifies = animSeq.getNotifies(ticks);
        const currentStates = animSeq.getNotifyStates(ticks);
        const text = `${TOKENS.STR}${animation} ${TOKENS.ID}${AnimPlayingType[playingType]} ${TOKENS.NUM}${duration}${TOKENS.R} Ticks\n` +
            `Playing: ${TOKENS.BOOL}${animSeq.isPlaying}${TOKENS.R} Finished: ${TOKENS.BOOL}${animSeq.finished}\n` +
            Object.entries(notifies).map(([name, t]) => {
                const tick = t * 20;
                const place = Math.floor(tick * scale);
                return `${TRACK_COLOR}${TRACK_STYLE.repeat(place)}${NOTIFY.COLOR}${NOTIFY.POINT_STYLE}${TRACK_COLOR}${TRACK_STYLE.repeat(Math.max(0, TRACK_WIDTH - place - 1))} ${TOKENS.R}${name}`;
            }).join('\n') + '\n' +
            Object.entries(states).map(([name, [start, end]]) => {
                const startTick = start * 20;
                const endTick = end * 20;
                const place = Math.floor(startTick * scale);
                const stateLength = Math.floor((endTick - startTick) * scale);
                return `${TRACK_COLOR}${TRACK_STYLE.repeat(place)}${STATE.BAR_COLOR}${STATE.BAR_STYLE_START}${STATE.BAR_STYLE.repeat(stateLength)}${STATE.BAR_STYLE_END}${TRACK_COLOR}${TRACK_STYLE.repeat(Math.max(0, TRACK_WIDTH - place - stateLength - 2))} ${TOKENS.R}${name}`;
            }).join('\n') + '\n' +
            `${PROGRESS}${TRACK_STYLE.repeat(progress)}${TRACK_COLOR}${TRACK_STYLE.repeat(Math.max(0, TRACK_WIDTH - progress))}` +
            `\nNotifies: ${currentNotifies.join(', ') || 'None'}\n  States: ${currentStates.join(', ') || 'None'}`;
        return text;
    }
    static {
        profiler.registerCustomTypePrinter(AnimSequence, animSeq => {
            const { animation, duration, playingType, notifies, states } = animSeq;
            const scale = TRACK_WIDTH / duration;
            const text = `${TOKENS.STR}${animation} ${TOKENS.ID}${AnimPlayingType[playingType]} ${TOKENS.NUM}${duration}${TOKENS.R} Ticks\n` +
                `Playing: ${TOKENS.BOOL}${animSeq.isPlaying}${TOKENS.R} Finished: ${TOKENS.BOOL}${animSeq.finished}\n` +
                Object.entries(notifies).map(([name, t]) => {
                    const tick = t * 20;
                    const place = Math.floor(tick * scale);
                    return `${TRACK_COLOR}${TRACK_STYLE.repeat(place)}${NOTIFY.COLOR}${NOTIFY.POINT_STYLE}${TRACK_COLOR}${TRACK_STYLE.repeat(Math.max(0, TRACK_WIDTH - place - 1))} ${TOKENS.R}${name}`;
                }).join('\n') + '\n' +
                Object.entries(states).map(([name, [start, end]]) => {
                    const startTick = start * 20;
                    const endTick = end * 20;
                    const place = Math.floor(startTick * scale);
                    const stateLength = Math.floor((endTick - startTick) * scale);
                    return `${TRACK_COLOR}${TRACK_STYLE.repeat(place)}${STATE.BAR_COLOR}${STATE.BAR_STYLE_START}${STATE.BAR_STYLE.repeat(stateLength)}${STATE.BAR_STYLE_END}${TRACK_COLOR}${TRACK_STYLE.repeat(Math.max(0, TRACK_WIDTH - place - stateLength - 2))} ${TOKENS.R}${name}`;
                }).join('\n');
            return text;
        });
    }
}

/**
 * 简化的动画层管理器
 * 优先级：overrideLayer > baseLayer
 */
class AnimLayers {
    animComp;
    layers = {
        override: new Set(),
        base: new Set()
    };
    constructor(animComp) {
        this.animComp = animComp;
    }
    /**
     * 播放动画序列
     */
    async playAnimation(animSeq, base = true) {
        const layer = base ? this.layers.base : this.layers.override;
        layer.add(animSeq);
        if (!base) {
            this.layers.base.forEach(seq => seq.stop());
        }
        const { promise, resolve } = Promise.withResolvers();
        const onFinish = (canceled) => {
            resolve(canceled);
            animSeq.Onfinished.off(onFinish);
        };
        animSeq.Onfinished.on(onFinish);
        return promise;
    }
    getLayer(base = true) {
        return base ? this.layers.base : this.layers.override;
    }
    /**
     * 播放多个动画序列
     */
    playAnimSeqList(base = true, ...animSeqList) {
        return Promise.all(animSeqList.map(seq => this.playAnimation(seq, base)));
    }
    /**
     * 停止指定动画序列
     */
    stopAnimSeq(animSeq) {
        animSeq.stop();
        this.layers.base.delete(animSeq);
        this.layers.override.delete(animSeq);
    }
    /**
     * 清空指定层
     */
    clearLayer(base = true) {
        const layer = base ? this.layers.base : this.layers.override;
        layer.forEach(seq => seq.stop());
        layer.clear();
    }
    /**
     * 清空所有层
     */
    clearAll() {
        this.clearLayer(true);
        this.clearLayer(false);
    }
    update() {
        // 按优先级处理图层
        // 当 override 存在时，base不处理
        if (this.processLayer(this.layers.override))
            return;
        this.processLayer(this.layers.base);
    }
    /**
     * 处理单个动画层
     */
    processLayer(layer) {
        if (layer.size === 0)
            return false;
        const toDelete = new Set();
        for (const animSeq of layer) {
            if (animSeq.finished) {
                toDelete.add(animSeq);
                animSeq.restore();
                continue;
            }
            if (!animSeq.isPlaying) {
                animSeq.start(this);
            }
            else {
                animSeq.update(this);
            }
        }
        for (const animSeq of toDelete) {
            layer.delete(animSeq);
        }
        return true;
    }
    /**
     * 获取当前播放的动画（最高优先级）
     */
    getPlayingAnimation() {
        return this.layers.override.values().next().value ||
            this.layers.base.values().next().value;
    }
}
class AnimationSequenceComponent extends Component {
    allowTicking = true;
    animLayers = new AnimLayers(this);
    animSeqs = new Map();
    static animSeqRegistry = new Map();
    static hasAnimation(animName) {
        return AnimationSequenceComponent.animSeqRegistry.has(animName);
    }
    update() {
        this.animLayers.update();
    }
    getOrCreateAnimSeq(cls) {
        const animSeq = this.animSeqs.get(cls);
        if (!animSeq) {
            const seq = Reflect.construct(cls, [this.animLayers]);
            this.animSeqs.set(cls, seq);
            return seq;
        }
        return animSeq;
    }
    async playAnimation(animName, base = true) {
        const animSeq = AnimationSequenceComponent.animSeqRegistry.get(animName);
        if (animSeq) {
            await this.animLayers.playAnimation(this.getOrCreateAnimSeq(animSeq), base);
        }
    }
    stopAnimation(animName) {
        const animSeq = AnimationSequenceComponent.animSeqRegistry.get(animName);
        if (animSeq) {
            this.animLayers.stopAnimSeq(this.getOrCreateAnimSeq(animSeq));
        }
    }
    getAnimation(animName) {
        const ctor = AnimationSequenceComponent.animSeqRegistry.get(animName);
        return ctor ? this.getOrCreateAnimSeq(ctor) : null;
    }
    getAnimationNames() {
        return Array.from(AnimationSequenceComponent.animSeqRegistry.keys());
    }
    clearAnimation() {
        this.animLayers.clearAll();
    }
    getPlayingAnimation() {
        return this.animLayers.getPlayingAnimation();
    }
}
function AnimationSequence(cls) {
    AnimationSequenceComponent.animSeqRegistry.set(cls.animation, cls);
}

var notifies$5 = {
	input_buffer: 0.4,
	damage: 0.3
};
var states$5 = {
	blocking: [
		0.1,
		0.2
	],
	combo: [
		0.35,
		0.45
	]
};
var events$5 = [
	{
		tick: 8,
		name: "notifyInput_buffer"
	},
	{
		tick: 6,
		name: "notifyDamage"
	},
	{
		tick: 2,
		name: "stateBlockingStart"
	},
	{
		tick: 4,
		name: "stateBlockingEnd"
	},
	{
		tick: 7,
		name: "stateComboStart"
	},
	{
		tick: 9,
		name: "stateComboEnd"
	}
];
var options$5 = {
};
var dataAsset$5 = {
	notifies: notifies$5,
	states: states$5,
	events: events$5,
	options: options$5};

const tags = Tag.fromObject({
    perm: {
        input: {
            attack: {
                normal: null,
                special: null,
            },
        },
    },
    skill: {
        slot: {
            attack: null,
            special: null,
            tian: null,
            di: null,
            ren: null,
            draw: null,
            sheathe: null,
            sneak: null,
            jump: null,
            passive0: null,
            passive1: null,
            passive2: null,
        }
    },
    damage: {
        determination: null,
        health: null,
    },
});

var TransitionTriggerType;
(function (TransitionTriggerType) {
    TransitionTriggerType[TransitionTriggerType["OnEndOfState"] = 0] = "OnEndOfState";
    TransitionTriggerType[TransitionTriggerType["OnEvent"] = 1] = "OnEvent";
    TransitionTriggerType[TransitionTriggerType["OnAttributeChange"] = 2] = "OnAttributeChange";
    TransitionTriggerType[TransitionTriggerType["OnTagAdd"] = 3] = "OnTagAdd";
    TransitionTriggerType[TransitionTriggerType["OnTagRemove"] = 4] = "OnTagRemove";
    TransitionTriggerType[TransitionTriggerType["Custom"] = 5] = "Custom";
})(TransitionTriggerType || (TransitionTriggerType = {}));

const stateMachineDefs = new Map();
const stateMachineMapping = new Map();
function getOrCreate(cls) {
    let def = stateMachineDefs.get(cls);
    if (def) {
        return def;
    }
    def = { states: {} };
    stateMachineDefs.set(cls, def);
    return def;
}
function getStateMachineDef(id) {
    return stateMachineMapping.get(id);
}
/**
 * 定义状态机模板
 * @param stateMachineId
 * @param rootState
 * @param inherits
 * @returns
 */
function StateMachineTemplate(stateMachineId, rootState, inherits = []) {
    return (target) => {
        const def = getOrCreate(target);
        def.id = stateMachineId;
        def.rootState = rootState;
        def.inherits = inherits;
        stateMachineMapping.set(stateMachineId, def);
    };
}
let contextStateMachineDef = null;
let contextStateName = null;
let _canCallHooks = false;
/**
 * 在 `StateMachineTemplate` 内定义状态
 * @param duration Ticks 游戏刻数
 * @returns
 */
function StateDef(duration = Infinity) {
    return (t, p) => {
        const stateMachine = getOrCreate(t.constructor);
        contextStateMachineDef = stateMachine;
        contextStateName = p;
        const stateDef = {
            name: p,
            duration,
        };
        contextStateMachineDef.states[p] = stateDef;
        const setupHandler = t[p];
        _canCallHooks = true;
        try {
            const transitions = setupHandler.call(undefined);
            stateDef.transitions = transitions;
        }
        finally {
            _canCallHooks = false;
        }
    };
}
function onEnter(fn) {
    if (!_canCallHooks) {
        throw new Error("onEnter can only be called inside StateDef");
    }
    if (!contextStateMachineDef || !contextStateName) {
        return;
    }
    contextStateMachineDef.states[contextStateName].enter = fn;
}

const defaultOnError = (error) => { profiler.error(error); };
class StateMachine {
    owner;
    onerror;
    // Use a hybrid registry so we can iterate active state machines while
    // allowing actors to be GC'd without leaking StateMachine instances.
    // - _idToSM: iterable map from id -> { sm, actorRef }
    // - _actorToId: weak map from actor -> id
    // - _finalizer: if available, cleanup id when actor is GC'd
    static _idToSM = new Map();
    static _actorToId = new WeakMap();
    static _finalizer = (typeof globalThis.FinalizationRegistry !== 'undefined')
        ? new globalThis.FinalizationRegistry((id) => {
            StateMachine._idToSM.delete(id);
        })
        : null;
    // fallback map 当环境不支持 WeakRef/FinalizationRegistry 时使用（强引用）
    static _fallbackMap = new Map();
    static forEach(fn) {
        for (const entry of StateMachine._idToSM.values()) {
            if (entry.sm)
                fn(entry.sm);
        }
    }
    static clearUnused(app) {
        for (const [id, entry] of StateMachine._idToSM.entries()) {
            const actor = entry.actorRef?.deref?.() ?? undefined;
            if (!actor) {
                StateMachine._idToSM.delete(id);
                continue;
            }
            if (!app.isValidActor(actor)) {
                StateMachine._idToSM.delete(id);
            }
        }
    }
    _curState = 'unknown';
    _stateMachineDef = null;
    // precomputed transitions buckets per state: stateName -> { trigger -> transitions[] }
    _stateBuckets = new Map();
    // 重入保护：当正在执行 state 切换时，后续的切换请求会被排入队列，避免递归调用 enter/exit
    _changing = false;
    _pendingStateQueue = [];
    // 使用 EventDelegate 实现的状态变化事件（只能绑定一个回调）
    // 触发签名：[oldState: string, newState: string]
    OnStateChanged = new EventDelegate();
    constructor(owner, onerror = defaultOnError) {
        this.owner = owner;
        this.onerror = onerror;
        // register in hybrid registry
        try {
            const id = Symbol();
            this._registerId = id;
            StateMachine._actorToId.set(owner, id);
            const actorRef = (typeof globalThis.WeakRef !== 'undefined') ? new globalThis.WeakRef(owner) : undefined;
            StateMachine._idToSM.set(id, { sm: this, actorRef });
            if (StateMachine._finalizer) {
                // 使用 id 作为 holdings（不使用 unregister token），FinalizationRegistry 回调会删除 id
                StateMachine._finalizer.register(owner, id);
            }
        }
        catch (e) {
            // fallback: if WeakRef/FinalizationRegistry not available, keep a strong Map using actor as key
            StateMachine._fallbackMap.set(owner, this);
        }
    }
    // 存储注册 id（若使用 hybrid registry）以便 dispose 时清理
    _registerId;
    setStateMachineDef(def) {
        // 合并继承定义并检测继承环（transactional）。合并顺序按照 inherits 列表的 DFS 顺序，
        // 若检测到循环则中止安装并通过 onerror 报告。
        const mergedStates = {};
        const visited = new Set();
        const inStack = new Set();
        const inheritOrder = [];
        // DFS 收集继承链，检测环
        const dfs = (id) => {
            if (inStack.has(id)) {
                // 发现循环
                this.onerror(new Error(`Inheritance cycle detected for state machine '${id}'`));
                return false;
            }
            if (visited.has(id))
                return true;
            visited.add(id);
            inStack.add(id);
            const defn = getStateMachineDef(id);
            if (!defn) {
                // 如果找不到定义，记录并继续（不认为这是环）
                inStack.delete(id);
                return true;
            }
            // 递归处理父继承
            for (const pid of defn.inherits ?? []) {
                if (!dfs(pid))
                    return false;
            }
            inheritOrder.push(defn);
            inStack.delete(id);
            return true;
        };
        // 启动 DFS：对当前 def.inherits 中的每个 id 执行
        if (def.inherits) {
            for (const id of def.inherits) {
                if (!dfs(id)) {
                    // 若检测到循环或 dfs 报错，abort
                    return;
                }
            }
        }
        // 按收集到的 inheritOrder 顺序合并 state（父在前）
        for (const inheritDef of inheritOrder) {
            for (const [name, istate] of Object.entries(inheritDef.states ?? {})) {
                const existing = mergedStates[name];
                if (!existing) {
                    mergedStates[name] = {
                        ...istate,
                        transitions: (istate.transitions ?? []).slice(),
                    };
                }
                else {
                    mergedStates[name] = {
                        ...existing,
                        ...istate,
                        transitions: [
                            ...(existing.transitions ?? []),
                            ...(istate.transitions ?? []),
                        ],
                    };
                }
            }
        }
        // 最后 overlay 当前 def 的 states（子覆盖父，transitions 追加到父之后）
        for (const [name, tstate] of Object.entries(def.states ?? {})) {
            const inherited = mergedStates[name];
            if (inherited) {
                mergedStates[name] = {
                    ...inherited,
                    ...tstate,
                    transitions: [
                        ...(inherited.transitions ?? []),
                        ...(tstate.transitions ?? []),
                    ],
                };
            }
            else {
                mergedStates[name] = {
                    ...tstate,
                    transitions: (tstate.transitions ?? []).slice(),
                };
            }
        }
        const newDef = {
            ...def,
            states: mergedStates,
        };
        if (!newDef.rootState || !newDef.states[newDef.rootState]) {
            // invalid definition; report and abort
            this.onerror(new Error(`Invalid state machine def: rootState '${newDef.rootState}' not found`));
            return;
        }
        // Exit current state, 然后安装新的定义并进入 root state
        this.callExit();
        this._stateMachineDef = newDef;
        // 构建并排序 buckets（通过方法实现，便于后续重建）
        this.rebuildBuckets();
        this._curState = newDef.rootState ?? 'unknown';
        this.currentStateTicks = 0;
        this.callEnter();
    }
    getStateNames() {
        return Object.keys(this._stateMachineDef?.states ?? {});
    }
    currentStateTicks = 0;
    get stateTicks() {
        return this.currentStateTicks;
    }
    /**
     * 重建所有 state 的 transition buckets（按 trigger 分桶并按 priority 排序）
     */
    rebuildBuckets() {
        this._stateBuckets.clear();
        const def = this._stateMachineDef;
        if (!def)
            return;
        for (const [name, s] of Object.entries(def.states)) {
            const buckets = {};
            for (const tr of s.transitions ?? []) {
                const key = tr.trigger;
                let arr = buckets[key];
                if (!arr) {
                    arr = [];
                    buckets[key] = arr;
                }
                arr.push(tr);
            }
            // 不对 bucket 做优先级排序（优先级特性未启用）
            this._stateBuckets.set(name, buckets);
        }
    }
    /**
     * 重建单个 state 的 buckets（如果需要在运行时局部刷新）
     */
    rebuildBucketsFor(stateName) {
        const def = this._stateMachineDef;
        if (!def)
            return;
        const s = def.states[stateName];
        if (!s)
            return;
        const buckets = {};
        for (const tr of s.transitions ?? []) {
            const key = tr.trigger;
            let arr = buckets[key];
            if (!arr) {
                arr = [];
                buckets[key] = arr;
            }
            arr.push(tr);
        }
        // 不对 bucket 做优先级排序（优先级特性未启用）
        this._stateBuckets.set(stateName, buckets);
    }
    resetStateMachine() {
        // 注意：reset 不再调用 callExit()，以避免在 exit 抛错时出现递归调用
        this._curState = 'unknown';
        this._stateMachineDef = null;
        this.currentStateTicks = 0;
        this._stateBuckets.clear();
        this._pendingStateQueue.length = 0;
        this._changing = false;
    }
    getState(state) {
        return this._stateMachineDef?.states[state];
    }
    currentState() {
        return this._stateMachineDef?.states[this._curState];
    }
    callExit() {
        this.currentStateTicks = 0;
        try {
            this.currentState()?.exit?.(this.owner);
        }
        catch (error) {
            try {
                // 在错误中包含当前 state 名称以便定位
                this.onerror({ error, state: this._curState, phase: 'exit' });
            }
            catch (error) {
                defaultOnError(error);
            }
            // 不在此处 resetStateMachine，以避免 exit 抛错导致递归调用
        }
    }
    callEnter() {
        try {
            this.currentState()?.enter?.(this.owner);
        }
        catch (error) {
            try {
                // 在错误中包含当前 state 名称以便定位
                this.onerror({ error, state: this._curState, phase: 'enter' });
            }
            catch (error) {
                defaultOnError(error);
            }
            // 同上，不在此处 resetStateMachine
        }
    }
    update() {
        this.currentStateTicks++;
        try {
            const curState = this.currentState();
            if (!curState) {
                return;
            }
            curState?.update?.(this.owner);
            if (this.currentStateTicks >= (curState.duration ?? Infinity)) {
                this.triggerCustom(true);
            }
        }
        catch (error) {
            try {
                this.onerror(error);
            }
            catch (error) {
                defaultOnError(error);
            }
            finally {
                this.resetStateMachine();
            }
        }
    }
    /**
     * 未经检查的状态切换
     * @param state
     */
    changeState(state) {
        // 保护：确保目标 state 存在，避免切换到不存在的状态
        if (!this.getState(state)) {
            profiler.info(`Attempt to change to unknown state '${state}'`);
            return;
        }
        // 如果已经在切换中，则把请求加入队列，等待当前切换完成后再处理
        if (this._changing) {
            this._pendingStateQueue.push(state);
            return;
        }
        // 开始切换流程，使用队列序列化所有切换请求，防止 reentrant
        this._changing = true;
        let oldState = this._curState;
        try {
            this.callExit();
            this._curState = state;
            this.currentStateTicks = 0;
            this.callEnter();
            // 成功切换后触发 EventDelegate（如果已绑定）
            try {
                this.OnStateChanged.call(oldState, this._curState);
            }
            catch (cbErr) {
                // 回调错误不应中断 FSM
                profiler.info(cbErr);
            }
        }
        finally {
            // 结束本次切换并处理队列中的下一个请求（如果有）
            this._changing = false;
            if (this._pendingStateQueue.length > 0) {
                const next = this._pendingStateQueue.shift();
                // 通过递归调用 changeState 触发下一个（但此时 _changing 为 false）
                this.changeState(next);
            }
        }
    }
    /**
     * 销毁/注销当前 StateMachine 的注册，避免内存泄漏。
     * 仅负责清理注册与内部状态，不会触发 state 回调。
     */
    dispose() {
        try {
            if (this._registerId) {
                StateMachine._idToSM.delete(this._registerId);
                StateMachine._actorToId.delete(this.owner);
                this._registerId = undefined;
            }
        }
        catch (e) {
            // ignore
        }
        // fallback map 清理
        StateMachine._fallbackMap.delete(this.owner);
        // 清理内部状态
        this._stateMachineDef = null;
        this._curState = 'unknown';
        this.currentStateTicks = 0;
        this._stateBuckets.clear();
        this._pendingStateQueue.length = 0;
        this._changing = false;
    }
    /**
     * 会同时检查 canTransition 和 canEnter
     * @param cond
     * @returns
     */
    canTransition(cond) {
        try {
            if (cond.canTransition && !cond.canTransition(this.owner)) {
                return false;
            }
        }
        catch (err) {
            try {
                this.onerror({ error: err, cond, phase: 'canTransition' });
            }
            catch (e) {
                defaultOnError(e);
            }
            return false;
        }
        const state = this.getState(cond.nextState);
        if (!state) {
            return false;
        }
        try {
            if (state.canEnter && !state.canEnter(this.owner)) {
                return false;
            }
        }
        catch (err) {
            try {
                this.onerror({ error: err, state: cond.nextState, phase: 'canEnter' });
            }
            catch (e) {
                defaultOnError(e);
            }
            return false;
        }
        return true;
    }
    /**
     * `Custom` 和 `OnEnd` 的触发函数
     *
     * 区别在于，Custom 是由外部主动触发的，而 OnEnd 是在当前状态结束时自动触发
     * @returns
     */
    triggerCustom(onEnd = false) {
        const cur = this.currentState();
        if (!cur) {
            return;
        }
        const trigger = onEnd ? TransitionTriggerType.OnEndOfState : TransitionTriggerType.Custom;
        const buckets = this._stateBuckets.get(cur.name) ?? {};
        const customConds = buckets[trigger] ?? [];
        for (const customCond of customConds) {
            if (customCond && this.canTransition(customCond)) {
                return this.changeState(customCond.nextState);
            }
        }
    }
    /**
     * `OnEvent` 的触发函数, 和 `Custom` 的区别是可以传递一个自定义事件对象
     * @param type
     * @param event
     * @returns
     */
    triggerEvent(type, event) {
        const cur = this.currentState();
        if (!cur) {
            return;
        }
        const buckets = this._stateBuckets.get(cur.name) ?? {};
        const eventConds = (buckets[TransitionTriggerType.OnEvent] ?? []);
        for (const eventCond of eventConds) {
            const { event: _ev, nextState, filter } = eventCond;
            if (_ev === type && (!filter || !event || filter(this.owner, event)) && this.canTransition(eventCond)) {
                return this.changeState(nextState);
            }
        }
    }
    /**
     * 为属性变化特化的触发函数
     * @param attribute
     * @param value
     * @param old
     * @returns
     */
    triggerAttrChange(attribute, value, old) {
        const cur = this.currentState();
        if (!cur) {
            return;
        }
        const buckets = this._stateBuckets.get(cur.name) ?? {};
        const attrConds = (buckets[TransitionTriggerType.OnAttributeChange] ?? []);
        for (const attrCond of attrConds) {
            const { nextState, attribute: _attr, value: _valueMatcher } = attrCond;
            if (attribute !== _attr) {
                continue;
            }
            if (typeof _valueMatcher === 'function') {
                // 类型断言，因为当 T 是函数类型时，ValueMatcher<T> 可能是 T 本身，也可能是匹配函数
                // 我们假设如果是函数，则它符合 (value: T, old: T) => boolean 签名
                const matcherFn = _valueMatcher;
                if (matcherFn(value, old)) {
                    return this.changeState(nextState);
                }
            }
            else if (value === _valueMatcher) {
                return this.changeState(nextState);
            }
        }
    }
    triggerTagAdd(tag, exact = false) {
        const cur = this.currentState();
        if (!cur) {
            return;
        }
        const buckets = this._stateBuckets.get(cur.name) ?? {};
        const tagConds = (buckets[TransitionTriggerType.OnTagAdd] ?? []);
        for (const tagCond of tagConds) {
            if (tagCond && tagCond.tag.matchTag(tag, exact) && this.canTransition(tagCond)) {
                return this.changeState(tagCond.nextState);
            }
        }
    }
    triggerTagRemove(tag, exact = false) {
        const cur = this.currentState();
        if (!cur) {
            return;
        }
        const buckets = this._stateBuckets.get(cur.name) ?? {};
        const tagConds = (buckets[TransitionTriggerType.OnTagRemove] ?? []);
        for (const tagCond of tagConds) {
            if (tagCond && tagCond.tag.matchTag(tag, exact) && this.canTransition(tagCond)) {
                return this.changeState(tagCond.nextState);
            }
        }
    }
}

class Attribute {
    defaultValue;
    _value;
    _oldValue;
    constructor(defaultValue) {
        this.defaultValue = defaultValue;
        this._value = defaultValue;
        this._oldValue = defaultValue;
    }
    OnChange = new EventDelegate();
    OnCalculated = new EventDelegate();
    get oldValue() {
        return this._oldValue;
    }
    get value() {
        return this._value;
    }
    set value(newValue) {
        if (newValue !== this._value) {
            this.OnChange.call(this._value, this._oldValue);
            this._oldValue = this._value;
            this._value = newValue;
            if (this.modifier) {
                const newVal = this.modifier(this._value, this._oldValue);
                if (newVal !== this._value) {
                    this._value = newVal;
                    this.OnCalculated.call(this._value, this._oldValue);
                }
            }
        }
    }
    modifier;
    Modifiers = {
        Add(constVal) {
            return (value, oldValue) => value + constVal;
        },
        Multiply(constVal) {
            return (value, oldValue) => value * constVal;
        },
        Replace(constVal) {
            return (value, oldValue) => constVal;
        },
        Subtract(constVal) {
            return (value, oldValue) => value - constVal;
        },
        Divide(constVal) {
            return (value, oldValue) => value / constVal;
        },
        Mod(constVal) {
            return (value, oldValue) => value % constVal;
        },
        Clamp(min, max) {
            return (value, oldValue) => Math.min(Math.max(value, min), max);
        },
    };
}
class AttributesComponent extends EventComponent {
    init;
    attributes = new Map();
    constructor(init = {}) {
        super();
        this.init = init;
        for (const [key, value] of Object.entries(init)) {
            const attr = new Attribute(value);
            this.attributes.set(key, attr);
            attr.OnChange.bind((v, old) => this.trigger('onChange', key, v, old));
            attr.OnCalculated.bind((v, old) => this.trigger('onCalculated', key, v, old));
        }
    }
    get(key) {
        return this.attributes.get(key)?.value;
    }
    set(key, value) {
        const attr = this.attributes.get(key);
        if (attr) {
            attr.value = value;
        }
    }
}

const { TOKENS: T } = PROFIER_CONFIG;
const entityStateMachineMap = new Map();
class FinateStateMachineComponent extends Component {
    stateMachine = null;
    allowTicking = true;
    start() {
        const stateMachine = new StateMachine(this.actor);
        this.stateMachine = stateMachine;
        const owner = this.actor;
        this.bindFSMDef(stateMachine);
        owner.OnTagChange.addListener((type, tag) => {
            if (type === TagEventType.Add) {
                stateMachine.triggerTagAdd(tag);
            }
            else {
                stateMachine.triggerTagRemove(tag);
            }
        });
        const attributesComp = owner.getComponent(AttributesComponent);
        if (attributesComp) {
            attributesComp.addListener('onCalculated', (name, v, old) => stateMachine.triggerAttrChange(name, v, old));
        }
    }
    /**
     * 从配置中获取状态机定义并绑定，不适用于玩家
     *
     * @param stateMachine
     * @returns
     */
    bindFSMDef(stateMachine) {
        const owner = this.actor;
        if (Pawn.isPawn(owner)) {
            const stateMachineId = entityStateMachineMap.get(owner.entity?.typeId);
            if (!stateMachineId) {
                return;
            }
            const fsmDef = getStateMachineDef(stateMachineId);
            if (fsmDef) {
                stateMachine.setStateMachineDef(fsmDef);
            }
        }
    }
    update() {
        this.stateMachine?.update();
    }
    stop() {
        // 组件停止时确保注销状态机，避免在不支持 FinalizationRegistry 的环境中泄漏
        this.stateMachine?.dispose();
        this.stateMachine = null;
    }
}
const TriggerNamesMapping = [
    'OnEndOfState',
    'OnEvent',
    'OnAttributeChange',
    'OnTagAdd',
    'OnTagRemove',
    'Custom',
];
function getStateTransStr(fsm, name) {
    const curState = fsm.getState(name);
    if (!curState) {
        return `  None`;
    }
    return curState.transitions.map(trans => {
        const triggerStr = TriggerNamesMapping[trans.trigger];
        return `  ${triggerStr} -> ${trans.nextState}`;
    }).join('\n');
}
class FinateStateMachineDisplayComponent extends Component {
    actionBar;
    fsm;
    fsmMessage;
    allowTicking = true;
    constructor(actionBar, fsm) {
        super();
        this.actionBar = actionBar;
        this.fsm = fsm;
    }
    start() {
        this.fsmMessage = this.actionBar.message.createBlock('ActionBar.FSM', '');
    }
    update() {
        if (!this.fsmMessage) {
            return;
        }
        const curState = this.fsm?.currentState();
        if (curState) {
            this.fsmMessage.text = `\nState: ${curState.name}  ${T.NUM}${this.fsm?.stateTicks}${T.R} / ${T.ID}${String(curState.duration ?? Infinity)}${T.R}`;
        }
        else {
            this.fsmMessage.text = '\nState: None';
        }
    }
    detach() {
        if (this.fsmMessage) {
            this.actionBar?.message.removeContent(this.fsmMessage);
        }
    }
}
class FinateStateMachinePlugin {
    name = 'fsm';
    description = '有限状态机插件';
    startModule(app) {
        registerPlayerComponent(FinateStateMachineComponent);
        this.registerFSMTypePrinter();
    }
    registerFSMTypePrinter() {
        profiler.registerCustomTypePrinter(FinateStateMachineComponent, inst => {
            const fsm = inst.stateMachine;
            if (!fsm) {
                return `FSM<None>`;
            }
            const header = `FSM<${T.CLASS}${fsm.constructor.name}${T.R}>`;
            const stateNames = `  States: ${fsm.getStateNames().join(', ') || 'Empty'}\n`;
            const curState = fsm.currentState();
            if (!curState) {
                return [
                    header,
                    stateNames,
                    `  Current State: ${T.CLASS}None`
                ].join('\n');
            }
            const curStateClass = `  Current State: ${T.CLASS}${curState.constructor.name}${T.R}`;
            const curStateDesc = `  Name: ${T.STR}${curState.name}${T.R}  Duration: ${T.NUM}${(curState.duration ?? Infinity).toFixed(2)}${T.R}`;
            return [
                header,
                stateNames,
                curStateClass,
                curStateDesc,
            ].join('\n');
        });
    }
    show_fsm(actors) {
        for (const actor of actors) {
            const fsmComp = actor.getComponent(FinateStateMachineComponent);
            if (fsmComp) {
                profiler.info(fsmComp);
            }
        }
    }
    show_fsm_transitions(actors, stateName) {
        for (const actor of actors) {
            const fsmComp = actor.getComponent(FinateStateMachineComponent);
            if (!fsmComp || !fsmComp.stateMachine) {
                continue;
            }
            profiler.info(`State ${stateName} transitions: \n${getStateTransStr(fsmComp.stateMachine, stateName)}`);
        }
    }
    hud_fsm(actors, enabled, origin, app) {
        const actor = actors[0];
        const instigator = app.getActor(origin.sourceEntity?.id);
        if (!instigator) {
            return profiler.error(`操作者没有绑定 Pawn`);
        }
        if (!enabled) {
            instigator.removeComponent(FinateStateMachineDisplayComponent);
        }
        const fsmComp = actor.getComponent(FinateStateMachineComponent);
        const hud = instigator.getComponent(ActionBarComponent);
        if (!fsmComp || !fsmComp.stateMachine || !hud) {
            return profiler.error(`Actor 缺少 FinateStateMachineComponent 或 ActionBarComponent 组件`);
        }
        instigator.addComponent(new FinateStateMachineDisplayComponent(hud, fsmComp.stateMachine));
    }
    fsm_apply(actors, id) {
        for (const actor of actors) {
            const fsmComp = actor.getComponent(FinateStateMachineComponent);
            if (!fsmComp) {
                return profiler.error(`Actor 缺少 FinateStateMachineComponent 组件`);
            }
            const fsmDef = getStateMachineDef(id);
            if (!fsmDef) {
                return profiler.error(`没有找到 ID 为 ${id} 的状态机预设`);
            }
            fsmComp.stateMachine?.setStateMachineDef(fsmDef);
            profiler.info(`已将状态机预设 ${id} 应用到目标`);
        }
    }
}
__decorate([
    CustomCommand('查看 Actor 状态机'),
    __param(0, Param.Required('actor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], FinateStateMachinePlugin.prototype, "show_fsm", null);
__decorate([
    CustomCommand('查看当前状态过渡'),
    __param(0, Param.Required('actor')),
    __param(1, Param.Required('string')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", void 0)
], FinateStateMachinePlugin.prototype, "show_fsm_transitions", null);
__decorate([
    CustomCommand('将第一个目标的状态机信息在 Actionbar 上显示/隐藏'),
    __param(0, Param.Required('actor')),
    __param(1, Param.Required('bool')),
    __param(2, Param.Origin),
    __param(3, Param.App),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Boolean, Object, Application]),
    __metadata("design:returntype", void 0)
], FinateStateMachinePlugin.prototype, "hud_fsm", null);
__decorate([
    CustomCommand('通过 ID 将状态机预设应用到目标'),
    __param(0, Param.Required('actor')),
    __param(1, Param.Required('string')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", void 0)
], FinateStateMachinePlugin.prototype, "fsm_apply", null);

class MyController extends RoninPlayerController {
    setupInput() {
        super.setupInput();
        const player = this.getPawn();
        const stateMachineComp = player.getComponent(FinateStateMachineComponent);
        // 初始允许玩家进行攻击输入
        Tag.addTag(player, tags.perm.input.attack.normal);
        Tag.addTag(player, tags.perm.input.attack.special);
        // 用来判断玩家是否可以进行攻击输入
        // 这里并没有使用 normal / special, 是因为 Tag 的模糊匹配可以匹配父级标签
        const attackPermTag = Tag.of('perm.input.attack');
        this.OnAttack.on(async (press) => {
            if (!press) {
                return;
            }
            // 玩家被允许进行普通攻击输入时，添加普通攻击标签
            if (Tag.hasTag(player, attackPermTag) && stateMachineComp?.stateMachine) {
                Tag.addTag(player, tags.skill.slot.attack);
            }
        });
        this.OnInteract.on(async (press) => {
            if (!press) {
                return;
            }
            // 玩家被允许进行特殊攻击输入时，添加特殊攻击标签
            if (Tag.hasTag(player, attackPermTag) && stateMachineComp?.stateMachine) {
                Tag.addTag(player, tags.skill.slot.special);
            }
        });
    }
}
class BattleAttributes extends AttributesComponent {
    constructor() {
        super({
            blocking: false,
        });
    }
}

let MarieKSequence = class MarieKSequence extends AnimSequence {
    static animation = 'animation.ss.marie.k';
    animation = 'animation.ss.marie.k';
    duration = 15;
    playingType = AnimPlayingType.Once;
    override = true;
    animNotifEvents = dataAsset$5.events;
    notifies = dataAsset$5.notifies;
    states = dataAsset$5.states;
    options = dataAsset$5.options;
    notifyDamage() {
    }
    stateBlockingStart() {
        const attrs = this.getOwner()?.getComponent(BattleAttributes);
        if (attrs) {
            attrs.set('blocking', true);
        }
    }
    stateBlockingEnd() {
        const attrs = this.getOwner()?.getComponent(BattleAttributes);
        if (attrs) {
            attrs.set('blocking', false);
        }
    }
    stateComboStart() {
        Tag.addTag(this.getOwner(), tags.perm.input.attack.special);
    }
    stateComboEnd() {
        Tag.removeTag(this.getOwner(), tags.perm.input.attack.special);
    }
    onStart() {
        Tag.removeTag(this.getOwner(), tags.perm.input.attack.special);
    }
    onStopped() {
        Tag.addTag(this.getOwner(), tags.perm.input.attack.special);
    }
};
MarieKSequence = __decorate([
    AnimationSequence
], MarieKSequence);

var notifies$4 = {
	damage: 0.3,
	input_buffer: 0.55
};
var states$4 = {
	combo: [
		0.5,
		0.65
	]
};
var events$4 = [
	{
		tick: 6,
		name: "notifyDamage"
	},
	{
		tick: 11,
		name: "notifyInput_buffer"
	},
	{
		tick: 10,
		name: "stateComboStart"
	},
	{
		tick: 13,
		name: "stateComboEnd"
	}
];
var options$4 = {
};
var dataAsset$4 = {
	notifies: notifies$4,
	states: states$4,
	events: events$4,
	options: options$4};

let MarieKkSequence = class MarieKkSequence extends AnimSequence {
    static animation = 'animation.ss.marie.kk';
    animation = 'animation.ss.marie.kk';
    duration = 16;
    playingType = AnimPlayingType.Once;
    override = true;
    animNotifEvents = dataAsset$4.events;
    notifies = dataAsset$4.notifies;
    states = dataAsset$4.states;
    options = dataAsset$4.options;
    notifyDamage() {
    }
    notifyInput_buffer() {
    }
    stateComboStart() {
        Tag.addTag(this.getOwner(), tags.perm.input.attack.special);
    }
    stateComboEnd() {
        Tag.removeTag(this.getOwner(), tags.perm.input.attack.special);
    }
    onStart() {
        Tag.removeTag(this.getOwner(), tags.perm.input.attack.special);
    }
    onStopped() {
        Tag.addTag(this.getOwner(), tags.perm.input.attack.special);
    }
};
MarieKkSequence = __decorate([
    AnimationSequence
], MarieKkSequence);

var notifies$3 = {
	damage: 0.5
};
var states$3 = {
};
var events$3 = [
	{
		tick: 10,
		name: "notifyDamage"
	}
];
var options$3 = {
};
var dataAsset$3 = {
	notifies: notifies$3,
	states: states$3,
	events: events$3,
	options: options$3};

let MarieKkkSequence = class MarieKkkSequence extends AnimSequence {
    static animation = 'animation.ss.marie.kkk';
    animation = 'animation.ss.marie.kkk';
    duration = 19;
    playingType = AnimPlayingType.Once;
    override = true;
    animNotifEvents = dataAsset$3.events;
    notifies = dataAsset$3.notifies;
    states = dataAsset$3.states;
    options = dataAsset$3.options;
    notifyDamage() {
    }
};
MarieKkkSequence = __decorate([
    AnimationSequence
], MarieKkkSequence);

var notifies$2 = {
	damage: 0.23,
	input_buffer: 0.4
};
var states$2 = {
	combo: [
		0.3,
		0.5
	]
};
var events$2 = [
	{
		tick: 5,
		name: "notifyDamage"
	},
	{
		tick: 8,
		name: "notifyInput_buffer"
	},
	{
		tick: 6,
		name: "stateComboStart"
	},
	{
		tick: 10,
		name: "stateComboEnd"
	}
];
var options$2 = {
};
var dataAsset$2 = {
	notifies: notifies$2,
	states: states$2,
	events: events$2,
	options: options$2};

let MariePSequence = class MariePSequence extends AnimSequence {
    static animation = 'animation.ss.marie.p';
    animation = 'animation.ss.marie.p';
    duration = 12;
    playingType = AnimPlayingType.Once;
    override = true;
    animNotifEvents = dataAsset$2.events;
    notifies = dataAsset$2.notifies;
    states = dataAsset$2.states;
    options = dataAsset$2.options;
    notifyDamage() {
    }
    stateComboStart() {
        Tag.addTag(this.getOwner(), tags.perm.input.attack.normal);
    }
    stateComboEnd() {
        Tag.removeTag(this.getOwner(), tags.perm.input.attack.normal);
    }
    onStart() {
        Tag.removeTag(this.getOwner(), tags.perm.input.attack.normal);
    }
    onStopped() {
        this.stateComboEnd();
        Tag.addTag(this.getOwner(), tags.perm.input.attack.normal);
    }
};
MariePSequence = __decorate([
    AnimationSequence
], MariePSequence);

var notifies$1 = {
	damage: 0.25,
	input_buffer: 0.4
};
var states$1 = {
	combo: [
		0.3,
		0.45
	]
};
var events$1 = [
	{
		tick: 5,
		name: "notifyDamage"
	},
	{
		tick: 8,
		name: "notifyInput_buffer"
	},
	{
		tick: 6,
		name: "stateComboStart"
	},
	{
		tick: 9,
		name: "stateComboEnd"
	}
];
var options$1 = {
};
var dataAsset$1 = {
	notifies: notifies$1,
	states: states$1,
	events: events$1,
	options: options$1};

let MariePpSequence = class MariePpSequence extends AnimSequence {
    static animation = 'animation.ss.marie.pp';
    animation = 'animation.ss.marie.pp';
    duration = 15;
    playingType = AnimPlayingType.Once;
    override = true;
    animNotifEvents = dataAsset$1.events;
    notifies = dataAsset$1.notifies;
    states = dataAsset$1.states;
    options = dataAsset$1.options;
    notifyDamage() {
    }
    stateComboStart() {
        Tag.addTag(this.getOwner(), tags.perm.input.attack.special);
    }
    stateComboEnd() {
        Tag.removeTag(this.getOwner(), tags.perm.input.attack.special);
    }
    onStart() {
        Tag.removeTag(this.getOwner(), tags.perm.input.attack.special);
    }
    onStopped() {
        this.stateComboEnd();
        Tag.addTag(this.getOwner(), tags.perm.input.attack.special);
    }
};
MariePpSequence = __decorate([
    AnimationSequence
], MariePpSequence);

var notifies = {
	damage: 0.3
};
var states = {
};
var events = [
	{
		tick: 6,
		name: "notifyDamage"
	}
];
var options = {
};
var dataAsset = {
	notifies: notifies,
	states: states,
	events: events,
	options: options};

let MariePpkSequence = class MariePpkSequence extends AnimSequence {
    static animation = 'animation.ss.marie.ppk';
    animation = 'animation.ss.marie.ppk';
    duration = 16;
    playingType = AnimPlayingType.Once;
    override = true;
    animNotifEvents = dataAsset.events;
    notifies = dataAsset.notifies;
    states = dataAsset.states;
    options = dataAsset.options;
    notifyDamage() {
    }
};
MariePpkSequence = __decorate([
    AnimationSequence
], MariePpkSequence);

function getAnimSeqComp(en) {
    return Application.getInst().getActor(en.id)?.getComponent(AnimationSequenceComponent);
}
class AnimationSequenceDisplayComponent extends Component {
    actionBar;
    animComp;
    animMessage;
    allowTicking = true;
    constructor(actionBar, animComp) {
        super();
        this.actionBar = actionBar;
        this.animComp = animComp;
    }
    start() {
        const actionBar = this.actor.getComponent(ActionBarComponent);
        const animComp = this.actor.getComponent(AnimationSequenceComponent);
        if (!actionBar || !animComp) {
            this.remove();
            return;
        }
        this.animMessage = actionBar.message.createBlock('ActionBar.AnimSeq', '');
    }
    detach() {
        this.actionBar.message.removeContentById('ActionBar.AnimSeq');
    }
    update() {
        if (this.animMessage) {
            const anim = this.animComp.animLayers.getPlayingAnimation();
            this.animMessage.text = '\nAnim: ' + (anim ? AnimSequence.formatAnimSeq(anim) : 'None');
        }
    }
}
class AnimationSequencePlugin {
    name = 'animSeq';
    description = '动画序列插件，用于管理动画';
    startModule(app) {
        registerPlayerComponent(AnimationSequenceComponent);
    }
    static getAnimSeqComp(id) {
        return Application.getInst().getActor(id)?.getComponent(AnimationSequenceComponent);
    }
    anim_seq_layer(entities, layer = 0) {
        entities.forEach(entity => {
            const animComp = getAnimSeqComp(entity);
            if (animComp) {
                profiler.info(...animComp.animLayers.getLayer(layer));
            }
        });
    }
    anim_seq_playing(entities, size = 20) {
        entities.forEach(entity => {
            const animComp = getAnimSeqComp(entity);
            if (animComp) {
                const animSeq = animComp.getPlayingAnimation();
                if (!animSeq) {
                    return;
                }
                profiler.info(animSeq);
            }
        });
    }
    anim_seq_defined(entities) {
        entities.forEach(entity => {
            const animComp = getAnimSeqComp(entity);
            if (animComp) {
                profiler.info(animComp.getAnimationNames());
            }
        });
    }
    hud_anim_seq(actors, enable = true, origin, app) {
        const actor = actors[0];
        const instigator = app.getActor(origin.sourceEntity.id);
        if (!instigator) {
            return profiler.error(`操作者没有绑定 Actor`);
        }
        if (!enable) {
            return instigator.removeComponent(AnimationSequenceDisplayComponent);
        }
        const actionBar = instigator.getComponent(ActionBarComponent);
        const animComp = actor.getComponent(AnimationSequenceComponent);
        if (!actionBar || !animComp) {
            return profiler.error(`操作者没有绑定 ActionBar 或被检测对象没有 AnimationSequenceComponent 组件`);
        }
        instigator.addComponent(new AnimationSequenceDisplayComponent(actionBar, animComp));
    }
}
__decorate([
    CustomCommand('查看动画层'),
    __param(0, Param.Required('entity')),
    __param(1, Param.Optional('int')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], AnimationSequencePlugin.prototype, "anim_seq_layer", null);
__decorate([
    CustomCommand('查看当前动画'),
    __param(0, Param.Required('entity')),
    __param(1, Param.Optional('int')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], AnimationSequencePlugin.prototype, "anim_seq_playing", null);
__decorate([
    CustomCommand('查看动画名称'),
    __param(0, Param.Required('entity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], AnimationSequencePlugin.prototype, "anim_seq_defined", null);
__decorate([
    CustomCommand('添加 Animation Sequence 监控视图到 Action Bar'),
    __param(0, Param.Required('actor')),
    __param(1, Param.Required('bool')),
    __param(2, Param.Origin),
    __param(3, Param.App),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], AnimationSequencePlugin.prototype, "hud_anim_seq", null);
var anim;
(function (anim) {
    /**
     * 可以播放非动画序列的动画（Minecraft 原版动画），但不是动画序列的动画无法停止
     * @param actor
     * @param name
     * @param base
     * @returns
     */
    function play(actor, name, base = true) {
        if (!AnimationSequenceComponent.hasAnimation(name) && Pawn.isPawn(actor)) {
            actor.entity?.playAnimation(name);
            return;
        }
        return AnimationSequencePlugin.getAnimSeqComp(actor.id)?.playAnimation(name, base);
    }
    anim.play = play;
    function stop(actor, name) {
        return AnimationSequencePlugin.getAnimSeqComp(actor.id)?.stopAnimation(name);
    }
    anim.stop = stop;
})(anim || (anim = {}));

class RoninSwordSystem {
    name = 'RoninSwordSystem';
    description = '浪人动作系统的完整插件';
    startModule(app) {
        registerPlayerSpawnClass(RoninModPlayer);
        registerPlayerController(RoninPlayerController);
        registerPlayerComponent(ActionBarComponent, DeterminationHudComponent, ControlKitComponent);
        app.loadPlugin(AnimationSequencePlugin, FinateStateMachinePlugin);
    }
}

let MarieMoves = class MarieMoves {
    resume() {
        return [
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ];
    }
    idle() {
        return [
            {
                // 玩家添加标签时触发状态转换
                trigger: TransitionTriggerType.OnTagAdd,
                // 转换到 attack1
                nextState: 'attack1',
                // 标签为 tags.skill.slot.attack
                tag: tags.skill.slot.attack
            },
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'kick1',
                tag: tags.skill.slot.special
            },
        ];
    }
    attack1() {
        onEnter(actor => anim.play(actor, MariePSequence.animation));
        return [
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'attack2',
                tag: tags.skill.slot.attack
            },
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ];
    }
    attack2() {
        onEnter(actor => anim.play(actor, MariePpSequence.animation));
        return [
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'ppk',
                tag: tags.skill.slot.special
            },
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ];
    }
    ppk() {
        onEnter(actor => anim.play(actor, MariePpkSequence.animation));
        return [
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ];
    }
    kick1() {
        onEnter(actor => anim.play(actor, MarieKSequence.animation));
        return [
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'kk',
                tag: tags.skill.slot.special
            },
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ];
    }
    kk() {
        onEnter(actor => anim.play(actor, MarieKkSequence.animation));
        return [
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'kkk',
                tag: tags.skill.slot.special
            },
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ];
    }
    kkk() {
        onEnter(actor => anim.play(actor, MarieKkkSequence.animation));
        return [
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ];
    }
};
__decorate([
    StateDef(0),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], MarieMoves.prototype, "resume", null);
__decorate([
    StateDef(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], MarieMoves.prototype, "idle", null);
__decorate([
    StateDef(12),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], MarieMoves.prototype, "attack1", null);
__decorate([
    StateDef(15),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], MarieMoves.prototype, "attack2", null);
__decorate([
    StateDef(16),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], MarieMoves.prototype, "ppk", null);
__decorate([
    StateDef(14),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], MarieMoves.prototype, "kick1", null);
__decorate([
    StateDef(16),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], MarieMoves.prototype, "kk", null);
__decorate([
    StateDef(18),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], MarieMoves.prototype, "kkk", null);
MarieMoves = __decorate([
    StateMachineTemplate('ronin:marie', 'resume')
], MarieMoves);

let MyMod = class MyMod extends ModBase {
    start(app) {
        app.loadPlugin(RoninSwordSystem);
        registerPlayerController(MyController);
        registerPlayerComponent(BattleAttributes);
    }
};
MyMod = __decorate([
    Entry
], MyMod);

export { MyMod };
