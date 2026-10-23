var CryptoJS = require("crypto-js");
const bcrypt = require("bcrypt");


const password = "secret1234"


let convertCredentials = async (userobj,isEncrypt) => {

    let data;
    try {

        if(isEncrypt == true){
            data = encrypt(userobj.upassword);
            // console.log(data);
        }else{
            data = decrypt(userobj[0].upassword);
        }

        return data;

    } catch (e) {
        console.log(e);
    }
}



function encrypt(text) {
    try {

        var encrypted = CryptoJS.AES.encrypt(text, password);
        return encrypted.toString();
    
      } catch (error) {
        console.log(error);
      }
    }


function decrypt(encryptedText) {
    try {
        var decrypted = CryptoJS.AES.decrypt(encryptedText, password);
        return decrypted.toString(CryptoJS.enc.Utf8);
    
      } catch (error) {
        console.log(error)
      }

}

// Returns true when `stored` looks like a bcrypt hash ($2a$/$2b$/$2y$ prefix).
function isBcryptHash(stored) {
    return typeof stored === 'string' &&
        (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$'));
}

// Hash a plaintext password with bcrypt (cost factor 12). Used for new/migrated passwords.
async function hashPassword(plain) {
    return await bcrypt.hash(plain, 12);
}

// Verify a plaintext password against a stored credential, supporting BOTH formats.
// - bcrypt hash  -> bcrypt.compare, legacy: false
// - legacy AES   -> decrypt with the existing CryptoJS logic and compare, legacy: true
// Returns { ok: boolean, legacy: boolean }.
async function verifyPassword(plain, stored) {
    if (isBcryptHash(stored)) {
        return { ok: await bcrypt.compare(plain, stored), legacy: false };
    }

    try {
        const decrypted = decrypt(stored);
        return { ok: decrypted !== undefined && decrypted !== null && decrypted === plain, legacy: true };
    } catch (e) {
        return { ok: false, legacy: true };
    }
}

module.exports.convertCredentials = convertCredentials;
module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;
module.exports.isBcryptHash = isBcryptHash;
