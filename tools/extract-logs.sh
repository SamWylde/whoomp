#!/bin/bash
# Script to extract Bluetooth logs from Android devices using ADB
# Based on bWanShiTong/reverse-engineering-whoop

# Check if adb is installed
if ! command -v adb &> /dev/null; then
    echo "Error: adb is not installed. Please install Android Debug Bridge."
    exit 1
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "Error: No Android device connected or device not authorized."
    echo "Please connect a device and enable USB debugging."
    exit 1
fi

# Check if btsnoop_hci.log exists
echo "Checking for Bluetooth HCI log file..."
if ! adb shell "ls /sdcard/btsnoop_hci.log" &> /dev/null; then
    echo "Warning: Bluetooth HCI log file not found."
    echo "Make sure Bluetooth HCI logging is enabled in Developer Options."
    echo "Trying to enable it now..."
    
    # Try to enable Bluetooth HCI logging
    adb shell settings put secure bluetooth_hci_log 1
    echo "Please restart Bluetooth on your device and try again."
    exit 1
fi

# Create output directory
OUTPUT_DIR="whoop_logs_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUTPUT_DIR"
echo "Created output directory: $OUTPUT_DIR"

# Pull btsnoop_hci.log file
echo "Pulling Bluetooth HCI log file..."
adb pull /sdcard/btsnoop_hci.log "$OUTPUT_DIR/"

# Check if the file was successfully pulled
if [ $? -ne 0 ]; then
    echo "Error: Failed to pull Bluetooth HCI log file."
    exit 1
fi

echo "Log file pulled successfully to $OUTPUT_DIR/btsnoop_hci.log"

# Rename the file on the device to avoid it getting too large
echo "Renaming log file on device to start fresh..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
adb shell "mv /sdcard/btsnoop_hci.log /sdcard/btsnoop_hci_$TIMESTAMP.log"

echo "Done! You can now analyze the log file with parse_pcap.py:"
echo "python parse_pcap.py -f $OUTPUT_DIR/btsnoop_hci.log"

exit 0
