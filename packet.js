// PacketType Enum
export const PacketType = Object.freeze({
    COMMAND: 35,
    COMMAND_RESPONSE: 36,
    REALTIME_DATA: 40,
    HISTORICAL_DATA: 47,
    REALTIME_RAW_DATA: 43,
    EVENT: 48,
    METADATA: 49,
    CONSOLE_LOGS: 50,
    REALTIME_IMU_DATA_STREAM: 51,
    HISTORICAL_IMU_DATA_STREAM: 52
});

// MetadataType Enum
export const MetadataType = Object.freeze({
    HISTORY_START: 1,
    HISTORY_END: 2,
    HISTORY_COMPLETE: 3
});

// EventNumber Enum
export const EventNumber = Object.freeze({
    UNDEFINED: 0,
    ERROR: 1,
    CONSOLE_OUTPUT: 2,
    BATTERY_LEVEL: 3,
    SYSTEM_CONTROL: 4,
    EXTERNAL_5V_ON: 5,
    EXTERNAL_5V_OFF: 6,
    CHARGING_ON: 7,
    CHARGING_OFF: 8,
    WRIST_ON: 9,
    WRIST_OFF: 10,
    BLE_CONNECTION_UP: 11,
    BLE_CONNECTION_DOWN: 12,
    RTC_LOST: 13,
    DOUBLE_TAP: 14,
    BOOT: 15,
    SET_RTC: 16,
    TEMPERATURE_LEVEL: 17,
    PAIRING_MODE: 18,
    SERIAL_HEAD_CONNECTED: 19,
    SERIAL_HEAD_REMOVED: 20,
    BATTERY_PACK_CONNECTED: 21,
    BATTERY_PACK_REMOVED: 22,
    BLE_BONDED: 23,
    BLE_HR_PROFILE_ENABLED: 24,
    BLE_HR_PROFILE_DISABLED: 25,
    TRIM_ALL_DATA: 26,
    TRIM_ALL_DATA_ENDED: 27,
    FLASH_INIT_COMPLETE: 28,
    STRAP_CONDITION_REPORT: 29,
    BOOT_REPORT: 30,
    EXIT_VIRGIN_MODE: 31,
    CAPTOUCH_AUTOTHRESHOLD_ACTION: 32,
    BLE_REALTIME_HR_ON: 33,
    BLE_REALTIME_HR_OFF: 34,
    ACCELEROMETER_RESET: 35,
    AFE_RESET: 36,
    SHIP_MODE_ENABLED: 37,
    SHIP_MODE_DISABLED: 38,
    SHIP_MODE_BOOT: 39,
    CH1_SATURATION_DETECTED: 40,
    CH2_SATURATION_DETECTED: 41,
    ACCELEROMETER_SATURATION_DETECTED: 42,
    BLE_SYSTEM_RESET: 43,
    BLE_SYSTEM_ON: 44,
    BLE_SYSTEM_INITIALIZED: 45,
    RAW_DATA_COLLECTION_ON: 46,
    RAW_DATA_COLLECTION_OFF: 47,
    STRAP_DRIVEN_ALARM_SET: 56,
    STRAP_DRIVEN_ALARM_EXECUTED: 57,
    APP_DRIVEN_ALARM_EXECUTED: 58,
    STRAP_DRIVEN_ALARM_DISABLED: 59,
    HAPTICS_FIRED: 60,
    EXTENDED_BATTERY_INFORMATION: 63,
    HIGH_FREQ_SYNC_PROMPT: 96,
    HIGH_FREQ_SYNC_ENABLED: 97,
    HIGH_FREQ_SYNC_DISABLED: 98,
    HAPTICS_TERMINATED: 100
});

