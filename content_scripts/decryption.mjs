import {
    decryptMessage,
    getKeySetFromStore,
    getReceiverPublicKeys,
    getUserFromPrivKey,
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
    document.querySelector('#senderPublic').addEventListener('change', async e => {
        const selectedKey = e.target.value;
        console.log(selectedKey);
        const publicKey = (await getReceiverPublicKeys())[selectedKey].publicKey;
        console.log(publicKey);
    });
}

export async function listenForBlur() {
    document.querySelector('#publicKeyPasswordInput').addEventListener('blur', async e => {
        inputted_password = e.target.value;
    });
    document.querySelector('#decryptContent').addEventListener('click', async e => {
        const selectedKey = document.querySelector(PUBLIC_KEY_SELECTOR_SELECTOR).value;
        const selectedPublicKey = document.querySelector('#senderPublic').value;
        const privateKey = (await getKeySetFromStore()).personalKeysStore[selectedKey].privateKey;
        const publicKey = (await getKeySetFromStore()).personalKeysStore[selectedPublicKey]
            .publicKey;
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

    const select2 = document.querySelector('#senderPublic');
    //remove all children
    while (select2.firstChild) {
        select2.removeChild(select2.firstChild);
    }
    let counter2 = 0;
    for (const key of await personalKeysStore) {
        const option = document.createElement('option');
        option.value = counter2;
        option.text = key.name + ' ' + key.email;
        select2.appendChild(option);
        counter2++;
    }
}

export async function decryptContent(publicKey, privateKey, password) {
    let decrypted = await decryptMessage(publicKey, privateKey, password, encrypted_message);
    console.log(decrypted);
    const user = await getUserFromSignature(publicKey);
    console.log(user);
    console.log(await getUserFromPrivKey(privateKey, password));
    //replace \n with <br> and remove " from string
    decrypted = decrypted.replace(/\\n/g, '<br>');
    decrypted = decrypted.replace(/"/g, '');
    decrypted += `
    <div style = "padding: .5rem 1rem; background-color: #f5f5f5; border-radius: 5px; margin-top: 1rem; border: 1px solid #e7e7e7">
            <h3>Signed by</h3><p>${user.name} (${user.email})</p></div>`;

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
