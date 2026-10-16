function obtenerCryptoSubtle(): SubtleCrypto {
  if (
    !('crypto' in window) ||
    typeof window.crypto === 'undefined' ||
    !('subtle' in window.crypto)
  ) {
    throw new Error('Web Crypto no está disponible en este navegador.');
  }
  return window.crypto.subtle;
}

export async function derivarClave(contrasena: string, sal: Uint8Array): Promise<CryptoKey> {
  const cryptoSubtle = obtenerCryptoSubtle();
  const materialBase = await cryptoSubtle.importKey(
    'raw',
    new TextEncoder().encode(contrasena),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return cryptoSubtle.deriveKey(
    { name: 'PBKDF2', salt: sal as any, iterations: 100000, hash: 'SHA-256' },
    materialBase,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function cifrarTexto(clave: CryptoKey, texto: string): Promise<{ cifrado: ArrayBuffer; iv: Uint8Array }> {
  const cryptoSubtle = obtenerCryptoSubtle();
  if (typeof window.crypto.getRandomValues !== 'function') {
    throw new Error('La generación segura de números aleatorios no está disponible.');
  }
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const datos = new TextEncoder().encode(texto);
  const cifrado = await cryptoSubtle.encrypt({ name: 'AES-GCM', iv: iv as any }, clave, datos);
  return { cifrado, iv };
}

export async function descifrarTexto(clave: CryptoKey, datosCifrados: { cifrado: ArrayBuffer; iv: Uint8Array }): Promise<string> {
  const datos = await obtenerCryptoSubtle().decrypt({ name: 'AES-GCM', iv: datosCifrados.iv as any }, clave, datosCifrados.cifrado);
  return new TextDecoder().decode(datos);
}