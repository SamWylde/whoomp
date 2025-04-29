import { PacketType, MetadataType, EventNumber, CommandNumber, WhoopPacket } from "./packet.js";
import { AsyncQueue } from "./queue.js";
import * as ui from "./ui.js";
import { FileStreamHandler } from "./file.js";

import { AesCmac } from 'https://esm.sh/aes-cmac@3.1.0?bundle';

const WHOOP_SERVICE = "61080001-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_CMD_TO_STRAP = "61080002-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_CMD_FROM_STRAP = "61080003-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_EVENTS_FROM_STRAP = "61080004-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_DATA_FROM_STRAP = "61080005-8d6d-82b8-614a-1c8cb0f8dcc6";

let device;
let server;
let characteristics = {};

// To store the interval reference
let batteryInterval;

// Tracks TOGGLE_REALTIME_HR status
let isRealtimeActive = false;

// For the metadata packets
const metaQueue = new AsyncQueue();

// Create separate instances for historical data
const historicalDataLogger = new FileStreamHandler("historical_data_stream.bin");

/**
 * Send raw historical data request command
 * This command was discovered through bWanShiTong's research
 * and reliably retrieves the last few minutes of historical data
 */
async function sendRawHistoricalData() {
    if (!characteristics.cmdToStrap) {
        console.error(`error: please connect to the device first`);
        return;
    }

    try {
        // This specific raw command has been found to work reliably
        // Source: bWanShiTong/reverse-engineering-whoop
        const rawCommand = new Uint8Array([
            0xaa, 0x08, 0x00, 0xa8, 0x23, 0x0e, 0x16, 0x00, 0x11, 0x47, 0xc5, 0x85
        ]);
        
        await characteristics.cmdToStrap.writeValue(rawCommand);
        ui.showNotification("Raw historical data request sent!");
    } catch (error) {
        console.error(`error sending raw command: ${error.message}`);
    }
}

async function performAuth() {
  /* Step A */
  await writeCmd(CommandNumber.START_SESSION, []);
  /* Step B */
  const challPkt = await cmdResponseQueue.dequeue();
  const rand     = challPkt.data.slice(0,16);

  /* build key from serial */
  const dis         = await server.getPrimaryService('device_information');
  const serialChar  = await dis.getCharacteristic('serial_number_string');
  const serialStr   = new TextDecoder().decode(await serialChar.readValue());
  const key         = new TextEncoder().encode(serialStr.slice(0,16).split('').reverse().join(''));

  /* Step C */
  const r          = new Uint8Array(await aesCmac.cmac(key, rand));
  await writeCmd(CommandNumber.SESSION_RESPONSE, r);
}

const cmdResponseQueue = new AsyncQueue();  

async function writeCmd(cmdNumber, payload = []) {
if (!characteristics.cmdToStrap) {
throw new Error('cmdToStrap not initialised');
}
const pkt = new WhoopPacket(
PacketType.COMMAND, 0, cmdNumber, new Uint8Array(payload)
).framedPacket();
await characteristics.cmdToStrap.writeValue(pkt);
}

const aesCmac = new AesCmac();

async function processMetadataPacket(packet) {
    // Check if it's a metadata packet
    if (packet.type !== PacketType.METADATA) {
        return;
    }
    
    // Based on bWanShiTong's research on metadata packet structure
    switch(packet.cmd) {
        case MetadataType.HISTORY_START:
            console.log("Historical data download started");
            ui.showNotification("History download started!");
            break;
            
        case MetadataType.HISTORY_END:
            // Extract trim value from metadata as documented in DECODING
            const dataView = new DataView(packet.data.buffer);
            const trim = dataView.getUint32(10, true); // Little-endian, offset 10
            
            // Send response with the trim value
            const responsePacket = new Uint8Array(9);
            const responseView = new DataView(responsePacket.buffer);
            responseView.setUint8(0, 1);                  
            responseView.setUint32(1, trim, true);        
            responseView.setUint32(5, 0, true);           
            
            const pkt = new WhoopPacket(
                PacketType.COMMAND, 
                0, 
                CommandNumber.HISTORICAL_DATA_RESULT, 
                responsePacket
            ).framedPacket();
            
            await characteristics.cmdToStrap.writeValue(pkt);
            break;
            
        case MetadataType.HISTORY_COMPLETE:
            console.log("Historical data download complete");
            ui.showNotification("History download complete!");
            break;
    }
}

