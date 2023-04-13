import {
    decryptMessage,
    getKeySetFromStore,
    getReceiverPublicKeys,
    getUserFromSignature,
} from './pgp.mjs';
import { PUBLIC_KEY_SELECTOR_SELECTOR } from './selectors.mjs';

let encrypted_message = '';
let inputted_password = '';
browser.tabs
    .executeScript({ file: '/content_scripts/browserActions.mjs' })
    .then(() => {
        browser.tabs
            .query({
                currentWindow: true,
                active: true,
            })
            .then(tabs => {
                console.log('Sending message about provider');
                for (const tab of tabs) {
                    browser.tabs.sendMessage(tab.id, { operation: 'GET_ENCRYPTED_CONTENT' });
                }
            });
        loadKeys();
        listenForChanges();
        listenForBlur();
    })
    .catch(e => {
        console.log('Error occured', e);
    });

export async function listenForChanges() {
    document.querySelector(PUBLIC_KEY_SELECTOR_SELECTOR).addEventListener('change', async e => {
        const selectedKey = e.target.value;
        const privateKey = (await getKeySetFromStore()).personalKeysStore[selectedKey].privateKey;
        console.log(privateKey);
    });
}

export async function listenForBlur() {
    document.querySelector('#publicKeyPasswordInput').addEventListener('blur', async e => {
        inputted_password = e.target.value;
    });
    document.querySelector('#decryptContent').addEventListener('click', async e => {
        const selectedKey = document.querySelector(PUBLIC_KEY_SELECTOR_SELECTOR).value;
        const privateKey = (await getKeySetFromStore()).personalKeysStore[selectedKey].privateKey;
        const publicKey = (await getReceiverPublicKeys())[0].publicKey;
        inputted_password = document.querySelector('#publicKeyPasswordInput').value;
        decryptContent(publicKey, privateKey, inputted_password);
    });
}

export async function loadKeys() {
    const { personalKeysStore } = await getKeySetFromStore();
    const select = document.querySelector(PUBLIC_KEY_SELECTOR_SELECTOR);
    //remove all children
    while (select.firstChild) {
        select.removeChild(select.firstChild);
    }

    let counter = 0;
    for (const key of personalKeysStore) {
        const option = document.createElement('option');
        option.value = counter;
        option.text = key.name + ' ' + key.email;
        select.appendChild(option);
        counter++;
    }
}

export async function decryptContent(publicKey, privateKey, password) {
    let decrypted = await decryptMessage(publicKey, privateKey, password, encrypted_message);
    console.log(decrypted);
    const user = await getUserFromSignature(publicKey);
    console.log(user);
    //replace \n with <br> and remove " from string
    decrypted = decrypted.replace(/\\n/g, '<br>');
    decrypted = decrypted.replace(/"/g, '');
    decrypted += '<br>';
    decrypted += '<h3>Signed by</h3>';
    decrypted += '<p>' + user.name + ' (' + user.email + ')</p>';

    if (decrypted) {
        browser.tabs
            .query({
                currentWindow: true,
                active: true,
            })
            .then(tabs => {
                console.log('Sending decr message');
                console.log(decrypted);
                for (const tab of tabs) {
                    browser.tabs.sendMessage(tab.id, {
                        operation: 'SET_DECRYPTED_CONTENT',
                        content: decrypted,
                    });
                }
            });
    }
}

browser.runtime.onMessage.addListener(async message => {
    //code for passing message to content script
    const { enc_content } = message;
    encrypted_message = enc_content;
    // const { personalKeysStore } = await getKeySetFromStore();
    // const receiverKeyStore = await getReceiverPublicKeys();
    // const { privateKey } = personalKeysStore[0];
    // const { publicKey } = receiverKeyStore[0];
    // const decrypted = await decryptMessage(publicKey, privateKey, 'password', enc_content);
    // if (decrypted) {
    //     browser.tabs
    //         .query({
    //             currentWindow: true,
    //             active: true,
    //         })
    //         .then(tabs => {
    //             console.log('Sending decr message');
    //             console.log(decrypted);
    //             for (const tab of tabs) {
    //                 browser.tabs.sendMessage(tab.id, {
    //                     operation: 'SET_DECRYPTED_CONTENT',
    //                     content: decrypted,
    //                 });
    //             }
    //         });
    // }
});
