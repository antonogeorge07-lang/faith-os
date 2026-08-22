const crypto = require('crypto');

class CryptoShredder {
  constructor() {
    // Subject ID -> AES-256-GCM Key (Buffer)
    this.keyStore = new Map();
    // Token ID -> { encryptedValue, iv, authTag, subjectId, createdAt }
    this.vault = new Map();
  }

  getOrCreateSubjectKey(subjectId) {
    if (!this.keyStore.has(subjectId)) {
      this.keyStore.set(subjectId, crypto.randomBytes(32));
    }
    return this.keyStore.get(subjectId);
  }

  tokenize(subjectId, rawPii, tokenType) {
    const key = this.getOrCreateSubjectKey(subjectId);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(rawPii, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    const tokenId = `FAITH_TOKEN_${tokenType.toUpperCase()}_${crypto.randomBytes(4).toString('hex')}`;
    
    this.vault.set(tokenId, {
      encryptedValue: encrypted,
      iv: iv.toString('hex'),
      authTag,
      subjectId,
      createdAt: new Date().toISOString()
    });

    return tokenId;
  }

  detokenize(tokenId) {
    const record = this.vault.get(tokenId);
    if (!record) return null;

    const key = this.keyStore.get(record.subjectId);
    if (!key) {
      // Key shredded or non-existent: Right-to-Erasure enforced
      return '[ERASED_GDPR_ART17]';
    }

    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(record.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(record.authTag, 'hex'));
      let decrypted = decipher.update(record.encryptedValue, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '[DECRYPTION_FAILED]';
    }
  }

  shredSubjectKey(subjectId) {
    if (this.keyStore.has(subjectId)) {
      // Overwrite memory before deletion
      const keyBuffer = this.keyStore.get(subjectId);
      keyBuffer.fill(0);
      this.keyStore.delete(subjectId);
      return { success: true, subjectId, status: 'KEY_SHREDDED' };
    }
    return { success: false, subjectId, status: 'KEY_NOT_FOUND' };
  }

  getVaultMetrics() {
    return {
      activeSubjects: this.keyStore.size,
      totalTokenMappings: this.vault.size
    };
  }
}

module.exports = new CryptoShredder();
