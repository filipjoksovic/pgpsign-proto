export const ValidatorInputs = {
    name: 'NAME',
    email: 'EMAIL',
    password: 'PASSWORD',
    receiverName:'RECEIVER_NAME',
    receiverEmail:'RECEIVER_EMAIL',
    receiverKey:'RECEIVER_KEY'
};

export const Validators = {
    NAME: value => value !== '',
    EMAIL: value => {
        const re =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(value);
    },
    PASSWORD: value => value !== '',
    RECEIVER_NAME:value=>value!=='',
    RECEIVER_EMAIL:value=>{
        const re =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(value);
    },
    RECEIVER_KEY:value=> value.includes("BEGIN PGP PUBLIC KEY") && value.includes("END PGP PUBLIC KEY")
    
};

export function validateKeyGenInputValue(value, type) {
    console.log(value,type);
    if (!Object.hasOwn(Validators, type)) {
        console.error('Validator not found for validator:', type);
        return false;
    }
    return Validators[type](value);
}
