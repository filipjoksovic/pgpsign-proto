import * as openpgp from 'openpgp';


async function generateKeys() {
    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        type: 'ecc', // Type of the key, defaults to ECC
        curve: 'curve25519', // ECC curve name, defaults to curve25519
        userIDs: [{ name: 'Jon Smith', email: 'jon@example.com' }], // you can pass multiple user IDs
        passphrase: 'password', // protects the private key
        format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
    });

    console.log(privateKey);     // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
    console.log(publicKey);      // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
    console.log(revocationCertificate); // '-----BEGIN PGP PUBLIC KEY BLOCK ... '

    return {
        privateKey: privateKey,
        publicKey: publicKey,
        revocationCertificate: revocationCertificate
    }
}

async function encrypt(publicKey, privateKey, password, message) {
    console.log(publicKey)

    const parsedPublicKey = await openpgp.readKey({ armoredKey: publicKey });
    const parsedPrivateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase: password
    });

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: 'Hello, World!' }), // input as Message object
        encryptionKeys: parsedPublicKey,
        signingKeys: parsedPrivateKey // optional
    });
    console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'

    const encryptedMessage = await openpgp.readMessage({
        armoredMessage: encrypted // parse armored message
    });

    console.log(encryptedMessage);
    return encrypted;

}

async function decrypt(encrypted, publicKey, privateKey) {
    const message = await openpgp.readMessage({
        armoredMessage: encrypted // parse armored message
    });
    const { data: decrypted, signatures } = await openpgp.decrypt({
        message,
        verificationKeys: await openpgp.readKey({ armoredKey: publicKey }), // optional
        decryptionKeys: await openpgp.decryptKey({ privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }), passphrase: "password" })
    });
    console.log(decrypted); // 'Hello, World!'
    // check signature validity (signed messages only)
    try {
        await signatures[0].verified; // throws on invalid signature
        console.log('Signature is valid');
    } catch (e) {
        throw new Error('Signature could not be verified: ' + e.message);
    }
}

// //     console.log("here");
// const {privateKey,publicKey,revocationCertificate} =  generateKeys();
// setTimeout(() => {
//     encrypt(publicKey,privateKey,"123","Hello world");

// }, 200);
// console.log("hello")

// const { privateKey, publicKey, revocationCertificate } = await generateKeys();
// const encryptedMessage = await encrypt(publicKey, privateKey, "password", "Hello World!");
// const decryptedMessage = await decrypt(encryptedMessage, publicKey, privateKey);
