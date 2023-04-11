import * as openpgp from 'openpgp';


async function generateKeys() {
    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        type: 'ecc', // Type of the key, defaults to ECC
        curve: 'curve25519', // ECC curve name, defaults to curve25519
        userIDs: [{ name: 'Jon Smith', email: 'jon@example.com' }], // you can pass multiple user IDs
        passphrase: 'password', // protects the private key
        format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
    });

    return {
        privateKey: privateKey,
        publicKey: publicKey,
        revocationCertificate: revocationCertificate
    }
}

async function encrypt(publicKey, privateKey, password, message) {
    const parsedPublicKey = await openpgp.readKey({ armoredKey: publicKey });
    const parsedPrivateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase: password
    });

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: 'Hello, World!' }), // input as Message object
        encryptionKeys: parsedPublicKey,
//        signingKeys: parsedPrivateKey // optional
    });
    console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'

    const encryptedMessage = await openpgp.readMessage({
        armoredMessage: encrypted // parse armored message
    });

    console.log(encryptedMessage);
    return encrypted;

}

async function decrypt(encrypted, publicKey, privateKey) {
    console.log("Decryption");
    console.log(encrypted);
    console.log(publicKey);
    console.log(privateKey);
    const message = await openpgp.readMessage({
        armoredMessage: encrypted // parse armored message
    });
    const { data: decrypted, signatures } = await openpgp.decrypt({
        message,
//        verificationKeys: await openpgp.readKey({ armoredKey: publicKey }), // optional
        decryptionKeys: await openpgp.decryptKey({ privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }), passphrase: "password" })
    });
    console.log(decrypted); // 'Hello, World!'
    return decrypted;
    // check signature validity (signed messages only)
    try {
        await signatures[0].verified; // throws on invalid signature
    } catch (e) {
        throw new Error('Signature could not be verified: ' + e.message);
    }
}
//
// //     console.log("here");
// const {privateKey,publicKey,revocationCertificate} =  generateKeys();
// setTimeout(() => {
//     encrypt(publicKey,privateKey,"123","Hello world");

// }, 200);
// console.log("hello")

// const { privateKey, publicKey, revocationCertificate } = await generateKeys();
//
// const encryptedMessage = await encrypt(publicKey, privateKey, "password", "Hello World!");
// const decryptedMessage = await decrypt(encryptedMessage, publicKey, privateKey);
//
// console.log(decryptedMessage);
// console.log("Private key used");
// console.log(privateKey);
// console.log("Public key used");
// console.log(publicKey);
//
//
//

for(let i = 0; i < 100; i++){
    const { privateKey, publicKey, revocationCertificate } = await generateKeys();
    console.log(privateKey);
    console.log(publicKey);
}
