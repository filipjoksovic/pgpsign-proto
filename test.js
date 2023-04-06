browser.tabs.executeScript({ file: '/content_scripts/browserActions.js' }).then(() => {
    console.log("DONE");
}).catch(e => {
    console.log("Error occured", e);
});
//killoy was here