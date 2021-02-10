import 'babel-polyfill'
import {
    isConnected,
    getPublicKey,
    signTransaction,
} from "@stellar/freighter-api";
import { Keypair } from 'stellar-sdk';

const StellarSDK = require("stellar-sdk");
// const server = new StellarSDK.Server("https://horizon-testnet.stellar.org");
const SERVER_URL = 'https://horizon.stellar.org'
const server = new StellarSDK.Server(SERVER_URL);
const balances = document.getElementById('balances')
const assetIssuerAddress = Keypair.fromPublicKey('GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG')
const assetCode = 'ARST'

// Using Javascript get the public key and display it
const retrievePublicKey = async () => {
    let publicKey = "";
    let error = "";

    try {
        publicKey = await getPublicKey();
    } catch (e) {
        error = e;
    }

    if (error) {
        return error;
    }

    return publicKey;
};

const userSignTransaction = async (xdr) => {
    let signedTransaction = "";
    let error = "";
    try {
        signedTransaction = await signTransaction(xdr);
    } catch (e) {
        error = e;
    }
    if (error) {
        return error;
    }
    return signedTransaction;
};

const displayPublicKey = async () => {
    const result = await retrievePublicKey();
    const publicKey = document.getElementById('publicKey')
    publicKey.innerText = result
}
displayPublicKey()

// Display the balance of the wallet (all assets)
const connectServer = async () => {
    server
        .loadAccount(await retrievePublicKey())
        .then((account) => {
            account.balances.forEach(displayAsset);
            const balance = document.createElement('h3')
            balance.innerText = `Total Balance: ${getBalance(account, 'XLM')} XLM`
            document.body.appendChild(balance)
            console.log(account)
        })
        .catch((err) => {
            console.log(err);
        });
}
connectServer()

const displayAsset = (asset) => {
    const li = document.createElement('li')
    let assetCode = 'XLM'
    if (asset.asset_type !== 'native') {
        assetCode = asset.asset_code
    }
    li.innerText = `${asset.balance} ${assetCode}`
    balances.appendChild(li)
}

const getBalance = (account, currency) => {
    let balance = 0;
    if (currency == 'XLM') {
        balance = Number.parseFloat(account.balances.find(b => b.asset_type == 'native').balance);
    } else {
        balance = Number.parseFloat(account.balances.find(b => b.asset_code == currency).balance);
    }
    return balance;
}

const trustAsset = async () => {
    const publicKey = await retrievePublicKey()
    //load the new account to create trustline
    server.loadAccount(publicKey)
        .then(async account => {
            // create transaction builder
            const fee = await server.fetchBaseFee()
            const builder = new StellarSDK.TransactionBuilder(account, { fee, networkPassphrase: StellarSDK.Networks.PUBLIC });

            //Change Trustline to trust the asset to be used on the platform.
            //     builder.addOperation(StellarSDK.Operation.createAccount({
            //         destination: assetIssuerAddress.publicKey(),
            //         startingBalance: '1.6'
            //    }))
            //     builder.addOperation(
            //         StellarSDK.Operation.changeTrust({
            //             asset: new StellarSDK.Asset(assetCode, assetIssuerAddress.publicKey())
            //         })
            //     )
            builder.addOperation(StellarSDK.Operation.createPassiveSellOffer({
                selling: StellarSDK.Asset.native(),
                buying: new StellarSDK.Asset(assetCode, assetIssuerAddress.publicKey()),
                amount: '1',
                price: '0.0202176'
            })).setTimeout(180)

            // create the transaction XDR
            let transaction = builder.build();
            let xdr = transaction.toXDR()
            const userSignedTransaction = await userSignTransaction(xdr);
            const transactionToSubmit = StellarSDK.TransactionBuilder.fromXDR(
                userSignedTransaction,
                StellarSDK.Networks.PUBLIC
            );
            const response = await server.submitTransaction(transactionToSubmit);
        })
}