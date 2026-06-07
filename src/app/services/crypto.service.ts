import { Injectable } from '@angular/core';

/**
 * Cifrado AES-GCM 256 bits usando la Web Crypto API del navegador.
 *
 * La clave se deriva de una frase con PBKDF2 (100 000 iteraciones, SHA-256).
 * Se genera un IV aleatorio de 12 bytes por cada cifrado; los primeros 12 bytes
 * del base64 almacenado son siempre el IV, seguidos del texto cifrado.
 *
 * Consecuencia importante: dos documentos con las mismas respuestas producen
 * cadenas base64 distintas (IV diferente ⇒ cifrado diferente), por lo que no
 * es posible correlacionar pacientes comparando directamente el campo cifrado.
 */
@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private readonly KEY_PHRASE = 'bdi-bai-inventario-clinico-2025';
  private readonly SALT     = 'inventario-beck-salt-v1';
  private cachedKey: CryptoKey | null = null;
  private cachedHmacKey: CryptoKey | null = null;

  private async getKey(): Promise<CryptoKey> {
    if (this.cachedKey) { return this.cachedKey; }

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(this.KEY_PHRASE),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    this.cachedKey = await crypto.subtle.deriveKey(
      {
        name:       'PBKDF2',
        salt:       enc.encode(this.SALT),
        iterations: 100_000,
        hash:       'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return this.cachedKey;
  }

  /** Cifra cualquier valor serializable con JSON y devuelve una cadena base64. */
  async encryptJson<T>(value: T): Promise<string> {
    const key = await this.getKey();
    const iv  = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(JSON.stringify(value))
    );

    const combined = new Uint8Array(12 + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), 12);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Descifra una cadena base64 generada por `encryptJson`.
   * Devuelve `fallback` si el valor no puede descifrarse.
   */
  async decryptJson<T>(encoded: string, fallback: T): Promise<T> {
    try {
      const key      = await this.getKey();
      const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
      const iv         = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      return JSON.parse(new TextDecoder().decode(decrypted)) as T;
    } catch {
      return fallback;
    }
  }

  encryptResponses(responses: number[]): Promise<string> {
    return this.encryptJson(responses);
  }

  decryptResponses(encoded: string): Promise<number[]> {
    return this.decryptJson<number[]>(encoded, []);
  }

  private async getHmacKey(): Promise<CryptoKey> {
    if (this.cachedHmacKey) { return this.cachedHmacKey; }
    const enc = new TextEncoder();
    this.cachedHmacKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(this.KEY_PHRASE + ':hmac-v1'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return this.cachedHmacKey;
  }

  /**
   * HMAC-SHA256 determinista del valor normalizado (trim + lowercase), salida hex.
   * Usar para campos de búsqueda que deben ser consultables pero no legibles:
   * patientKey, codigoAcceso, psicologoEmail, email en psicólogos.
   */
  async hmac(value: string): Promise<string> {
    const key = await this.getHmacKey();
    const enc = new TextEncoder();
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value.trim().toLowerCase()));
    return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
