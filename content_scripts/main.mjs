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
    encryptMessage, getLoadedKeyPassword, getKeySetFromStore, getReceiverPublicKeys,
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
    PUB_KEY_INPUT_SELECTOR,
    RECEIVER_EMAIL_GROUP_ID,
    UPLOAD_PUB_KEY_ID,
    RECEIVER_NAME_EMAIL_SELECTOR,
    RECEIVER_NAME_INPUT_SELECTOR,
    UPLOAD_PUB_KEY_SELECTOR,
    KEY_SET_SELECTOR_SELECTOR,
    USE_EXISTING_KEYS_ID,
    USE_EXISTING_KEYS_SELECTOR,
    ADD_NEW_RECEIVER_KEYS_SELECTOR, USE_EXISTING_RECEIVER_KEYS_SELECTOR, EXISTING_KEYS_SELECTOR_SELECTOR,
} from './selectors.mjs';
import { validateKeyGenInputValue, Validators } from './validators.mjs';

let selectedKeyId = -1;
let selectedReceiverKeyId = -1;

async function enablePubKeyImport() {
    const publicKey = await getPubKeyFromStorage();
    if (publicKey) {
        document.querySelector(PUB_KEY_INPUT_SELECTOR).innerHTML =
            publicKey[PUBLIC_KEY_STORAGE_KEY];
    }
    document.querySelector(PUB_KEY_GROUP_SELECTOR).classList.remove('hidden');
    document.querySelector(PUB_KEY_INPUT_SELECTOR).focus();
}

async function enablePrivKeyImport() {
    const privateKey = await getPrivKeyFromStorage();
    if (privateKey) {
        document.querySelector(PRIV_KEY_INPUT_SELECTOR).innerHTML =
            privateKey[PRIVATE_KEY_STORAGE_KEY];
    }
    document.querySelector(PRIV_KEY_GROUP_SELECTOR).classList.remove('hidden');
    document.querySelector(PRIV_KEY_INPUT_SELECTOR).focus();
}

function hidePubKeyImport() {
    // document.querySelector(PUB_KEY_GROUP_SELECTOR).classList.add('hidden');
}

function hidePrivKeyImport() {
    // document.querySelector(KEY_GEN_GROUP_SELECTOR).classList.add('hidden');
}

async function listenForClicks() {
    document.addEventListener('click', async e => {
        const clickedElement = e.target;
        if (clickedElement.tagName === 'BUTTON') {
            const buttonId = e.target.id;
            switch (buttonId) {
                case 'importPublicKey':
                    enablePubKeyImport();
                    break;
                case 'importPrivateKey':
                    enablePrivKeyImport();
                    break;
                case 'encryptEmail':
                    await encryptEmail();
                    break;
                case 'decryptEmail':
                    await decryptEmail(); // nzm dal je dobro
                    break;
            }
        }
    });
}

async function encryptEmail() {
    browser.tabs
        .query({
            currentWindow: true,
            active: true,
        })
        .then(tabs => {
            for (const tab of tabs) {
                browser.tabs.sendMessage(tab.id, { operation: 'GET_CONTENT' });
            }
        });
}

async function parsePubKey(value) {
    await savePubKeyToStorage(value);
}

async function parsePrivKey(value) {
    await savePrivKeyToStorage(value);
}

function storePassword(){
    document.querySelector(PASS_INPUT_SELECTOR).addEventListener('blur', e => {
        console.log(e.target.value);
        storeLoadedKeyPassword(e.target.value);
    });
}       //  storePassword();


