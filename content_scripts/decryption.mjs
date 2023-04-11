import { decryptMessage, getKeySetFromStore, getReceiverPublicKeys } from './pgp.mjs';

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
    })
    .catch(e => {
        console.log('Error occured', e);
    });

browser.runtime.onMessage.addListener(async (message) => {
//    console.log(message);
    const { enc_content } = message;
    const { personalKeysStore } = await getKeySetFromStore();
    const receiverKeyStore = await getReceiverPublicKeys();
//    console.log(personalKeysStore);
//    console.log(receiverKeyStore);
    const { privateKey } = personalKeysStore[0];
    const { publicKey } = receiverKeyStore[0];
//    console.log(privateKey);
//    console.log(publicKey);
    const decrypted = await decryptMessage(publicKey, privateKey, 'password', enc_content);
//    console.log(decrypted);
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
                    browser.tabs.sendMessage(tab.id, { operation: 'SET_DECRYPTED_CONTENT', content: decrypted });
                }
            });
    }
});