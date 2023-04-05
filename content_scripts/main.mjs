import {
    PRIVATE_KEY_STORAGE_KEY,
    PUBLIC_KEY_STORAGE_KEY,
    generateKeys,
    getPrivKeyFromStorage,
    getPubKeyFromStorage,
    savePrivKeyToStorage,
    savePubKeyToStorage,
} from './pgp.mjs';

const PUB_KEY_INPUT_ID = 'publicKeyInput';
const PUB_KEY_GROUP_ID = 'pubKeyGroup';
const PRIV_KEY_INPUT_ID = 'privateKeyInput';
const PRIV_KEY_GROUP_ID = 'privKeyGroup';
const PASS_INPUT_ID = 'passwordInput';
const PASS_GROUP_ID = 'passwordInputGroup';
const KEY_GEN_GROUP_ID = 'keyGenGroup';
const NAME_GROUP_ID = 'nameInputGroup';
const NAME_INPUT_ID = 'nameInput';
const EMAIL_GROUP_ID = 'emailInputGroup';
const EMAIL_INPUT_ID = 'emailInput';
const GENERATE_KEYS_BUTTON_ID = 'generateKeys';
const CANCEL_KEY_GENERATION_ID = 'cancelGeneration';
const CONFIRM_KEY_GENERATE_ID = 'generateConfirm';
const MAIL_PROVIDER_CONTEXT_ID = 'providerContext';
const MAIL_CREATE_PROGRESS_ID = 'createInProgress';
const IMPORT_KEYS_SECTION_ID = 'importSection';
const LOADED_KEY_PASSWORD_ID = 'loadedKeyPassword';

const PUB_KEY_GROUP_SELECTOR = `#${PUB_KEY_GROUP_ID}`;
const PUB_KEY_INPUT_SELECTOR = `#${PUB_KEY_INPUT_ID}`;
const PRIV_KEY_GROUP_SELECTOR = `#${PRIV_KEY_GROUP_ID}`;
const PRIV_KEY_INPUT_SELECTOR = `#${PRIV_KEY_INPUT_ID}`;
const PASS_GROUP_SELECTOR = `#${PASS_GROUP_ID}`;
const PASS_INPUT_SELECTOR = `#${PASS_INPUT_ID}`;
const NAME_GROUP_SELECTOR = `#${NAME_GROUP_ID}`;
const NAME_INPUT_SELECTOR = `#${NAME_INPUT_ID}`;
const EMAIL_INPUT_SELECTOR = `#${EMAIL_INPUT_ID}`;
const EMAIL_GROUP_SELECTOR = `#${EMAIL_GROUP_ID}`;
const KEY_GEN_GROUP_SELECTOR = `#${KEY_GEN_GROUP_ID}`;
const GENERATE_KEYS_BUTTON_SELECTOR = `#${GENERATE_KEYS_BUTTON_ID}`;
const CANCEL_KEY_GENERATION_SELECTOR = `#${CANCEL_KEY_GENERATION_ID}`;
const CONFIRM_KEY_GENERATE_SELECTOR = `#${CONFIRM_KEY_GENERATE_ID}`;
const MAIL_PROVIDER_CONTEXT_SELECTOR = `#${MAIL_PROVIDER_CONTEXT_ID}`;
const MAIL_CREATE_PROGRESS_SELECTOR = `#${MAIL_CREATE_PROGRESS_ID}`;
const IMPORT_KEYS_SECTION_SELECTOR = `#${IMPORT_KEYS_SECTION_ID}`;
const LOADED_KEY_PASSWORD_SELECTOR = `#${LOADED_KEY_PASSWORD_ID}`;

const STORED_KEYS = {
    publicKey: '',
    privateKey: '',
};

let KEYGEN_DATA = {
    nameInput: '',
    emailInput: '',
    passwordInput: '',
};

const ValidatorInputs = {
    name: 'NAME',
    email: 'EMAIL',
    password: 'PASSWORD',
};

const Validators = {
    NAME: value => value !== '',
    EMAIL: value => {
        const re =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(value);
    },
    PASSWORD: value => value !== '',
};

function validateKeyGenInputValue(value, type) {
    if (!Object.hasOwn(Validators, type)) {
        console.error('Validator not found for validator:', type);
        return false;
    }
    return Validators[type](value);
}

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
    document.querySelector(PUB_KEY_GROUP_SELECTOR).classList.add('hidden');
}

function hidePrivKeyImport() {
    document.querySelector(KEY_GEN_GROUP_SELECTOR).classList.add('hidden');
}

function enableGenKeys() {
    document.querySelector(CONFIRM_KEY_GENERATE_SELECTOR).disabled = true;
    hideCreateKeysButton();
    document.querySelector(KEY_GEN_GROUP_SELECTOR).classList.remove('hidden');
    document.querySelector(IMPORT_KEYS_SECTION_SELECTOR).classList.add('hidden');
}
function hideGenKeys() {
    document.querySelector(KEY_GEN_GROUP_SELECTOR).classList.add('hidden');
    document.querySelector(IMPORT_KEYS_SECTION_SELECTOR).classList.remove('hidden');
    enableCreateKeysButton();
}

function enableCreateKeysButton() {
    document.querySelector(GENERATE_KEYS_BUTTON_SELECTOR).classList.remove('hidden');
}
function hideCreateKeysButton() {
    document.querySelector(GENERATE_KEYS_BUTTON_SELECTOR).classList.add('hidden');
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

async function confirmKeyGeneration() {
    const name = KEYGEN_DATA.nameInput;
    const email = KEYGEN_DATA.emailInput;
    const password = KEYGEN_DATA.passwordInput;

    const { privateKey, publicKey } = await generateKeys(name, email, password);

    await savePrivKeyToStorage(privateKey);
    await savePubKeyToStorage(publicKey);

    const hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/text,' + encodeURI(privateKey);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'privateKey.priv';
    hiddenElement.click();
    const hiddenElementPub = document.createElement('a');
    hiddenElementPub.href = 'data:attachment/text,' + encodeURI(publicKey);
    hiddenElementPub.target = '_blank';
    hiddenElementPub.download = 'publicKey.pub';
    hiddenElementPub.click();
    STORED_KEYS.privateKey = privateKey;
    STORED_KEYS.publicKey = publicKey;
}
async function parsePubKey(value) {
    await savePubKeyToStorage(value);
    console.log('Public key saved in storage');
}
async function parsePrivKey(value) {
    await savePrivKeyToStorage(value);
    console.log('Private key saved in storage');
}

function listenForBlur() {
    document.querySelector(LOADED_KEY_PASSWORD_SELECTOR).addEventListener('blur', e => {
        parseLoadedPassword();
    });
    document.querySelector(PRIV_KEY_INPUT_SELECTOR).addEventListener('blur', e => {
        parsePrivKey(e.target.value);
        hidePrivKeyImport();
    });
    document.querySelector(PUB_KEY_INPUT_SELECTOR).addEventListener('blur', e => {
        parsePubKey(e.target.value);
        hidePubKeyImport();
    });
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
        console.log('executing');
        listenForBlur();
        listenForClicks();
    })
    .catch(e => {
        console.log('Error occured', e);
    });

browser.runtime.onMessage.addListener((request, sender, sendresponse) => {
    console.log('message received');
    console.log(request);
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