/**
 * Connect to the WHOOP device and setup notifications
 */
async function connectToWhoop() {
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [WHOOP_SERVICE] }],
            optionalServices: [
    WHOOP_SERVICE,
    0x181E        // Bond Management Service
  ]
        });

        server = await device.gatt.connect();
        console.log(`connected to WHOOP device!`);

        const service = await server.getPrimaryService(WHOOP_SERVICE);
        characteristics.cmdToStrap = await service.getCharacteristic(WHOOP_CHAR_CMD_TO_STRAP);
        characteristics.cmdFromStrap = await service.getCharacteristic(WHOOP_CHAR_CMD_FROM_STRAP);
        characteristics.eventsFromStrap = await service.getCharacteristic(WHOOP_CHAR_EVENTS_FROM_STRAP);
        characteristics.dataFromStrap = await service.getCharacteristic(WHOOP_CHAR_DATA_FROM_STRAP);

        // Setting up notification handlers
        await characteristics.cmdFromStrap.startNotifications();
        await characteristics.eventsFromStrap.startNotifications();
        await characteristics.dataFromStrap.startNotifications();

        await performAuth();     // << IMPORTANT – DO NOT MOVE OR REMOVE

        characteristics.cmdFromStrap.addEventListener('characteristicvaluechanged', handleCmdNotification);
        characteristics.eventsFromStrap.addEventListener('characteristicvaluechanged', handleEventsNotification);
        characteristics.dataFromStrap.addEventListener('characteristicvaluechanged', handleDataNotification);

        // Register the disconnect event handler
        device.addEventListener('gattserverdisconnected', handleDisconnect);

        // Start periodic battery updates
        await startBatteryUpdates();

        // Get version and wrist status
        await sendReportVersion();
        await sendHelloHarvard();

        // Show elements
        ui.hideElements(false);

        return true;
    } catch (error) {
        console.error(error.message);
        return false;
    }
}

/**
 * Disconnect from the WHOOP and cleanup
 */
async function disconnectFromWhoop() {
    if (device && device.gatt.connected) {
        // Disconnecting the device
        await device.gatt.disconnect();
        console.log(`disconnected from WHOOP successfully`);

        return true;
    } else {
        console.warn(`device was not connected`);
        return false;
    }
}

/**
 * Handles device disconnection.
 */
async function handleDisconnect(event) {
    console.warn(`device disconnected!`);
    await stopBatteryUpdates(); // Stop updates on disconnect

    // Hide elements
    ui.hideElements(true);

    // Change button back
    const connectButton = document.getElementById('connectButton');
    connectButton.textContent = 'Connect WHOOP';
    connectButton.classList.replace('bg-red-500', 'bg-blue-500');
    connectButton.classList.replace('hover:bg-red-700', 'hover:bg-blue-700');
}

/**
 * Parse the data field from REPORT_VERSION_INFO packet
 */
function parseVersionData(dataView) {
    let offset = 0;

    // Unpack the first three bytes as unsigned integers
    const b1 = dataView.getUint8(offset++);
    const b2 = dataView.getUint8(offset++);
    const b3 = dataView.getUint8(offset++);

    // Unpack the next 16 unsigned integers as 32-bit little-endian integers
    const values = [];
    for (let i = 0; i < 16; i++) {
        values.push(dataView.getUint32(offset, true)); // Little-endian
        offset += 4;
    }

    // Construct the "harvard" version string
    const harvard = `${values[0]}.${values[1]}.${values[2]}.${values[3]}`;

    // Construct the "boylston" version string
    const boylston = `${values[4]}.${values[5]}.${values[6]}.${values[7]}`;

    return { harvard, boylston };
}

/**
 * Handle incoming CMD notifications
 */
