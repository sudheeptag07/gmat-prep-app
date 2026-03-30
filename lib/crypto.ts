import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function getKey() {
  return createHash('sha256')
    .update(process.env.EMAIL_ENCRYPTION_KEY || process.env.DASHBOARD_PASSWORD || 'local-dev-cupi-key')
    .digest();
}

export function encryptValue(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptValue(value: string): string {
  if (!value.includes('.')) {
    return value;
  }

  try {
    const [ivText, tagText, encryptedText] = value.split('.');
    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivText, 'base64'));
    decipher.setAuthTag(Buffer.from(tagText, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedText, 'base64')),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  } catch {
    return value;
  }
}
