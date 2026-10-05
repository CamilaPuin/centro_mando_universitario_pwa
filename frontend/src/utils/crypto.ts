export async function derivarClave(contrasena: string, sal: Uint8Array): Promise<CryptoKey> {
  const materialBase = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(contrasena),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: sal as any, iterations: 100000, hash: 'SHA-256' },
    materialBase,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function cifrarTexto(clave: CryptoKey, texto: string): Promise<{ cifrado: ArrayBuffer; iv: Uint8Array }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const datos = new TextEncoder().encode(texto);
  const cifrado = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as any }, clave, datos);
  return { cifrado, iv };
}

export async function descifrarTexto(clave: CryptoKey, datosCifrados: { cifrado: ArrayBuffer; iv: Uint8Array }): Promise<string> {
  const datos = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: datosCifrados.iv as any }, clave, datosCifrados.cifrado);
  return new TextDecoder().decode(datos);
}