// CommandNumber Enum
export const CommandNumber = Object.freeze({
    LINK_VALID: 1,
    GET_MAX_PROTOCOL_VERSION: 2,
    TOGGLE_REALTIME_HR: 3,
    REPORT_VERSION_INFO: 7,
    TOGGLE_R7_DATA_COLLECTION: 16,
    SET_CLOCK: 10,
    GET_CLOCK: 11,
    TOGGLE_GENERIC_HR_PROFILE: 14,
    RUN_HAPTIC_PATTERN_MAVERICK: 19,
    ABORT_HISTORICAL_TRANSMITS: 20,
    SEND_HISTORICAL_DATA: 22,
    HISTORICAL_DATA_RESULT: 23,
    GET_BATTERY_LEVEL: 26,
    REBOOT_STRAP: 29,
    FORCE_TRIM: 25,
    POWER_CYCLE_STRAP: 32,
    SET_READ_POINTER: 33,
    GET_DATA_RANGE: 34,
    GET_HELLO_HARVARD: 35,
    START_FIRMWARE_LOAD: 36,
    LOAD_FIRMWARE_DATA: 37,
    PROCESS_FIRMWARE_IMAGE: 38,
    START_FIRMWARE_LOAD_NEW: 142,
    LOAD_FIRMWARE_DATA_NEW: 143,
    PROCESS_FIRMWARE_IMAGE_NEW: 144,
    VERIFY_FIRMWARE_IMAGE: 83,
    SET_LED_DRIVE: 39,
    GET_LED_DRIVE: 40,
    SET_TIA_GAIN: 41,
    GET_TIA_GAIN: 42,
    SET_BIAS_OFFSET: 43,
    GET_BIAS_OFFSET: 44,
    ENTER_BLE_DFU: 45,
    SET_DP_TYPE: 52,
    FORCE_DP_TYPE: 53,
    SEND_R10_R11_REALTIME: 63,
    SET_ALARM_TIME: 66,
    GET_ALARM_TIME: 67,
    RUN_ALARM: 68,
    DISABLE_ALARM: 69,
    GET_ADVERTISING_NAME_HARVARD: 76,
    SET_ADVERTISING_NAME_HARVARD: 77,
    RUN_HAPTICS_PATTERN: 79,
    GET_ALL_HAPTICS_PATTERN: 80,
    START_RAW_DATA: 81,
    STOP_RAW_DATA: 82,
    GET_BODY_LOCATION_AND_STATUS: 84,
    ENTER_HIGH_FREQ_SYNC: 96,
    EXIT_HIGH_FREQ_SYNC: 97,
    GET_EXTENDED_BATTERY_INFO: 98,
    RESET_FUEL_GAUGE: 99,
    CALIBRATE_CAPSENSE: 100,
    TOGGLE_IMU_MODE_HISTORICAL: 105,
    TOGGLE_IMU_MODE: 106,
    TOGGLE_OPTICAL_MODE: 108,
    START_FF_KEY_EXCHANGE: 117,
    SEND_NEXT_FF: 118,
    SET_FF_VALUE: 120,
    GET_FF_VALUE: 128,
    STOP_HAPTICS: 122,
    SELECT_WRIST: 123,
    TOGGLE_LABRADOR_FILTERED: 139,
    TOGGLE_LABRADOR_RAW_SAVE: 125,
    TOGGLE_LABRADOR_DATA_GENERATION: 124,
    START_DEVICE_CONFIG_KEY_EXCHANGE: 115,
    SEND_NEXT_DEVICE_CONFIG: 116,
    SET_DEVICE_CONFIG_VALUE: 119,
    GET_DEVICE_CONFIG_VALUE: 121,
    SET_RESEARCH_PACKET: 131,
    GET_RESEARCH_PACKET: 132,
    START_SESSION:        0x85,   // 133
    SESSION_RESPONSE:     0x86,   // 134
    GET_ADVERTISING_NAME: 141,
    SET_ADVERTISING_NAME: 140,
    GET_HELLO: 145,
    ENABLE_OPTICAL_DATA: 107
});

