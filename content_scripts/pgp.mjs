import * as openpgp from '../modules/openpgp.min.mjs';

export const PUBLIC_KEY_STORAGE_KEY = 'publicKey';
export const PRIVATE_KEY_STORAGE_KEY = 'privateKey';

export async function generateKeys(name, email, passphrase) {
    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{ name, email }],
        passphrase,
        format: 'armored',
    });

    return {
        privateKey: privateKey,
        publicKey: publicKey,
        revocationCertificate: revocationCertificate,
    };
}

export async function savePubKeyToStorage(pkStr) {
    const { publicKey } = await browser.storage.local.get(PUBLIC_KEY_STORAGE_KEY);
    if (publicKey === pkStr) {
        console.error('Not saving anything, keys are same');
    }
    await browser.storage.local.set({ publicKey: pkStr });
}
export async function getPubKeyFromStorage() {
    return await browser.storage.local.get(PUBLIC_KEY_STORAGE_KEY);
}
export async function savePrivKeyToStorage(pkStr) {
    const { privateKey } = await browser.storage.local.get(PRIVATE_KEY_STORAGE_KEY);
    if (privateKey === pkStr) {
        console.error('Not saving anything, keys are same');
    }
    console.log('Saving private', pkStr);
    await browser.storage.local.set({ privateKey: pkStr });
}
export async function getPrivKeyFromStorage() {
    return await browser.storage.local.get(PRIVATE_KEY_STORAGE_KEY);
}

export async function parsePublicKey(pkStr) {
    const parsedPublicKey = await openpgp.readKey({ armoredKey: publicKey });
    return parsedPublicKey;
}
export async function parsedPrivateKey(pkStr) {
    const parsedPrivateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase: password,
    });
    return parsedPrivateKey;
}
