/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.UploadChunk = (function () {

    /**
     * Properties of an UploadChunk.
     * @exports IUploadChunk
     * @interface IUploadChunk
     * @property {string|null} [id] UploadChunk id
     * @property {number|null} [chunk_number] UploadChunk chunk_number
     * @property {Uint8Array|null} [chunk] UploadChunk chunk
     * @property {string|null} [ext] UploadChunk ext
     */

    /**
     * Constructs a new UploadChunk.
     * @exports UploadChunk
     * @classdesc Represents an UploadChunk.
     * @implements IUploadChunk
     * @constructor
     * @param {IUploadChunk=} [properties] Properties to set
     */
    function UploadChunk(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * UploadChunk id.
     * @member {string} id
     * @memberof UploadChunk
     * @instance
     */
    UploadChunk.prototype.id = "";

    /**
     * UploadChunk chunk_number.
     * @member {number} chunk_number
     * @memberof UploadChunk
     * @instance
     */
    UploadChunk.prototype.chunk_number = 0;

    /**
     * UploadChunk chunk.
     * @member {Uint8Array} chunk
     * @memberof UploadChunk
     * @instance
     */
    UploadChunk.prototype.chunk = $util.newBuffer([]);

    /**
     * UploadChunk ext.
     * @member {string} ext
     * @memberof UploadChunk
     * @instance
     */
    UploadChunk.prototype.ext = "";

    /**
     * Creates a new UploadChunk instance using the specified properties.
     * @function create
     * @memberof UploadChunk
     * @static
     * @param {IUploadChunk=} [properties] Properties to set
     * @returns {UploadChunk} UploadChunk instance
     */
    UploadChunk.create = function create(properties) {
        return new UploadChunk(properties);
    };

    /**
     * Encodes the specified UploadChunk message. Does not implicitly {@link UploadChunk.verify|verify} messages.
     * @function encode
     * @memberof UploadChunk
     * @static
     * @param {IUploadChunk} message UploadChunk message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UploadChunk.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
        if (message.chunk_number != null && Object.hasOwnProperty.call(message, "chunk_number"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.chunk_number);
        if (message.chunk != null && Object.hasOwnProperty.call(message, "chunk"))
            writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.chunk);
        if (message.ext != null && Object.hasOwnProperty.call(message, "ext"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.ext);
        return writer;
    };

    /**
     * Encodes the specified UploadChunk message, length delimited. Does not implicitly {@link UploadChunk.verify|verify} messages.
     * @function encodeDelimited
     * @memberof UploadChunk
     * @static
     * @param {IUploadChunk} message UploadChunk message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UploadChunk.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an UploadChunk message from the specified reader or buffer.
     * @function decode
     * @memberof UploadChunk
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {UploadChunk} UploadChunk
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UploadChunk.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.UploadChunk();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    message.id = reader.string();
                    break;
                }
                case 2: {
                    message.chunk_number = reader.int32();
                    break;
                }
                case 3: {
                    message.chunk = reader.bytes();
                    break;
                }
                case 4: {
                    message.ext = reader.string();
                    break;
                }
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    };

    /**
     * Decodes an UploadChunk message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof UploadChunk
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {UploadChunk} UploadChunk
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UploadChunk.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an UploadChunk message.
     * @function verify
     * @memberof UploadChunk
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    UploadChunk.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isString(message.id))
                return "id: string expected";
        if (message.chunk_number != null && message.hasOwnProperty("chunk_number"))
            if (!$util.isInteger(message.chunk_number))
                return "chunk_number: integer expected";
        if (message.chunk != null && message.hasOwnProperty("chunk"))
            if (!(message.chunk && typeof message.chunk.length === "number" || $util.isString(message.chunk)))
                return "chunk: buffer expected";
        if (message.ext != null && message.hasOwnProperty("ext"))
            if (!$util.isString(message.ext))
                return "ext: string expected";
        return null;
    };

    /**
     * Creates an UploadChunk message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof UploadChunk
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {UploadChunk} UploadChunk
     */
    UploadChunk.fromObject = function fromObject(object) {
        if (object instanceof $root.UploadChunk)
            return object;
        var message = new $root.UploadChunk();
        if (object.id != null)
            message.id = String(object.id);
        if (object.chunk_number != null)
            message.chunk_number = object.chunk_number | 0;
        if (object.chunk != null)
            if (typeof object.chunk === "string")
                $util.base64.decode(object.chunk, message.chunk = $util.newBuffer($util.base64.length(object.chunk)), 0);
            else if (object.chunk.length >= 0)
                message.chunk = object.chunk;
        if (object.ext != null)
            message.ext = String(object.ext);
        return message;
    };

    /**
     * Creates a plain object from an UploadChunk message. Also converts values to other types if specified.
     * @function toObject
     * @memberof UploadChunk
     * @static
     * @param {UploadChunk} message UploadChunk
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    UploadChunk.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.id = "";
            object.chunk_number = 0;
            if (options.bytes === String)
                object.chunk = "";
            else {
                object.chunk = [];
                if (options.bytes !== Array)
                    object.chunk = $util.newBuffer(object.chunk);
            }
            object.ext = "";
        }
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.chunk_number != null && message.hasOwnProperty("chunk_number"))
            object.chunk_number = message.chunk_number;
        if (message.chunk != null && message.hasOwnProperty("chunk"))
            object.chunk = options.bytes === String ? $util.base64.encode(message.chunk, 0, message.chunk.length) : options.bytes === Array ? Array.prototype.slice.call(message.chunk) : message.chunk;
        if (message.ext != null && message.hasOwnProperty("ext"))
            object.ext = message.ext;
        return object;
    };

    /**
     * Converts this UploadChunk to JSON.
     * @function toJSON
     * @memberof UploadChunk
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    UploadChunk.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for UploadChunk
     * @function getTypeUrl
     * @memberof UploadChunk
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    UploadChunk.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/UploadChunk";
    };

    return UploadChunk;
})();

module.exports = $root;
