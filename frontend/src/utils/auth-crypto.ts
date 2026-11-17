const PBKDF2_ITERATIONS = 310_000;

function subtleCrypto(): SubtleCrypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error('El navegador no permite verificar credenciales de forma segura.');
  }
  return globalThis.crypto.subtle;
}

function randomBytes(length: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}

async function deriveVerifier(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const subtle = subtleCrypto();
  const material = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await subtle.deriveBits({
    name: 'PBKDF2',
    salt: new Uint8Array(salt).buffer as ArrayBuffer,
    iterations: PBKDF2_ITERATIONS,
    hash: 'SHA-256'
  }, material, 256);
  return new Uint8Array(bits);
}

export async function crearCredencialLocal(password: string): Promise<{
  salt: Uint8Array;
  verifier: Uint8Array;
  passwordKey: CryptoKey;
  passwordIv: Uint8Array;
  encryptedPassword: ArrayBuffer;
}> {
  const subtle = subtleCrypto();
  const salt = randomBytes(16);
  const verifier = await deriveVerifier(password, salt);
  const passwordKey = await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const passwordIv = randomBytes(12);
  const encryptedPassword = await subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(passwordIv).buffer as ArrayBuffer },
    passwordKey,
    new TextEncoder().encode(password)
  );
  return { salt, verifier, passwordKey, passwordIv, encryptedPassword };
}

export async function verificarCredencialLocal(
  password: string,
  salt: Uint8Array,
  expectedVerifier: Uint8Array
): Promise<boolean> {
  const actual = await deriveVerifier(password, salt);
  if (actual.length !== expectedVerifier.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expectedVerifier[index];
  }
  return difference === 0;
}

export async function descifrarContrasenaLocal(input: {
  passwordKey: CryptoKey;
  passwordIv: Uint8Array;
  encryptedPassword: ArrayBuffer;
}): Promise<string> {
  const plainText = await subtleCrypto().decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(input.passwordIv).buffer as ArrayBuffer },
    input.passwordKey,
    input.encryptedPassword
  );
  return new TextDecoder().decode(plainText);
}
