import * as openpgp from '../modules/openpgp.min.mjs';
import { LOADED_KEY_PASSWORD_SELECTOR } from './selectors.mjs';

export const PUBLIC_KEY_STORAGE_KEY = 'publicKey';
export const PRIVATE_KEY_STORAGE_KEY = 'privateKey';
export const PUBLIC_KEYS_STORE = 'publicKeysStore';
export const LOADED_KEY_PASSWORD_STORE = 'loadedKeyPassword';

export const PERSONAL_KEYS_STORE = "personalKeysStore";


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

export async function getKeySetFromStore(){
    return await browser.storage.local.get(PERSONAL_KEYS_STORE);
}
export async function saveKeySetToStore(keySet){
    let {personalKeysStore} = await getKeySetFromStore();
    if(!personalKeysStore){
        personalKeysStore = [];
    }
    personalKeysStore.push(keySet);
    await browser.storage.local.set({personalKeysStore:personalKeysStore});
}

export async function storeLoadedKeyPassword(value) {
    const { loadedKeyPassword } = await browser.storage.local.get(LOADED_KEY_PASSWORD_STORE);
    if (loadedKeyPassword === value) {
        console.error('Not saving anything, keys are same');
    }
    await browser.storage.local.set({ loadedKeyPassword: value });
}

export async function getLoadedKeyPassword(){
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
    // return await browser.storage.local.get(PUBLIC_KEYS_STORE)
    //TODO fix bugs possible store implementation
    let { publicKeysStore } = await browser.storage.local.get(PUBLIC_KEYS_STORE);
    if (publicKeysStore) {
        return publicKeysStore[1];
    }
    return null;
}
export async function getReceiverPublicKeys(){
    const {publicKeysStore} = await browser.storage.local.get(PUBLIC_KEYS_STORE);

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

export async function encryptMessage(publicKey, privateKey, password, message) {
    try{
        const parsedPublicKey = await openpgp.readKey({ armoredKey: publicKey });
        const parsedPrivateKey = await openpgp.decryptKey({
            privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
            passphrase: password,
        });

        const encrypted = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: message }),
            encryptionKeys: parsedPublicKey,
            signingKeys: parsedPrivateKey,
        });
        const encryptedMessage = await openpgp.readMessage({
            armoredMessage: encrypted,
        });
        return encrypted;
        
    }
    catch (e){
        console.error(e);
    }

}

//nesto
