# WHOOP Command Reference

This document provides a reference for commands used to communicate with the WHOOP 4.0 device.

## GATT Services and Characteristics

### Primary Service
UUID: `61080001-8d6d-82b8-614a-1c8cb0f8dcc6`

### Characteristics
- `61080002-8d6d-82b8-614a-1c8cb0f8dcc6` - CMD_TO_STRAP (Writable)
- `61080003-8d6d-82b8-614a-1c8cb0f8dcc6` - CMD_FROM_STRAP
- `61080004-8d6d-82b8-614a-1c8cb0f8dcc6` - EVENTS_FROM_STRAP
- `61080005-8d6d-82b8-614a-1c8cb0f8dcc6` - DATA_FROM_STRAP
- `61080007-8D6D-82B8-614A-1C8CB0F8DCC6` - MEMFAULT

## Packet Structure

WHOOP packets have the following structure:
1. Start of frame (SOF): 0xAA
2. Length (2 bytes, little-endian)
3. CRC8 of length
4. Payload:
   - Type (1 byte)
   - Sequence number (1 byte)
   - Command (1 byte)
   - Data (variable length)
5. CRC32 of payload (4 bytes)

### Packet Types
- `35` (0x23) - COMMAND
- `36` (0x24) - COMMAND_RESPONSE
- `40` (0x28) - REALTIME_DATA
- `47` (0x2F) - HISTORICAL_DATA
- `48` (0x30) - EVENT
- `49` (0x31) - METADATA
- `50` (0x32) - CONSOLE_LOGS
- `51` (0x33) - REALTIME_IMU_DATA_STREAM
- `52` (0x34) - HISTORICAL_IMU_DATA_STREAM

## Historical Data Retrieval

To retrieve historical data, send the following packet to the CMD_TO_STRAP characteristic:
```
aa0800a8230e16001147c585
```

This will trigger the device to begin sending historical data packets.

## Common Commands

### Battery Level
To get the battery level, send a GET_BATTERY_LEVEL command (26):
```javascript
let pkt = new WhoopPacket(PacketType.COMMAND, 10, CommandNumber.GET_BATTERY_LEVEL, new Uint8Array([0x00])).framedPacket();
```

### Real-time Heart Rate
To toggle real-time heart rate monitoring, send a TOGGLE_REALTIME_HR command (3):
```javascript
// Start real-time HR
let pkt = new WhoopPacket(PacketType.COMMAND, 10, CommandNumber.TOGGLE_REALTIME_HR, new Uint8Array([0x01])).framedPacket();

// Stop real-time HR
let pkt = new WhoopPacket(PacketType.COMMAND, 10, CommandNumber.TOGGLE_REALTIME_HR, new Uint8Array([0x00])).framedPacket();
```

### Device Clock
To get the device clock, send a GET_CLOCK command (11):
```javascript
let pkt = new WhoopPacket(PacketType.COMMAND, 10, CommandNumber.GET_CLOCK, new Uint8Array([0x00])).framedPacket();
```

### Device Version
To get the firmware version, send a REPORT_VERSION_INFO command (7):
```javascript
let pkt = new WhoopPacket(PacketType.COMMAND, 10, CommandNumber.REPORT_VERSION_INFO, new Uint8Array([0x00])).framedPacket();
```

### Device Status
To get device status (wrist detection, etc.), send a GET_HELLO_HARVARD command (35):
```javascript
let pkt = new WhoopPacket(PacketType.COMMAND, 10, CommandNumber.GET_HELLO_HARVARD, new Uint8Array([0x00])).framedPacket();
```

### Alarm Functions
To run the alarm, send a RUN_ALARM command (68):
```javascript
let pkt = new WhoopPacket(PacketType.COMMAND, 10, CommandNumber.RUN_ALARM, new Uint8Array([0x00])).framedPacket();
```

### Haptic Functions
To run haptic vibration, send a RUN_HAPTICS_PATTERN command (79):
```javascript
let pkt = new WhoopPacket(PacketType.COMMAND, 10, CommandNumber.RUN_HAPTICS_PATTERN, new Uint8Array([0x00])).framedPacket();
```

### Device Control
To reboot the device, send a REBOOT_STRAP command (29):
```javascript
let pkt = new WhoopPacket(PacketType.COMMAND, 10, CommandNumber.REBOOT_STRAP, new Uint8Array([0x00])).framedPacket();
```

## Metadata Types

During historical data retrieval, the device sends metadata packets:
- `1` - HISTORY_START
- `2` - HISTORY_END
- `3` - HISTORY_COMPLETE

## Event Types

The device generates several types of events:
- `7` - CHARGING_ON 
- `8` - CHARGING_OFF
- `9` - WRIST_ON
- `10` - WRIST_OFF
- `14` - DOUBLE_TAP

See the full list in the `EventNumber` enum in the code.

## Known Limitations

The checksum algorithm is not fully understood, which limits the ability to test all commands. Further reverse engineering is needed to fully document all command functions and parameters.
