#!/usr/bin/env python3
"""
WHOOP Bluetooth HCI Log Parser
Based on information from bWanShiTong/reverse-engineering-whoop

This script parses Bluetooth HCI logs (in PCAP format) to extract and analyze
WHOOP-related Bluetooth traffic.
"""

import argparse
import sys
import os
import struct
import binascii
import re
from datetime import datetime

try:
    import pyshark
except ImportError:
    print("Error: This script requires pyshark. Install it with:")
    print("pip install pyshark")
    sys.exit(1)

# WHOOP Service and Characteristic UUIDs
WHOOP_SERVICE = "61080001-8d6d-82b8-614a-1c8cb0f8dcc6"
WHOOP_CHAR_CMD_TO_STRAP = "61080002-8d6d-82b8-614a-1c8cb0f8dcc6"
WHOOP_CHAR_CMD_FROM_STRAP = "61080003-8d6d-82b8-614a-1c8cb0f8dcc6"
WHOOP_CHAR_EVENTS_FROM_STRAP = "61080004-8d6d-82b8-614a-1c8cb0f8dcc6"
WHOOP_CHAR_DATA_FROM_STRAP = "61080005-8d6d-82b8-614a-1c8cb0f8dcc6"

# PacketType to string mapping
PACKET_TYPES = {
    35: "COMMAND",
    36: "COMMAND_RESPONSE",
    40: "REALTIME_DATA",
    47: "HISTORICAL_DATA",
    48: "EVENT",
    49: "METADATA",
    50: "CONSOLE_LOGS",
    51: "REALTIME_IMU_DATA_STREAM",
    52: "HISTORICAL_IMU_DATA_STREAM"
}