export class WhoopPacket {
// Add CRC8 lookup table at the top of packet.js
static CRC8_TABLE = [
    0x00, 0x07, 0x0E, 0x09, 0x1C, 0x1B, 0x12, 0x15, 0x38, 0x3F, 0x36, 0x31, 0x24, 0x23, 0x2A, 0x2D,
    0x70, 0x77, 0x7E, 0x79, 0x6C, 0x6B, 0x62, 0x65, 0x48, 0x4F, 0x46, 0x41, 0x54, 0x53, 0x5A, 0x5D,
    0xE0, 0xE7, 0xEE, 0xE9, 0xFC, 0xFB, 0xF2, 0xF5, 0xD8, 0xDF, 0xD6, 0xD1, 0xC4, 0xC3, 0xCA, 0xCD,
    0x90, 0x97, 0x9E, 0x99, 0x8C, 0x8B, 0x82, 0x85, 0xA8, 0xAF, 0xA6, 0xA1, 0xB4, 0xB3, 0xBA, 0xBD,
    0xC7, 0xC0, 0xC9, 0xCE, 0xDB, 0xDC, 0xD5, 0xD2, 0xFF, 0xF8, 0xF1, 0xF6, 0xE3, 0xE4, 0xED, 0xEA,
    0xB7, 0xB0, 0xB9, 0xBE, 0xAB, 0xAC, 0xA5, 0xA2, 0x8F, 0x88, 0x81, 0x86, 0x93, 0x94, 0x9D, 0x9A,
    0x27, 0x20, 0x29, 0x2E, 0x3B, 0x3C, 0x35, 0x32, 0x1F, 0x18, 0x11, 0x16, 0x03, 0x04, 0x0D, 0x0A,
    0x57, 0x50, 0x59, 0x5E, 0x4B, 0x4C, 0x45, 0x42, 0x6F, 0x68, 0x61, 0x66, 0x73, 0x74, 0x7D, 0x7A,
    0x89, 0x8E, 0x87, 0x80, 0x95, 0x92, 0x9B, 0x9C, 0xB1, 0xB6, 0xBF, 0xB8, 0xAD, 0xAA, 0xA3, 0xA4,
    0xF9, 0xFE, 0xF7, 0xF0, 0xE5, 0xE2, 0xEB, 0xEC, 0xC1, 0xC6, 0xCF, 0xC8, 0xDD, 0xDA, 0xD3, 0xD4,
    0x69, 0x6E, 0x67, 0x60, 0x75, 0x72, 0x7B, 0x7C, 0x51, 0x56, 0x5F, 0x58, 0x4D, 0x4A, 0x43, 0x44,
    0x19, 0x1E, 0x17, 0x10, 0x05, 0x02, 0x0B, 0x0C, 0x21, 0x26, 0x2F, 0x28, 0x3D, 0x3A, 0x33, 0x34,
    0x4E, 0x49, 0x40, 0x47, 0x52, 0x55, 0x5C, 0x5B, 0x76, 0x71, 0x78, 0x7F, 0x6A, 0x6D, 0x64, 0x63,
    0x3E, 0x39, 0x30, 0x37, 0x22, 0x25, 0x2C, 0x2B, 0x06, 0x01, 0x08, 0x0F, 0x1A, 0x1D, 0x14, 0x13,
    0xAE, 0xA9, 0xA0, 0xA7, 0xB2, 0xB5, 0xBC, 0xBB, 0x96, 0x91, 0x98, 0x9F, 0x8A, 0x8D, 0x84, 0x83,
    0xDE, 0xD9, 0xD0, 0xD7, 0xC2, 0xC5, 0xCC, 0xCB, 0xE6, 0xE1, 0xE8, 0xEF, 0xFA, 0xFD, 0xF4, 0xF3
];
    static sof = 0xAA;

    constructor(type, seq, cmd, data = new Uint8Array()) {
        this.type = type;
        this.seq = seq;
        this.cmd = cmd;
        this.data = data;
    }