//TODO move to keygen
function listenForBlur() {
    document.querySelector(PRIV_KEY_INPUT_SELECTOR).addEventListener('blur', e => {
        parsePrivKey(e.target.value);
        hidePrivKeyImport();
    });
    document.querySelector(PUB_KEY_INPUT_SELECTOR).addEventListener('blur', e => {
        parsePubKey(e.target.value);
        hidePubKeyImport();
    });
    document.querySelector(UPLOAD_PUB_KEY_SELECTOR).addEventListener('blur', e => {
//        storeReceiverPublicKey(e.target.value);
    });
  //  document.querySelector(LOADED_KEY_PASSWORD_SELECTOR).addEventListener('blur', e => {
    //    console.log('Setting blur 4');
    //    storeLoadedKeyPassword(e.target.value);
    //});
        console.log("HERE")
    //NEW blurs
    document.querySelector(RECEIVER_NAME_INPUT_SELECTOR).addEventListener('blur', e => {
        if (Validators['RECEIVER_NAME'](e.target.value)) {
            document.querySelector(RECEIVER_NAME_INPUT_SELECTOR).classList.add('input-valid');
            document.querySelector(RECEIVER_NAME_INPUT_SELECTOR).classList.remove('input-invalid');
            tryToSaveReceiverKeySet();

        } else {
            document.querySelector(RECEIVER_NAME_INPUT_SELECTOR).classList.remove('input-valid');
            document.querySelector(RECEIVER_NAME_INPUT_SELECTOR).classList.add('input-invalid');
        }
    });
    document.querySelector(RECEIVER_NAME_EMAIL_SELECTOR).addEventListener('blur', e => {
        if (Validators['RECEIVER_EMAIL'](e.target.value)) {
            document.querySelector(RECEIVER_NAME_EMAIL_SELECTOR).classList.add('input-valid');
            document.querySelector(RECEIVER_NAME_EMAIL_SELECTOR).classList.remove('input-invalid');
        } else {
            document.querySelector(RECEIVER_NAME_EMAIL_SELECTOR).classList.remove('input-valid');
            document.querySelector(RECEIVER_NAME_EMAIL_SELECTOR).classList.add('input-invalid');
        }
    });
    document.querySelector(UPLOAD_PUB_KEY_SELECTOR).addEventListener('blur', e => {
        if (Validators['RECEIVER_KEY'](e.target.value)) {
            document.querySelector(UPLOAD_PUB_KEY_SELECTOR).classList.add('input-valid');
            document.querySelector(UPLOAD_PUB_KEY_SELECTOR).classList.remove('input-invalid');
            tryToSaveReceiverKeySet();
        } else {
            document.querySelector(UPLOAD_PUB_KEY_SELECTOR).classList.remove('input-valid');
            document.querySelector(UPLOAD_PUB_KEY_SELECTOR).classList.add('input-invalid');
        }
    });
    document.querySelector(USE_EXISTING_KEYS_SELECTOR).addEventListener('change', e => {
        const isChecked = e.target.checked;
        handleReceiverKeysSection(isChecked);
    });
}

export function handleReceiverKeysSection(selectActive) {
    if (selectActive) {
        document.querySelector(ADD_NEW_RECEIVER_KEYS_SELECTOR).classList.add('hidden');
        document.querySelector(USE_EXISTING_RECEIVER_KEYS_SELECTOR).classList.remove('hidden');
    } else {
        document.querySelector(ADD_NEW_RECEIVER_KEYS_SELECTOR).classList.remove('hidden');
        document.querySelector(USE_EXISTING_RECEIVER_KEYS_SELECTOR).classList.add('hidden');
    }
}

export function tryToSaveReceiverKeySet() {
    const name = document.querySelector(RECEIVER_NAME_INPUT_SELECTOR).value;
    const email = document.querySelector(RECEIVER_NAME_EMAIL_SELECTOR).value;
    const key = document.querySelector(UPLOAD_PUB_KEY_SELECTOR).value;

    if (Validators['RECEIVER_NAME'](name) && Validators['RECEIVER_EMAIL'](email) && Validators['RECEIVER_KEY'](key)) {
        const keySet = {
            name: name,
            email: email,
            publicKey: key,
        };
        storeReceiverPublicKey(keySet);
    }


}

export async function populateReceiverKeySelector() {
    const keys = await getReceiverPublicKeys();
    document.querySelector(EXISTING_KEYS_SELECTOR_SELECTOR).addEventListener('blur', e => {
        selectedReceiverKeyId = e.target.value;
    });
    keys.forEach((key, index) => {
        const element = document.createElement('option');
        element.setAttribute('id', index);
        element.innerText = `${key.name} (${key.email})`;
        document.querySelector(EXISTING_KEYS_SELECTOR_SELECTOR).append(element);
    });
}

