
(() => {
    const MAIL_PROVIDERS = {
        GMAIL: 'GMAIL',
        OUTLOOK: 'OUTLOOK',
    };
    let getMailContentsForDecrypt = () => {
        const mailContents = document.querySelectorAll("div[dir='ltr']");
        const regex = /-----BEGIN PGP MESSAGE-----[\s\S]*?-----END PGP MESSAGE-----/;

        for (const div of mailContents) {
            const match = div.innerText.match(regex);
            if (match) {
                const pgpMessage = match[0];
                const withoutQuotes = pgpMessage.replace(/^"|"$/g, '');
                return withoutQuotes;
            }
        }

        return null;
    };

    let setDecryptedContent = (decryptedMessage) => {
        const mailContents = document.querySelectorAll("div[dir='ltr']");
        const regex = /-----BEGIN PGP MESSAGE-----[\s\S]*?-----END PGP MESSAGE-----/;

        for (const div of mailContents) {
            const match = div.innerText.match(regex);
            if (match) {
                div.innerText = decryptedMessage;
                break;
            }
        }
    };

    let determineMailProvider = value => {
        if (value.includes('mail.google')) return MAIL_PROVIDERS.GMAIL;
    };

    let getMailContents = () => {
        return document.querySelector('div[aria-label=\'Message Body\']').innerText;
    };
    let setMailContents = (content) => {
        return document.querySelector('div[aria-label=\'Message Body\']').innerText = content;
    };

    let MAIL_PROVIDER = determineMailProvider(window.location.href);

    console.log(MAIL_PROVIDER);
    let isInProgress = false;
    document.querySelectorAll('span').forEach(element => {
        try {
            if (element.innerHTML.includes('New Message')) {
                console.log(element.innerHTML);
            }
            if (element.innerHTML.includes('New Message')) {
                console.log('Dialog opened');
                isInProgress = true;
            }
        } catch (e) {
            console.log('error while parsing. Skipping this element.');
        }
    });
    browser.runtime.sendMessage({ dialogStatus: isInProgress, provider: MAIL_PROVIDER });

    browser.runtime.onMessage.addListener(event=>{
        if(event.operation === "GET_CONTENT"){
            console.log(getMailContents());
            browser.runtime.sendMessage({
                content:JSON.stringify(getMailContents())
            })
        }
        if(event.operation === "SET_CONTENT"){
            setMailContents(event.content);
        }
         if (event.operation === 'GET_ENCRYPTED_MESSAGE') {
            const encryptedMessage = getMailContentsForDecrypt();
            browser.runtime.sendMessage({
                operation: 'ENCRYPTED_MESSAGE',
                encryptedMessage: encryptedMessage,
            });
        }
    if (event.operation === 'SET_DECRYPTED_CONTENT') {  
        setDecryptedContent(event.decryptedMessage);
    }
    })
})();
