# WHOOP Bluetooth Data Recording App

This folder contains a simple application for recording Bluetooth data from WHOOP devices. The app is based on bWanShiTong's approach for capturing WHOOP data packets.

## Overview

The Record App is designed to:
1. Scan for WHOOP devices nearby
2. Connect to a selected device
3. Subscribe to all characteristics
4. Record all data transmitted
5. Save the data for later analysis

## Requirements

- Python 3.7+
- Bleak library (for Bluetooth communication)
- PyQt5 (for the graphical interface)

## Installation

1. Make sure you have Python 3.7+ installed
2. Install required dependencies:
```bash
pip install bleak PyQt5
```

## Usage

To run the application:
```bash
python app.py
```

### Recording Data

1. Start the app
2. Click "Scan for Devices"
3. Select your WHOOP device from the list
4. Click "Connect"
5. Click "Start Recording"
6. Perform any actions on your WHOOP you want to record
7. Click "Stop Recording"
8. Data will be saved to a file with timestamp in the `recordings` folder

## File Structure

- `app.py` - Main application entry point
- `ble_scanner.py` - Module for scanning and connecting to Bluetooth devices
- `data_recorder.py` - Module for recording data from connected devices
- `ui/` - UI components and layout
- `recordings/` - Folder where recorded data is stored

## Packet Format

The recorded data is stored in raw binary format exactly as received from the WHOOP device. Each saved file also includes metadata about the connection and device.

## Analysis

After recording, you can use the `parse_pcap.py` script to analyze the recorded data:

```bash
python ../parse_pcap.py -f recordings/whoop_record_20230501_120000.bin
```

## Implementation Notes

This is a placeholder directory that needs to be implemented. The structure is based on bWanShiTong's approach, but the actual code needs to be developed.

To implement this app, we need to:

1. Create a BLE scanner that finds WHOOP devices
2. Implement connection handling for the WHOOP-specific services
3. Create data recording functionality
4. Build a simple UI
5. Implement data saving and export

## Contributions

Contributions to implement and improve this recording app are welcome! Please check the main project README for contribution guidelines.
