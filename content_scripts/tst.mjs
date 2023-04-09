import {
    PRIVATE_KEY_STORAGE_KEY,
    PUBLIC_KEY_STORAGE_KEY,
    generateKeys,
    getPrivKeyFromStorage,
    getPubKeyFromStorage,
    savePrivKeyToStorage,
    savePubKeyToStorage,
    storeReceiverPublicKey,
    getReceiverPublicKey,
    storeLoadedKeyPassword,
    clearReceiverKeys,
    encryptMessage, getLoadedKeyPassword,
} from './pgp.mjs';
import {
    PASS_INPUT_SELECTOR,
    CANCEL_KEY_GENERATION_ID,
    CONFIRM_KEY_GENERATE_ID,
    LOADED_KEY_PASSWORD_SELECTOR,
    MAIL_CREATE_PROGRESS_SELECTOR,
    MAIL_PROVIDER_CONTEXT_SELECTOR,
    PRIV_KEY_GROUP_SELECTOR,
    PRIV_KEY_INPUT_SELECTOR,
    PUB_KEY_GROUP_SELECTOR,
    PUB_KEY_INPUT_SELECTOR, RECEIVER_EMAIL_GROUP_ID, UPLOAD_PUB_KEY_ID,
    RECEIVER_NAME_EMAIL_SELECTOR,
    RECEIVER_NAME_INPUT_SELECTOR,
    UPLOAD_PUB_KEY_SELECTOR,
} from './selectors.mjs';
import { validateKeyGenInputValue, Validators } from './validators.mjs';

function storePassword(){
    document.querySelector(PASS_INPUT_SELECTOR).addEventListener('blur', e => {
        console.log(e.target.value);
        storeLoadedKeyPassword(e.target.value);
    });
}        storePassword();
