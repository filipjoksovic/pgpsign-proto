import * as openpgp from '../modules/openpgp.min.mjs';
import { LOADED_KEY_PASSWORD_SELECTOR } from './selectors.mjs';

export const PUBLIC_KEY_STORAGE_KEY = 'publicKey';
export const PRIVATE_KEY_STORAGE_KEY = 'privateKey';
export const PUBLIC_KEYS_STORE = 'publicKeysStore';
export const LOADED_KEY_PASSWORD_STORE = 'loadedKeyPassword';

export const PERSONAL_KEYS_STORE = 'personalKeysStore';

export async function generateKeys(name, email, passphrase) {
    const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'rsa', // Type of the key
        rsaBits: 4096, // RSA key size (defaults to 4096 bits)
        userIDs: [{ name, email }], // you can pass multiple user IDs
        passphrase: passphrase, // protects the private key
    });

    return { privateKey, publicKey };
}

export async function getKeySetFromStore() {
    return await browser.storage.local.get(PERSONAL_KEYS_STORE);
}

export async function saveKeySetToStore(keySet) {
    let { personalKeysStore } = await getKeySetFromStore();
    if (!personalKeysStore) {
        personalKeysStore = [];
    }
    personalKeysStore.push(keySet);
    await browser.storage.local.set({ personalKeysStore: personalKeysStore });
}

export async function storeLoadedKeyPassword(value) {
    const { loadedKeyPassword } = await browser.storage.local.get(LOADED_KEY_PASSWORD_STORE);
    if (loadedKeyPassword === value) {
        console.error('Not saving anything, keys are same');
    }
    await browser.storage.local.set({ loadedKeyPassword: value });
}

export async function getLoadedKeyPassword() {
    return await browser.storage.local.get(LOADED_KEY_PASSWORD_SELECTOR).loadedKeyPassword;
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
    await browser.storage.local.set({ privateKey: pkStr });
}

export async function getPrivKeyFromStorage() {
    return await browser.storage.local.get(PRIVATE_KEY_STORAGE_KEY);
}

export async function storeReceiverPublicKey(keySet) {
    if (!keySet) {
        return;
    }
    let { publicKeysStore } = await browser.storage.local.get(PUBLIC_KEYS_STORE);
    if (!publicKeysStore) {
        publicKeysStore = [];
    }
    publicKeysStore.push(keySet);
    await browser.storage.local.set({ publicKeysStore: publicKeysStore });
}

export async function clearReceiverKeys() {
    await browser.storage.local.set({ publicKeyStore: [] });
}

export async function getReceiverPublicKey(id = 0) {
    let { publicKeysStore } = await browser.storage.local.get(PUBLIC_KEYS_STORE);
    if (publicKeysStore) {
        return publicKeysStore[1];
    }
    return null;
}

export async function getReceiverPublicKeys() {
    const { publicKeysStore } = await browser.storage.local.get(PUBLIC_KEYS_STORE);

    return publicKeysStore;
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

export const parsePrivateKey = async (pkStr, password) => {
    try {
        const parsedPrivateKey = await openpgp.decryptKey({
            privateKey: await openpgp.readPrivateKey({ armoredKey: pkStr }),
            passphrase: password,
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export async function encryptMessage(recepientPublic, privateKey, password, message) {
    message = message.replace('\n', '');

    try {
        const parsedPublicKey = await openpgp.readKey({ armoredKey: recepientPublic });
        const parsedPrivateKey = await openpgp.decryptKey({
            privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
            passphrase: password,
        });

        const encrypted = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: message }),
            encryptionKeys: parsedPublicKey,
            signingKeys: parsedPrivateKey,
        });
        return encrypted;
    } catch (e) {
        console.error(e);
    }
}

export async function decryptMessage(publicReceiverKey, privateKey, passphrase, encrypted) {
    if (!encrypted) {
        return;
    }
    try {
        const message = await openpgp.readMessage({
            armoredMessage: encrypted, // parse armored message
        });

        const { data: decrypted } = await openpgp.decrypt({
            message,
            verificationKeys: await openpgp.readKey({ armoredKey: publicReceiverKey }), // optional
            decryptionKeys: await openpgp.decryptKey({
                privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
                passphrase: passphrase,
            }),
        });
        return decrypted;
    } catch (e) {
        console.error(e);
    }
    // check signature validity (signed messages only)
    //        try {
    //            await signatures[0].verified; // throws on invalid signature
    //        } catch (e) {
    //            throw new Error('Signature could not be verified: ' + e.message);
    //        }
}