function handleCmdNotification(event) {
    const value = new Uint8Array(event.target.value.buffer);
    let packet = WhoopPacket.fromData(value);
    let dataView = new DataView(packet.data.buffer, packet.data.byteOffset, packet.data.byteLength);

if (packet.type === PacketType.COMMAND) {
cmdResponseQueue.enqueue(packet);
}
    if (packet.cmd == CommandNumber.GET_BATTERY_LEVEL) {
        let rawBatteryLevel = dataView.getUint16(2, true); // Little-endian
        let batteryLevel = rawBatteryLevel / 10.0;
        ui.updateBattery(batteryLevel);
        console.log(`GET_BATTERY_LEVEL ${batteryLevel}`);
    } else if (packet.cmd == CommandNumber.REPORT_VERSION_INFO) {
        const { harvard, boylston } = parseVersionData(dataView);
        ui.updateDeviceVersion(harvard, boylston);
        console.log(`REPORT_VERSION_INFO harvard(${harvard}) boylston(${boylston})`);
    } else if (packet.cmd == CommandNumber.GET_HELLO_HARVARD) {
        let charging = dataView.getUint8(7) ? true : false;
        ui.updateChargingStatus(charging);

        let isWorn = dataView.getUint8(116) ? true : false;
        ui.updateWristStatus(isWorn);

        console.log(`GET_HELLO_HARVARD isWorn: ${isWorn}`);
    } else if (packet.cmd == CommandNumber.GET_CLOCK) {
        let unix = dataView.getUint32(2, true); // Little-endian
        ui.updateClock(unix);
        console.log(`GET_CLOCK unix: ${unix}`);
    }

    //console.log(`CMD Notification received: ${value.join(' ')}`);
}

/**
 * Handle incoming EVENTS notifications
 */
function handleEventsNotification(event) {
    const value = new Uint8Array(event.target.value.buffer);
    let packet = WhoopPacket.fromData(value);

    //console.log(`EVENT Notification received: ${value.join(' ')}`);

    if (packet.cmd == EventNumber.WRIST_OFF) {
        ui.updateWristStatus(false);
    } else if (packet.cmd == EventNumber.WRIST_ON) {
        ui.updateWristStatus(true);
    } else if (packet.cmd == EventNumber.CHARGING_OFF) {
        ui.updateChargingStatus(false);
    } else if (packet.cmd == EventNumber.CHARGING_ON) {
        ui.updateChargingStatus(true);
    } else if (packet.cmd == EventNumber.DOUBLE_TAP) {
        ui.showNotification("Double Tap Detected!");
    }
}

/**
 * Handle incoming DATA notifications
 */
function handleDataNotification(event) {
    const value = new Uint8Array(event.target.value.buffer);
    let packet = WhoopPacket.fromData(value);

    if (packet.type == PacketType.REALTIME_DATA) {
        // Get the heart rate and update the UI
        const heartRate = packet.data[5];
        ui.updateHeartRate(heartRate);
        
        // If packet is long enough, might contain temperature and SpO2
        // This is speculative based on bWanShiTong's findings
        if (packet.data.length > 10) {
            // Check if byte 11 might be temperature
            if (packet.data[11] > 0 && packet.data[11] < 50) {
                // Potentially temperature (needs verification)
                ui.updateTemperature(packet.data[11]);
            }
            
            // Check if byte 12 might be SpO2
            if (packet.data.length > 11 && packet.data[12] > 50 && packet.data[12] <= 100) {
                // Potentially SpO2 (needs verification)
                ui.updateSpO2(packet.data[12]);
            }
        }
    } else if (packet.type == PacketType.METADATA) {
        // Add to meta queue (needed for existing download functionality)
        metaQueue.enqueue(packet);
        
        // Also process with new enhanced handler
        processMetadataPacket(packet);
    } else if (packet.type == PacketType.HISTORICAL_DATA) {
        console.log(`historical data`);
        historicalDataLogger.streamData(value);
        
        // Also try to parse heart rate from historical data
        const heartRate = packet.data[5];
        console.log(`Historical heart rate: ${heartRate}`);
    } else if (packet.type == PacketType.CONSOLE_LOGS) {
        let message = processLogData(packet.data);
        ui.logToTerminal(message);
        // consoleLogger.streamData(log);
    }
}

