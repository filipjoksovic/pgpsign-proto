(() => {

    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    const MAIL_PROVIDERS = {
        GMAIL: 'GMAIL',
        OUTLOOK: 'OUTLOOK',
    };

    let determineMailProvider = value => {
        if (value.includes('mail.google')) return MAIL_PROVIDERS.GMAIL;
    };

    let getMailContents = () => {
        return document.querySelector('div[aria-label=\'Message Body\']').innerText;
    };
    let getEncryptedContent = () => {
        const passing = [];
        const divs = document.querySelectorAll('div[dir=\'ltr\']').forEach(item => {
            if (item.innerText.includes('BEGIN PGP MESSAGE')) {
                passing.push(item);
            }
        });
        return passing[0].innerText;
    };
    let setDecryptedContent = (content)=>{
        console.log("Content to set:",content);
        const passing = [];
        const divs = document.querySelectorAll('div[dir=\'ltr\']').forEach(item => {
            if (item.innerText.includes('BEGIN PGP MESSAGE')) {
                passing.push(item);
            }
        });
        passing.forEach(
            element => (element.innerHTML = content.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')),
        );
    }
    let setMailContents = (content) => {
        return document.querySelector('div[aria-label=\'Message Body\']').innerText = content;
    };

    let MAIL_PROVIDER = determineMailProvider(window.location.href);

    let isInProgress = false;
    document.querySelectorAll('span').forEach(element => {
        try {
            if (element.innerHTML.includes('New Message') || element.innerHTML.includes('Draft saved')) {
                isInProgress = true;
            }
        } catch (e) {
            console.log('error while parsing. Skipping this element.');
        }
    });


    browser.runtime.sendMessage({ dialogStatus: isInProgress, provider: MAIL_PROVIDER });

    browser.runtime.onMessage.addListener(event => {
        if (event.operation === 'GET_CONTENT') {
            console.log(getMailContents());
            browser.runtime.sendMessage({
                content: JSON.stringify(getMailContents()),
            });
        }
        if (event.operation === 'SET_CONTENT') {
            setMailContents(event.content);
        }
        if (event.operation === 'GET_PROVIDER') {
            browser.runtime.sendMessage({ dialogStatus: isInProgress, provider: MAIL_PROVIDER });
        }
        if (event.operation === 'GET_ENCRYPTED_CONTENT') {
            browser.runtime.sendMessage({ enc_content: getEncryptedContent() });
        }
        if (event.operation === 'SET_DECRYPTED_CONTENT') {
            console.log("Got decrypted content");
            console.log(event);
            setDecryptedContent(event.content);
        }
    });
})();
