#!/usr/bin/env python3
"""
Miscellaneous decoding and utility functions for WHOOP data analysis.
Based on information from bWanShiTong/reverse-engineering-whoop
"""

import struct
import zlib
import datetime
import pytz
from enum import Enum

# CRC8 lookup table for header checksum
CRC8_TABLE = [
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
]

def calculate_crc8(data):
    """Calculate CRC8 checksum for the given data bytes."""
    crc = 0
    for byte in data:
        crc = CRC8_TABLE[crc ^ byte]
    return crc

def calculate_crc32(data):
    """Calculate CRC32 checksum for the given data bytes."""
    return zlib.crc32(data) & 0xFFFFFFFF

def format_timestamp(unix_timestamp):
    """Format a Unix timestamp into a human-readable string with EST timezone."""
    dt = datetime.datetime.fromtimestamp(unix_timestamp)
    est_timezone = pytz.timezone("US/Eastern")
    dt_est = dt.astimezone(est_timezone)
    return dt_est.strftime('%Y-%m-%d %I:%M:%S %p')

def decode_heart_rate_packet(data):
    """Decode a heart rate packet from the WHOOP device."""
    if len(data) < 11:
        return None
    
    # Extract timestamp, subsecond, and heart rate
    unix, subsec, unk, heart_rate = struct.unpack("<LHLB", data[4:4 + 11])
    
    # Extract RR intervals if present
    rr_intervals = []
    if len(data) >= 16:
        rr_count = data[15]
        if rr_count > 0 and len(data) >= 16 + (rr_count * 2):
            for i in range(rr_count):
                rr = struct.unpack("<H", data[16 + (i * 2):16 + (i * 2) + 2])[0]
                rr_intervals.append(rr)
    
    return {
        'timestamp': unix,
        'formatted_time': format_timestamp(unix),
        'subsecond': subsec,
        'heart_rate': heart_rate,
        'rr_intervals': rr_intervals
    }

def decode_metadata_packet(data):
    """Decode a metadata packet from the WHOOP device."""
    if len(data) < 14:
        return None
    
    # Extract timestamp, subsecond, and trim value
    unix, subsec, unk, trim = struct.unpack("<LHLL", data[:14])
    
    return {
        'timestamp': unix,
        'formatted_time': format_timestamp(unix),
        'subsecond': subsec,
        'trim': trim
    }

def parse_whoop_packet(raw_data):
    """Parse a WHOOP packet and extract its components."""
    if len(raw_data) < 8:
        return None
    
    # Check SOF
    if raw_data[0] != 0xAA:
        return None
    
    # Extract length
    length = struct.unpack("<H", raw_data[1:3])[0]
    
    # Verify CRC8
    expected_crc8 = raw_data[3]
    calculated_crc8 = calculate_crc8(raw_data[1:3])
    if calculated_crc8 != expected_crc8:
        return None
    
    # Check packet length
    if len(raw_data) < length + 4:
        return None
    
    # Extract payload
    payload = raw_data[4:4 + length - 4]  # Subtract 4 for CRC32
    
    # Extract CRC32
    expected_crc32 = struct.unpack("<L", raw_data[4 + length - 4:4 + length])[0]
    calculated_crc32 = calculate_crc32(payload)
    if calculated_crc32 != expected_crc32:
        return None
    
    # Parse packet type, sequence, and command
    if len(payload) < 3:
        return None
    
    packet_type = payload[0]
    sequence = payload[1]
    command = payload[2]
    packet_data = payload[3:] if len(payload) > 3 else b''
    
    result = {
        'type': packet_type,
        'sequence': sequence,
        'command': command,
        'data': packet_data,
        'raw': raw_data,
        'payload': payload
    }
    
    # Add parsed data based on packet type
    if packet_type == 40:  # REALTIME_DATA
        result['parsed'] = decode_heart_rate_packet(payload)
    elif packet_type == 47:  # HISTORICAL_DATA
        result['parsed'] = decode_heart_rate_packet(payload)
    elif packet_type == 49:  # METADATA
        result['parsed'] = decode_metadata_packet(packet_data)
    
    return result

def create_whoop_packet(packet_type, sequence, command, data=b''):
    """Create a WHOOP packet with the specified components."""
    # Create payload
    payload = bytes([packet_type, sequence, command]) + data
    
    # Calculate CRC32
    crc32 = calculate_crc32(payload)
    
    # Calculate total length (payload + CRC32)
    length = len(payload) + 4
    length_bytes = struct.pack("<H", length)
    
    # Calculate CRC8 of length
    crc8 = calculate_crc8(length_bytes)
    
    # Assemble packet
    packet = b'\xAA' + length_bytes + bytes([crc8]) + payload + struct.pack("<L", crc32)
    
    return packet

def extract_heart_rate_series(packets):
    """Extract heart rate time series from a list of packets."""
    heart_rates = []
    
    for packet in packets:
        parsed = parse_whoop_packet(packet)
        if parsed and 'parsed' in parsed and parsed['parsed'] and 'heart_rate' in parsed['parsed']:
            heart_rates.append({
                'timestamp': parsed['parsed']['timestamp'],
                'formatted_time': parsed['parsed']['formatted_time'],
                'heart_rate': parsed['parsed']['heart_rate']
            })
    
    # Sort by timestamp
    heart_rates.sort(key=lambda x: x['timestamp'])
    
    return heart_rates

def extract_unique_commands(packets):
    """Extract unique commands from a list of packets."""
    commands = set()
    
    for packet in packets:
        parsed = parse_whoop_packet(packet)
        if parsed:
            cmd_key = f"{parsed['type']}-{parsed['command']}"
            commands.add(cmd_key)
    
    return commands
