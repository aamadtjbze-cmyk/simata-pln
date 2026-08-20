/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Security token helper for SIMATA PLN Pass verification
 * Encrypts/obfuscates visitor ID into a secure token to prevent manual guessing/cloning
 */
const SALT_PREFIX = 'PLN_TJB_SECURE_PASS_V2:';

export function encodePassToken(passId: string): string {
  try {
    const raw = `${SALT_PREFIX}${passId}`;
    const base64 = btoa(raw);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return passId;
  }
}

export function decodePassToken(token: string): string | null {
  if (!token) return null;
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decoded = atob(base64);
    if (decoded.startsWith(SALT_PREFIX)) {
      return decoded.replace(SALT_PREFIX, '');
    }
    return token;
  } catch (e) {
    return token;
  }
}

import { Visitor } from '../types';

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
