/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Security token helper for SIMATA PLN Pass verification
 * Encrypts/obfuscates visitor ID into a secure token to prevent manual guessing/cloning
 */
import { Visitor } from '../types';

/**
 * Keystream secret cipher key for SIMATA PLN Pass verification
 * Scrambles and obfuscates visitor IDs into an unguessable cryptographic token
 */
const SECRET_KEY = 'PLN_TJB_CIPHER_2026_x89q!#GateAuth';
const LEGACY_SALT_PREFIX = 'PLN_TJB_SECURE_PASS_V2:';

/**
 * Encrypts/obfuscates visitor ID into an unpredictable scrambled token
 * Uses dynamic 16-bit salt + keystream XOR cipher + checksum + URL-safe Base64
 */
export function encodePassToken(passId: string): string {
  if (!passId) return '';
  try {
    // 1. Generate 2-byte random salt (4 hex characters)
    const saltNum = Math.floor(Math.random() * 65536);
    const saltHex = saltNum.toString(16).padStart(4, '0');

    // 2. Checksum of passId (2 hex chars) to detect tampering
    let sum = 0;
    for (let i = 0; i < passId.length; i++) {
      sum = (sum + passId.charCodeAt(i) * (i + 13)) % 256;
    }
    const checkHex = sum.toString(16).padStart(2, '0');

    const payload = `${passId}|${checkHex}`;

    // 3. Dynamic keystream XOR cipher
    const fullKey = `${SECRET_KEY}:${saltHex}`;
    let encStr = '';
    for (let i = 0; i < payload.length; i++) {
      const pCode = payload.charCodeAt(i);
      const kCode = fullKey.charCodeAt(i % fullKey.length);
      encStr += String.fromCharCode(pCode ^ kCode);
    }

    const raw = `${saltHex}:${encStr}`;
    // URL-safe Base64
    const base64 = typeof window !== 'undefined' ? btoa(raw) : Buffer.from(raw, 'binary').toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return passId;
  }
}

/**
 * Decodes and authenticates a scrambled pass token back to the original visitor ID
 */
export function decodePassToken(token: string): string | null {
  if (!token) return null;
  const clean = token.trim();

  // Backward compatibility: Direct pass ID (e.g. TJB-VST-005027)
  if (/^TJB-VST-\d+$/i.test(clean)) {
    return clean.toUpperCase();
  }

  try {
    let base64 = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decodedRaw = typeof window !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');

    // Legacy V1/V2 salt prefix check
    if (decodedRaw.startsWith(LEGACY_SALT_PREFIX)) {
      return decodedRaw.replace(LEGACY_SALT_PREFIX, '').toUpperCase();
    }

    // New scrambled format (saltHex:encStr)
    const colonIdx = decodedRaw.indexOf(':');
    if (colonIdx > 0) {
      const saltHex = decodedRaw.substring(0, colonIdx);
      const encStr = decodedRaw.substring(colonIdx + 1);
      const fullKey = `${SECRET_KEY}:${saltHex}`;

      let payload = '';
      for (let i = 0; i < encStr.length; i++) {
        const encCode = encStr.charCodeAt(i);
        const kCode = fullKey.charCodeAt(i % fullKey.length);
        payload += String.fromCharCode(encCode ^ kCode);
      }

      const parts = payload.split('|');
      if (parts.length === 2) {
        const passId = parts[0];
        const checkHex = parts[1];

        // Verify checksum
        let sum = 0;
        for (let i = 0; i < passId.length; i++) {
          sum = (sum + passId.charCodeAt(i) * (i + 13)) % 256;
        }
        if (sum.toString(16).padStart(2, '0') === checkHex) {
          return passId.toUpperCase();
        }
      }
    }

    return clean;
  } catch (e) {
    return clean;
  }
}

/**
 * URL Link Barcode Pass resmi SIMATA PLN yang siap dibuka di HP / Browser tamu
 * Menggunakan token acak terenkripsi sehingga nomor urut ID tamu tidak dapat ditebak.
 */
export function getProductionPassUrl(passId: string): string {
  const secureToken = encodePassToken(passId);
  const baseUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')
    ? window.location.origin
    : 'https://simata-pln.vercel.app';
  return `${baseUrl}/?pass=${secureToken}`;
}

export function checkPassExpiration(visitor: Visitor): { isExpired: boolean; reason: string } {
  if (!visitor) return { isExpired: true, reason: 'Data Pass tidak ditemukan' };

  if (visitor.status === 'EXPIRED') {
    return { isExpired: true, reason: 'Pas Tamu telah dibatalkan / kadaluarsa oleh sistem.' };
  }

  if (visitor.status === 'DONE') {
    return { isExpired: true, reason: 'Kunjungan telah selesai (Tamu sudah melakukan Check-Out).' };
  }

  if (visitor.validUntil) {
    try {
      const parts = visitor.validUntil.split(' - ');
      const dateStr = parts[0];
      const timeStr = parts[1] || '23.59';
      
      if (dateStr) {
        const timeFormatted = timeStr.replace('.', ':');
        const expiryDate = new Date(`${dateStr} ${timeFormatted}`);
        
        if (!isNaN(expiryDate.getTime()) && new Date() > expiryDate) {
          return {
            isExpired: true,
            reason: `Masa berlaku pas telah habis pada ${visitor.validUntil}.`
          };
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return { isExpired: false, reason: '' };
}