    /**
     * Creates a WhoopPacket object from raw data.
     * @param {Uint8Array} data The raw packet data.
     * @returns {WhoopPacket} A WhoopPacket object, or null if the data is invalid.
     * @throws {Error} If the packet is invalid.
     */
    static fromData(data) {
        if (data.length < 8) { // Minimum packet size: SOF(1) + Length(2) + CRC8(1) + Payload(min 0) + CRC32(4)
            throw new Error("Packet too short");
        }

        // Verify SOF
        if (data[0] !== WhoopPacket.sof) {
            throw new Error(`Invalid packet SOF: ${WhoopPacket.packetToHexString(data)}`);
        }

        // Verify header CRC8
        const lengthBuffer = data.slice(1, 3);
        const expectedCrc8 = data[3];
        const calculatedCrc8 = WhoopPacket.crc8(lengthBuffer);

        if (calculatedCrc8 !== expectedCrc8) {
            throw new Error(`Invalid packet header CRC8: Expected ${expectedCrc8.toString(16).padStart(2, '0').toUpperCase()}, Calculated ${calculatedCrc8.toString(16).padStart(2, '0').toUpperCase()}`);
        }

        // Verify data CRC32
        const length = (data[2] << 8) | data[1]; // Little-endian
        if (length > data.length || length < 8) {
            throw new Error("Invalid packet length");
        }

        const pkt = data.slice(4, length);
        const expectedCrc32Buffer = data.slice(length, length + 4);
        const dataView = new DataView(expectedCrc32Buffer.buffer, expectedCrc32Buffer.byteOffset, expectedCrc32Buffer.byteLength);
        const expectedCrc32 = dataView.getUint32(0, true); // Little-endian
        const calculatedCrc32 = WhoopPacket.crc32(pkt);
        if (calculatedCrc32 !== expectedCrc32) {
            throw new Error(`Invalid packet data CRC32: Expected ${expectedCrc32.toString(16).padStart(8, '0').toUpperCase()}, Calculated ${calculatedCrc32.toString(16).padStart(8, '0').toUpperCase()}`);
        }

        const type = pkt[0];
        const seq = pkt[1];
        const cmd = pkt[2];
        const payload = pkt.slice(3);

        return new WhoopPacket(type, seq, cmd, payload);
    }

    /**
     * Creates the basic packet structure without framing
     * @returns {Uint8Array} The unframed packet
     */
    createPacket() {
        const packet = new Uint8Array(3 + this.data.length);
        packet[0] = this.type; // Assuming type is a single char
        packet[1] = this.seq;
        packet[2] = this.cmd;  // Assuming cmd is a single char
        packet.set(this.data, 3);
        return packet;
    }

    /**
     * Computes CRC-8 for the length field (for packet integrity)
     * @param {Uint8Array} data - The data to calculate CRC-8
     * @returns {number} CRC-8 checksum
     */
    static crc8(data) {
        let crc = 0;
        for (let byte of data) {
        crc = WhoopPacket.CRC8_TABLE[crc ^ byte];
    }
    return crc;
    }

    /**
     * Computes CRC-32 for packet integrity check
     * @param {Uint8Array} data - The data to calculate CRC-32
     * @returns {number} CRC-32 checksum
     */
    static crc32(data) {
        let crc = 0xFFFFFFFF;
        for (let byte of data) {
            crc ^= byte;
            for (let i = 0; i < 8; i++) {
                crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
            }
        }

        return (~crc) >>> 0;
    }

    /**
     * Creates a framed packet with CRC and length fields
     * @returns {Uint8Array} The fully framed packet ready for transmission
     */
    framedPacket() {
        const pkt = this.createPacket();
        const length = pkt.length + 4;
        const lengthBuffer = new Uint8Array([length & 0xFF, length >> 8]); // Little endian length
        const crc8Value = WhoopPacket.crc8(lengthBuffer);
        
        // Calculate CRC32
        const crc32Value = WhoopPacket.crc32(pkt);
        const crc32Buffer = new Uint8Array([
            crc32Value & 0xFF, 
            (crc32Value >> 8) & 0xFF, 
            (crc32Value >> 16) & 0xFF, 
            (crc32Value >> 24) & 0xFF
        ]);

        // Construct the final packet
        const framedPacket = new Uint8Array(1 + 2 + 1 + pkt.length + 4); 
        framedPacket[0] = WhoopPacket.sof;             // Start of Frame (0xAA)
        framedPacket.set(lengthBuffer, 1);             // Length (2 bytes)
        framedPacket[3] = crc8Value;                   // CRC-8
        framedPacket.set(pkt, 4);                      // Packet payload
        framedPacket.set(crc32Buffer, 4 + pkt.length); // CRC-32 at the end

        return framedPacket;
    }

    /**
     * Utility to convert packet to hex string for display
     */
    static packetToHexString(packet) {
        return Array.from(packet)
            .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');
    }

    /**
     * Returns a string representation of the WhoopPacket object.
     * @returns {string} A formatted string representing the packet.
     */
    toString() {
        return `WhoopPacket {
            Type: 0x${this.type.toString(16).padStart(2, '0').toUpperCase()},
            Seq: ${this.seq},
            Cmd: 0x${this.cmd.toString(16).padStart(2, '0').toUpperCase()},
            Payload: ${WhoopPacket.packetToHexString(this.data)}
        }`;
    }
}
