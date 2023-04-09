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
    });
})();
