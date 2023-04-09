import * as openpgp from '../modules/openpgp.min.mjs';
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
    encryptMessage, getLoadedKeyPassword
} from './pgp.mjs';
import {
    CANCEL_KEY_GENERATION_ID,
    CONFIRM_KEY_GENERATE_ID,
    LOADED_KEY_PASSWORD_SELECTOR,
    MAIL_CREATE_PROGRESS_SELECTOR,
    MAIL_PROVIDER_CONTEXT_SELECTOR,
    PRIV_KEY_GROUP_SELECTOR,
    PRIV_KEY_INPUT_SELECTOR,
    PUB_KEY_GROUP_SELECTOR,
    PUB_KEY_INPUT_SELECTOR, UPLOAD_PUB_KEY_ID, UPLOAD_PUB_KEY_SELECTOR,
} from './selectors.mjs';


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
    console.log(privateKey);
    getPrivKeyFromStorage;
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
    const privateKey = await getPrivKeyFromStorage();
    const publicKey = await getPubKeyFromStorage();
    const publicReceiverKey = await getReceiverPublicKey();
    let messageContents = '';
    const password = await getLoadedKeyPassword();
    browser.tabs
        .query({
            currentWindow: true,
            active: true,
        })
        .then(tabs => {
            console.log(tabs);
            for (const tab of tabs) {
                browser.tabs.sendMessage(tab.id, { operation: 'GET_CONTENT' });
            }
        });

    // console.log(messageContents);
    // console.log(encryptedMessage);
}

async function parsePubKey(value) {
    await savePubKeyToStorage(value);
}

async function parsePrivKey(value) {
    await savePrivKeyToStorage(value);
}

//TODO move to keygen
function listenForBlur() {
    console.log(PRIV_KEY_INPUT_SELECTOR);
    document.querySelector(PRIV_KEY_INPUT_SELECTOR).addEventListener('blur', e => {
        console.log('Setting blur 1');
        parsePrivKey(e.target.value);
        hidePrivKeyImport();
    });
    document.querySelector(PUB_KEY_INPUT_SELECTOR).addEventListener('blur', e => {
        console.log('Setting blur 2');
        parsePubKey(e.target.value);
        hidePubKeyImport();
    });
    document.querySelector(UPLOAD_PUB_KEY_SELECTOR).addEventListener('blur', e => {
        console.log('Setting blur 3');
        storeReceiverPublicKey(e.target.value);
    });
    document.querySelector(LOADED_KEY_PASSWORD_SELECTOR).addEventListener('blur', e => {
        console.log('Setting blur 4');
        storeLoadedKeyPassword(e.target.value);
    });
}

browser.tabs
    .executeScript({ file: '/content_scripts/browserActions.mjs' })
    .then(() => {
        console.log('executing');
        listenForBlur();
        listenForClicks();
        clearReceiverKeys();
    })
    .catch(e => {
        console.log('Error occured', e);
    });

browser.runtime.onMessage.addListener(async (request, sender, sendresponse) => {
    // browser.tabs.sendMessage({operation:"GET_CONTENT"}).then((value)=>{
    //     console.log(value);
    // })
    // console.log(request);
    const { dialogStatus, provider } = request;
    const { content } = request;
    if (dialogStatus && provider) {
        console.log(dialogStatus);
        console.log(provider);
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
        console.log('here should i be');
        //TODO improve key getting flow
        const privateKey = await getPrivKeyFromStorage();
        // console.log(privateKey);
        const publicKey = await getPubKeyFromStorage();
        // console.log(publicKey);

        const publicReceiverKey = await getReceiverPublicKey();

        // let messageContents = content;
        //
        // // const password = await getLoadedKeyPassword();
        // // console.log(password);
        //
        // console.log(publicReceiverKey);
        // console.log(privateKey.privateKey);
        // console.log(messageContents);
        try {
            console.log('Public receiver', publicReceiverKey);
            console.log('Private', privateKey);
            console.log('Public', publicKey);

            const encryptedMail = await encryptMessage(
                publicReceiverKey,
                privateKey.privateKey,
                'password',
                content,
            );

            console.log(encryptedMail);
            browser.tabs
                .query({
                    currentWindow: true,
                    active: true,
                })
                .then(tabs => {
                    console.log(tabs);
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


//PART FOR DECR
async function decrypt(encrypted, privateKey, passphrase) {
    const message = await openpgp.readMessage({
        armoredMessage: encrypted // parse armored message
    });

    const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: await openpgp.decryptKey({ privateKey: await openpgp.readKey({ armoredKey: privateKey }), passphrase: passphrase })
    });

    return decrypted;
}




async function decryptEmail() {
    const privateKey = await getPrivKeyFromStorage();
    const passphrase = await getLoadedKeyPassword();

    // Get the encrypted message from the content script
    browser.tabs
        .query({
            currentWindow: true,
            active: true,
        })
        .then(tabs => {
            for (const tab of tabs) {
                browser.tabs.sendMessage(tab.id, {
                    operation: 'GET_ENCRYPTED_MESSAGE',
                });
            }
        });
}



// Listen for the ENCRYPTED_MESSAGE operation
browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.operation === 'ENCRYPTED_MESSAGE') {
        const encryptedMessage = request.encryptedMessage;
        console.log('Extracted encrypted message:', encryptedMessage);

        // Continue with the decryption process using the encryptedMessage
        const privateKey = await getPrivKeyFromStorage();
        const passphrase = await getLoadedKeyPassword();
        const decryptedMessage = await decrypt(encryptedMessage, privateKey.privateKey, passphrase);
        console.log("decryptedMessage" + decryptedMessage)

        if (decryptedMessage) {
            console.log('Decrypted message:', decryptedMessage);
            // Update the message contents with the decrypted message
            browser.tabs
                .query({
                    currentWindow: true,
                    active: true,
                })
                .then(tabs => {
                    for (const tab of tabs) {
                        browser.tabs.sendMessage(tab.id, {
                            operation: 'SET_DECRYPTED_CONTENT',
                            decryptedMessage: decryptedMessage,
                        });
                    }
                });
        } else {
            console.error('Decryption failed.');
        }
    }
});


// function getMailContents() {
//     const mailContents = document.querySelectorAll("div[dir='ltr']");

//     for (const div of mailContents) {
//         if (div.innerHTML.includes("BEGIN PGP MESSAGE")) {
//             console.log(div.innerText);
//             return div.innerText;
//         }
//     }

//     return null;
    
    
// }