function processLogData(data) {
    // Slice from index 7 to the second last element
    const slicedData = data.slice(7, data.length - 1);

    // Remove the invalid byte sequence `[0x34, 0x00, 0x01]` safely
    const cleanedData = [];
    for (let i = 0; i < slicedData.length; i++) {
        // Ensure we don't go out of bounds
        if (
            slicedData[i] === 0x34 &&
            slicedData[i + 1] === 0x00 &&
            slicedData[i + 2] === 0x01 &&
            i + 2 < slicedData.length
        ) {
            i += 2; // Skip the next two bytes safely
            console.log("removed bad");
        } else {
            cleanedData.push(slicedData[i]);
        }
    }

    // Convert the cleaned data back into a Uint8Array
    const cleanedUint8Array = new Uint8Array(cleanedData);

    // Decode the cleaned data to a string
    const decoder = new TextDecoder('utf-8');
    const decodedString = decoder.decode(cleanedUint8Array);

    return decodedString;
}

/**
 * GET_BATTERY_LEVEL command, will send response that gets updated in UI
 */
async function sendBatteryLevel() {
    if (!characteristics.cmdToStrap) {
        console.error(`error: please connect to the device first`);
        return;
    }

    try {
        let pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.GET_BATTERY_LEVEL, new Uint8Array([0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    } catch (error) {
        console.error(`error sending command: ${error.message}`);
    }
}

/**
 * Starts periodic battery level updates every 30 seconds if connected
 */
async function startBatteryUpdates() {
    if (device?.gatt?.connected) {
        await sendBatteryLevel();
        batteryInterval = setInterval(sendBatteryLevel, 30000);
        console.log(`battery updates started`);
    } else {
        console.error(`device not connected`);
    }
}

/**
 * Stops battery updates
 */
async function stopBatteryUpdates() {
    if (batteryInterval) {
        clearInterval(batteryInterval);
        batteryInterval = null;
        console.log(`battery updates stopped`);
    }
}

/**
 * This will actually stream download the history from your WHOOP
 */
async function downloadHistoryInternal() {
    // Start the process
    let pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.SEND_HISTORICAL_DATA, new Uint8Array([0x00])).framedPacket();
    await characteristics.cmdToStrap.writeValue(pkt);

    while (true) {
        let metapkt = await metaQueue.dequeue();

        // Get the first history end
        while (metapkt.cmd != MetadataType.HISTORY_END && metapkt.cmd != MetadataType.HISTORY_COMPLETE) {
            metapkt = await metaQueue.dequeue();
        }

        if (metapkt.cmd == MetadataType.HISTORY_COMPLETE) {
            console.log(`history complete`);
            break;
        }

        // Get the trim and construct new packet
        const dataView = new DataView(metapkt.data.buffer);
        const trim = dataView.getUint32(10, true); // Little-endian

        // Construct new packet data
        const responsePacket = new Uint8Array(9); // 1 (Byte) + 4 + 4 = 9 bytes
        const responseView = new DataView(responsePacket.buffer);
        responseView.setUint8(0, 1);                   // Byte set to 1
        responseView.setUint32(1, trim, true);         // Trim Value (4 bytes)
        responseView.setUint32(5, 0, true);            // Zero Padding (4 bytes)

        // Get the next batch
        pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.HISTORICAL_DATA_RESULT, responsePacket).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    }
}

/**
 * This will download the history from your WHOOP
 */
async function downloadHistory() {
    const downloadButton = document.getElementById("downloadButton");
    const loadingSpinner = document.getElementById("loadingSpinner");

    downloadButton.disabled = true;
    loadingSpinner.classList.remove("hidden");

    try {
        if(!await historicalDataLogger.openFileStream()) {
            throw "could not open file stream";
        }

        await downloadHistoryInternal();

        await historicalDataLogger.closeFileStream();

        ui.showNotification("History Download Success!");
    } catch (error) {
        ui.showNotification("History Download Error!");
        console.error(`error downloading history: ${error.message}`);
    } finally {
        loadingSpinner.classList.add("hidden");
        downloadButton.disabled = false;
    }
}

