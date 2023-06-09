import { generateKeys, saveKeySetToStore, savePrivKeyToStorage, savePubKeyToStorage } from './pgp.mjs';
import {
    CANCEL_KEY_GENERATION_ID,
    CONFIRM_KEY_GENERATE_ID,
    CONFIRM_KEY_GENERATE_SELECTOR, EMAIL_INPUT_SELECTOR,
    GENERATE_KEYS_BUTTON_SELECTOR,
    KEY_GEN_GROUP_SELECTOR, MAIL_CREATE_PROGRESS_SELECTOR,
    NAME_INPUT_SELECTOR, PASS_INPUT_SELECTOR,
    MAIL_PROVIDER_CONTEXT_SELECTOR,
} from './selectors.mjs';
import { validateKeyGenInputValue } from './validators.mjs';
import { ValidatorInputs } from './validators.mjs';
import { Validators } from './validators.mjs';


const STORED_KEYS = {
    publicKey: '',
    privateKey: '',
};

let KEYGEN_DATA = {
    nameInput: '',
    emailInput: '',
    passwordInput: '',
};

function enableGenKeys() {
    document.querySelector(CONFIRM_KEY_GENERATE_SELECTOR).disabled = true;
    hideCreateKeysButton();
    document.querySelector(KEY_GEN_GROUP_SELECTOR).classList.remove('hidden');
}

function hideGenKeys() {
    document.querySelector(KEY_GEN_GROUP_SELECTOR).classList.add('hidden');
    enableCreateKeysButton();
}

function enableCreateKeysButton() {
    document.querySelector(GENERATE_KEYS_BUTTON_SELECTOR).classList.remove('hidden');
}

function hideCreateKeysButton() {
    document.querySelector(GENERATE_KEYS_BUTTON_SELECTOR).classList.add('hidden');
}


async function confirmKeyGeneration() {
    const name = KEYGEN_DATA.nameInput;
    const email = KEYGEN_DATA.emailInput;
    const password = KEYGEN_DATA.passwordInput;

    const { privateKey, publicKey } = await generateKeys(name, email, password);

    await savePrivKeyToStorage(privateKey);
    await savePubKeyToStorage(publicKey);

    const keySet = {
        name: name,
        email: email,
        privateKey: privateKey,
        publicKey: publicKey,
    };

    try {
        await saveKeySetToStore(keySet);
        document.querySelector('#successAlert').classList.remove('hidden');
        setTimeout(() => {
            document.querySelector('#successAlert').classList.add('hidden');
        }, 5000);
    } catch (e) {
        console.error(e);
        document.querySelector('#errorAlert').classList.remove('hidden');
        setTimeout(() => {
            document.querySelector('#errorAlert').classList.add('hidden');
        }, 5000);
    }

    // const hiddenElement = document.createElement('a');
    // hiddenElement.href = 'data:attachment/text,' + encodeURI(privateKey);
    // hiddenElement.target = '_blank';
    // hiddenElement.download = 'privateKey.priv';
    // // hiddenElement.click();
    // const hiddenElementPub = document.createElement('a');
    // hiddenElementPub.href = 'data:attachment/text,' + encodeURI(publicKey);
    // hiddenElementPub.target = '_blank';
    // hiddenElementPub.download = 'publicKey.pub';
    // // hiddenElementPub.click();
    // STORED_KEYS.privateKey = privateKey;
    // STORED_KEYS.publicKey = publicKey;
}

function listenForBlur() {
    document.querySelector(KEY_GEN_GROUP_SELECTOR).addEventListener(
        'blur',
        e => {
            const nameInput = document.querySelector(NAME_INPUT_SELECTOR);
            const passwordInput = document.querySelector(PASS_INPUT_SELECTOR);
            const emailInput = document.querySelector(EMAIL_INPUT_SELECTOR);

            const blurredElement = e.target;
            let validationResult = false;
            if (blurredElement.tagName === 'INPUT') {
                switch (blurredElement) {
                    case nameInput:
                        validationResult = validateKeyGenInputValue(
                            e.target.value,
                            ValidatorInputs.name,
                        );
                        break;
                    case passwordInput:
                        validationResult = validateKeyGenInputValue(
                            e.target.value,
                            ValidatorInputs.password,
                        );
                        break;
                    case emailInput:
                        validationResult = validateKeyGenInputValue(
                            e.target.value,
                            ValidatorInputs.email,
                        );
                        break;
                    default:
                        console.error(
                            'Validation not available for this input type, defaulting to false',
                        );
                        break;
                }
                if (validationResult) {
                    blurredElement.classList.remove('input-invalid');
                    blurredElement.classList.add('input-valid');
                    KEYGEN_DATA[e.target.id] = e.target.value;
                    checkConfirmButton();
                } else {
                    blurredElement.classList.remove('input-valid');
                    blurredElement.classList.add('input-invalid');
                }
            }
        },
        true,
    );
}

async function listenForClicks() {
    document.addEventListener('click', async e => {
        const clickedElement = e.target;
        if (clickedElement.tagName === 'BUTTON') {
            const buttonId = e.target.id;
            switch (buttonId) {
                case 'generateKeys':
                    enableGenKeys();
                    break;
                case CONFIRM_KEY_GENERATE_ID:
                    await confirmKeyGeneration();
                    break;
                case CANCEL_KEY_GENERATION_ID:
                    hideGenKeys();
                    break;
            }
        }
    });
}

function checkConfirmButton() {
    for (const prop in KEYGEN_DATA) {
        if (KEYGEN_DATA[prop] === '') {
            document.querySelector(CONFIRM_KEY_GENERATE_SELECTOR).disabled = true;
            return;
        }
    }
    document.querySelector(CONFIRM_KEY_GENERATE_SELECTOR).disabled = false;
}

browser.tabs
    .executeScript({ file: '/content_scripts/browserActions.mjs' })
    .then(() => {
        listenForBlur();
        listenForClicks();
    })
    .catch(e => {});

