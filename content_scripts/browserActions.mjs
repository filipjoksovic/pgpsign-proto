(() => {
    const MAIL_PROVIDERS = {
        GMAIL: 'GMAIL',
        OUTLOOK: 'OUTLOOK',
    };

    let determineMailProvider = value => {
        if (value.includes('mail.google')) return MAIL_PROVIDERS.GMAIL;
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
})();