/**
 * REPORT_VERSION_INFO command, device version information
 */
async function sendReportVersion() {
    if (!device?.gatt?.connected) {
        console.error(`error: please connect to the device first`);
        return;
    }

    try {
        let pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.REPORT_VERSION_INFO, new Uint8Array([0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    } catch (error) {
        console.error(`error sending command: ${error.message}`);
    }
}

/**
 * GET_HELLO_HARVARD command, we get the on wrist status using this
 */
async function sendHelloHarvard() {
    if (!device?.gatt?.connected) {
        console.error(`error: please connect to the device first`);
        return;
    }

    try {
        let pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.GET_HELLO_HARVARD, new Uint8Array([0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    } catch (error) {
        console.error(`error sending command: ${error.message}`);
    }
}

/**
 * TOGGLE_REALTIME_HR command, will start real time if connected
 */
async function sendToggleRealtime() {
    if (!device?.gatt?.connected) {
        console.error(`please connect to the device first`);
        return;
    }

    isRealtimeActive = !isRealtimeActive; // Toggle the state
    ui.updateHeartStatus(isRealtimeActive);

    try {
        let pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.TOGGLE_REALTIME_HR, new Uint8Array([isRealtimeActive ? 0x01 : 0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    } catch (error) {
        console.error(`error sending command: ${error.message}`);
    }

}

/**
 * GET_CLOCK command, will update UI element with time value
 */
async function sendGetClock() {
    if (!device?.gatt?.connected) {
        console.error(`please connect to the device first`);
        return;
    }

    try {
        let pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.GET_CLOCK, new Uint8Array([0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    } catch (error) {
        console.error(`error sending command: ${error.message}`);
    }
}

/**
 * RUN_ALARM command
 */
async function sendAlarm() {
    if (!device?.gatt?.connected) {
        console.error(`please connect to the device first`);
        return;
    }

    try {
        let pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.RUN_ALARM, new Uint8Array([0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    } catch (error) {
        console.error(`error sending command: ${error.message}`);
    }

}

/**
 * RUN_HAPTICS_PATTERN command
 */
async function sendHaptics() {
    if (!device?.gatt?.connected) {
        console.error(`please connect to the device first`);
        return;
    }

    try {
        let pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.RUN_HAPTICS_PATTERN, new Uint8Array([0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    } catch (error) {
        console.error(`error sending command: ${error.message}`);
    }

}

/**
 * REBOOT_STRAP command
 */
async function sendReboot() {
    if (!device?.gatt?.connected) {
        console.error(`please connect to the device first`);
        return;
    }

    try {
        let pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.REBOOT_STRAP, new Uint8Array([0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    } catch (error) {
        console.error(`error sending command: ${error.message}`);
    }

}

const connectButton = document.getElementById('connectButton');
connectButton.addEventListener('click', async () => {
    if (connectButton.textContent.trim() === 'Connect WHOOP') {
        // Only if this is successful do we want to change over
        if (await connectToWhoop()) {
            connectButton.textContent = 'Disconnect';
            connectButton.classList.replace('bg-blue-500', 'bg-red-500');
            connectButton.classList.replace('hover:bg-blue-700', 'hover:bg-red-700');
        }
    } else {
        await disconnectFromWhoop();   
    }
});

document.getElementById('heartButton').addEventListener('click', sendToggleRealtime);
document.getElementById('downloadButton').addEventListener('click', downloadHistory);
document.getElementById('rawHistoryButton').addEventListener('click', sendRawHistoricalData);

document.getElementById('getClockButton').addEventListener('click', sendGetClock);
document.getElementById('alarmButton').addEventListener('click', sendAlarm);
document.getElementById('hapticsButton').addEventListener('click', sendHaptics);
document.getElementById('rebootButton').addEventListener('click', sendReboot);

document.getElementById('timeLimit').addEventListener('input', ui.updateTime);

window.addEventListener('DOMContentLoaded', (event) => {
    ui.createHeartRateChart();
});
