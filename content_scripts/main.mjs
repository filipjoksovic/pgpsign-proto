import {
    PRIVATE_KEY_STORAGE_KEY,
    PUBLIC_KEY_STORAGE_KEY,
    generateKeys,
    getPrivKeyFromStorage,
    getPubKeyFromStorage,
    savePrivKeyToStorage,
    savePubKeyToStorage, storeReceiverPublicKey, getReceiverPublicKey,
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

console.log("Here");
console.log(await getReceiverPublicKey());

async function enablePubKeyImport() {
    const publicKey = await getPubKeyFromStorage();
    if (publicKey) {
        document.querySelector(PUB_KEY_INPUT_SELECTOR).innerText =
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
        document.querySelector(PRIV_KEY_INPUT_SELECTOR).innerText =
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
            }
        }
    });
}

async function parsePubKey(value) {
    await savePubKeyToStorage(value);
}

async function parsePrivKey(value) {
    await savePrivKeyToStorage(value);
}


function listenForBlur() {
    // document.querySelector(LOADED_KEY_PASSWORD_SELECTOR).addEventListener('blur', e => {
    //     parseLoadedPassword();
    // });
    document.querySelector(PRIV_KEY_INPUT_SELECTOR).addEventListener('blur', e => {
        parsePrivKey(e.target.value);
        hidePrivKeyImport();
    });
    document.querySelector(PUB_KEY_INPUT_SELECTOR).addEventListener('blur', e => {
        parsePubKey(e.target.value);
        hidePubKeyImport();
    });

    document.querySelector(UPLOAD_PUB_KEY_SELECTOR).addEventListener("blur",e=>{
        storeReceiverPublicKey(e.target.value);
    })

}

function listenForUpload() {
    console.log("Setting listener");
    console.log(document.querySelector(UPLOAD_PUB_KEY_SELECTOR));
    document.querySelector(UPLOAD_PUB_KEY_SELECTOR).addEventListener('change', () => {
        console.log('File uploaded');
        const reader = new FileReader();
        let content = '';
        reader.onload = (e) => {

            content = e.target.result;
            console.log("Parsed content:",content);
            storeReceiverPublicKey(content);

        };
    });
}
browser.tabs
    .executeScript({ file: '/content_scripts/browserActions.mjs' })
    .then(() => {
        console.log('executing');
        listenForBlur();
        listenForClicks();
    })
    .catch(e => {
        console.log('Error occured', e);
    });

browser.runtime.onMessage.addListener((request, sender, sendresponse) => {
    const { dialogStatus, provider } = request;
    console.log(dialogStatus);
    console.log(provider);
    document.querySelector(MAIL_PROVIDER_CONTEXT_SELECTOR).innerText = `Mail provider: ${provider}`;
    document.querySelector(
        MAIL_CREATE_PROGRESS_SELECTOR,
    ).innerText = `Is writing email: ${dialogStatus}`;
    if (dialogStatus) {
        enableAppFunctionality();
    } else {
        disableAppFunctionality();
    }
});

function closeExtension() {
    console.log('Closing extension');
    window.close();
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