class WhoopLogParser:
    def __init__(self, pcap_file, output_dir=None, verbose=False):
        self.pcap_file = pcap_file
        self.verbose = verbose
        self.commands_to_strap = []
        self.commands_from_strap = []
        self.events_from_strap = []
        self.data_from_strap = []
        
        if output_dir:
            self.output_dir = output_dir
        else:
            # Create default output directory based on input filename
            base_name = os.path.basename(pcap_file)
            name_without_ext = os.path.splitext(base_name)[0]
            self.output_dir = f"{name_without_ext}_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Create output directory if it doesn't exist
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def parse(self):
        """Parse the PCAP file and extract WHOOP-related packets"""
        print(f"Parsing {self.pcap_file}...")
        
        try:
            # Using pyshark to parse the PCAP file
            cap = pyshark.FileCapture(self.pcap_file, display_filter="btatt")
            
            for packet_num, packet in enumerate(cap):
                try:
                    if hasattr(packet, 'btatt'):
                        self._process_btatt_packet(packet_num, packet)
                except Exception as e:
                    if self.verbose:
                        print(f"Error processing packet {packet_num}: {e}")
            
            # Save extracted data
            self._save_extracted_data()
            
            # Print summary
            self._print_summary()
            
        except Exception as e:
            print(f"Error parsing PCAP file: {e}")
    
    def _process_btatt_packet(self, packet_num, packet):
        """Process a BT ATT packet to extract WHOOP data"""
        if self.verbose:
            print(f"Processing packet {packet_num}")
        
        # Check for write requests (commands to strap)
        if hasattr(packet.btatt, 'opcode') and packet.btatt.opcode == '0x12':  # Write Request
            if hasattr(packet.btatt, 'handle') and hasattr(packet.btatt, 'value'):
                handle = packet.btatt.handle
                value = packet.btatt.value
                
                # Extract binary data
                try:
                    binary_data = binascii.unhexlify(value.replace(':', ''))
                    self.commands_to_strap.append({
                        'packet_num': packet_num,
                        'handle': handle,
                        'data': binary_data,
                        'hex': value
                    })
                    
                    if self.verbose:
                        print(f"Found command to strap: {value}")
                except:
                    pass
        
        # Check for notifications (data from strap)
        elif hasattr(packet.btatt, 'opcode') and packet.btatt.opcode == '0x1b':  # Handle Value Notification
            if hasattr(packet.btatt, 'handle') and hasattr(packet.btatt, 'value'):
                handle = packet.btatt.handle
                value = packet.btatt.value
                
                # Extract binary data
                try:
                    binary_data = binascii.unhexlify(value.replace(':', ''))
                    
                    # Categorize based on handle values (this would need actual handle values)
                    # For now, we'll just store and analyze later
                    self.data_from_strap.append({
                        'packet_num': packet_num,
                        'handle': handle,
                        'data': binary_data,
                        'hex': value
                    })
                    
                    if self.verbose:
                        print(f"Found data from strap: {value}")
                except:
                    pass
    
    def _parse_whoop_packet(self, data):
        """Parse a WHOOP packet and return its components"""
        # WHOOP packet structure: SOF(1) + Length(2) + CRC8(1) + Payload + CRC32(4)
        if len(data) < 8:
            return None
        
        # Check SOF
        sof = data[0]
        if sof != 0xAA:
            return None
        
        # Extract length
        length = struct.unpack("<H", data[1:3])[0]
        
        # Check if the packet is complete
        if len(data) < length + 4:
            return None
        
        # Extract payload
        payload = data[4:4+length-4]  # Subtract 4 for the CRC32
        
        # Parse packet type, sequence, and command
        if len(payload) >= 3:
            packet_type = payload[0]
            sequence = payload[1]
            command = payload[2]
            packet_data = payload[3:] if len(payload) > 3 else b''
            
            type_str = PACKET_TYPES.get(packet_type, f"UNKNOWN({packet_type})")
            
            return {
                'type': packet_type,
                'type_str': type_str,
                'sequence': sequence,
                'command': command,
                'data': packet_data,
                'raw': data,
                'payload': payload
            }
        
        return None
    
    def _save_extracted_data(self):
        """Save extracted data to files"""
        # Save commands to strap
        with open(os.path.join(self.output_dir, 'commands_to_strap.txt'), 'w') as f:
            for cmd in self.commands_to_strap:
                f.write(f"Packet {cmd['packet_num']}, Handle: {cmd['handle']}, Data: {cmd['hex']}\n")
                
                # Try to parse as WHOOP packet
                parsed = self._parse_whoop_packet(cmd['data'])
                if parsed:
                    f.write(f"  Parsed: Type={parsed['type_str']}, Seq={parsed['sequence']}, Cmd={parsed['command']}, Data={parsed['data'].hex()}\n\n")
                else:
                    f.write("\n")
        
        # Save data from strap
        with open(os.path.join(self.output_dir, 'data_from_strap.txt'), 'w') as f:
            for data in self.data_from_strap:
                f.write(f"Packet {data['packet_num']}, Handle: {data['handle']}, Data: {data['hex']}\n")
                
                # Try to parse as WHOOP packet
                parsed = self._parse_whoop_packet(data['data'])
                if parsed:
                    f.write(f"  Parsed: Type={parsed['type_str']}, Seq={parsed['sequence']}, Cmd={parsed['command']}, Data={parsed['data'].hex()}\n\n")
                else:
                    f.write("\n")
        
        # Save binary data for further analysis
        for i, cmd in enumerate(self.commands_to_strap):
            with open(os.path.join(self.output_dir, f'cmd_to_strap_{i}.bin'), 'wb') as f:
                f.write(cmd['data'])
        
        for i, data in enumerate(self.data_from_strap):
            with open(os.path.join(self.output_dir, f'data_from_strap_{i}.bin'), 'wb') as f:
                f.write(data['data'])
    
    def _print_summary(self):
        """Print a summary of the parsed data"""
        print("\n--- WHOOP Bluetooth Traffic Analysis Summary ---")
        print(f"Input file: {self.pcap_file}")
        print(f"Output directory: {self.output_dir}")
        print(f"Commands to strap: {len(self.commands_to_strap)}")
        print(f"Data from strap: {len(self.data_from_strap)}")
        print("------------------------------------------------")
        print(f"Analysis complete. Results saved to {self.output_dir}/")

def main():
    parser = argparse.ArgumentParser(description='Parse WHOOP Bluetooth HCI logs')
    parser.add_argument('-f', '--file', required=True, help='PCAP file to parse')
    parser.add_argument('-o', '--output', help='Output directory for analysis')
    parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose output')
    
    args = parser.parse_args()
    
    parser = WhoopLogParser(args.file, args.output, args.verbose)
    parser.parse()

if __name__ == "__main__":
    main()