export async function populateKeySelector() {
    const { personalKeysStore } = await getKeySetFromStore();
    document.querySelector(KEY_SET_SELECTOR_SELECTOR).addEventListener('blur', e => {
        selectedKeyId = e.target.value;
    });
    personalKeysStore.forEach((key, index) => {
        const element = document.createElement('option');
        element.setAttribute('id', index);
        element.innerText = `${key.name} (${key.email})`;
        document.querySelector(KEY_SET_SELECTOR_SELECTOR).append(element);
    });
}

browser.tabs
    .executeScript({ file: '/content_scripts/browserActions.mjs' })
    .then(() => {
        browser.tabs
            .query({
                currentWindow: true,
                active: true,
            })
            .then(tabs => {
                console.log("Sending message about provider");
                for (const tab of tabs) {
                    browser.tabs.sendMessage(tab.id, { operation: 'GET_PROVIDER' });
                }
            });
        populateKeySelector();
        populateReceiverKeySelector();
        listenForBlur();
        listenForClicks();
        clearReceiverKeys();

    })
    .catch(e => {
        console.log('Error occured', e);
    });

browser.runtime.onMessage.addListener(async (request, sender, sendresponse) => {
    const { dialogStatus, provider } = request;
    const { content } = request;
    if (dialogStatus && provider) {
        document.querySelector(
            MAIL_PROVIDER_CONTEXT_SELECTOR,
        ).innerText = `Mail provider: ${provider}`;
        document.querySelector(
            MAIL_CREATE_PROGRESS_SELECTOR,
        ).innerText = `Is writing email: ${dialogStatus}`;
        if (dialogStatus) {
            enableAppFunctionality();
        } else {
            disableAppFunctionality();
        }
        return;
    }
    if (content) {
        const personal = await getSelectedKeySet(selectedKeyId);
        const personalPrivateKey = personal.privateKey;
        const receiver = await getSelectedReceiverKeySet(selectedReceiverKeyId); //await getReceiverPublicKey();
        const receiverPublicKey = receiver.publicKey;
        try {
            const encryptedMail = await encryptMessage(
                receiverPublicKey,
                personalPrivateKey,
                'password',
                content,
            );

            browser.tabs
                .query({
                    currentWindow: true,
                    active: true,
                })
                .then(tabs => {
                    for (const tab of tabs) {
                        browser.tabs.sendMessage(tab.id, {
                            operation: 'SET_CONTENT',
                            content: encryptedMail,
                        });
                    }
                });
        } catch (e) {
            console.error(e);
        }
    }
});

export async function getSelectedKeySet(selectedId = 0) {
    if (selectedId < 0) {
        selectedId = 0;
    }
    const { personalKeysStore } = await getKeySetFromStore();
    return personalKeysStore[selectedId];
}

export async function getSelectedReceiverKeySet(selectedId = 0) {
    if (selectedId < 0) {
        selectedId = 0;
    }
    const storedReceivers = await getReceiverPublicKeys();
    return storedReceivers[selectedId];
}

function enableAppFunctionality() {
    document.querySelector('body').classList.add('active');
    document.querySelector('body').classList.remove('inactive');
    document.querySelector('html').classList.add('active');
    document.querySelector('html').classList.remove('inactive');
    document.querySelector('#content-wrapper').classList.remove('hidden');
}

function disableAppFunctionality() {
    document.querySelector('body').classList.remove('active');
    document.querySelector('body').classList.add('inactive');
    document.querySelector('html').classList.remove('active');
    document.querySelector('html').classList.add('inactive');
    document.querySelector('#content-wrapper').classList.add('hidden');
}


// //PART FOR DECR
// async function decryptEmail() {
//     const privateKey = await getPrivKeyFromStorage();
//     const passphrase = await getLoadedKeyPassword();
//     // const encryptedMessage = /* Get the encrypted message from the user */;

//     const decryptedMessage = await decryptMessage(encryptedMessage, privateKey.privateKey, passphrase);

//     if (decryptedMessage) {
//         console.log('Decrypted message:', decryptedMessage);
//         // Update the message contents with the decrypted message
//     } else {
//         console.error('Decryption failed.');
//     }
// }



