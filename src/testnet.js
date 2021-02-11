import {
    isConnected,
    getPublicKey,
    signTransaction,
} from "@stellar/freighter-api";
import { Keypair } from 'stellar-sdk';

const StellarSdk = require("stellar-sdk");
const fetch = require('node-fetch')

const SERVER_URL = "https://horizon-testnet.stellar.org";
const server = new StellarSdk.Server(SERVER_URL);

const balances = document.getElementById('balances')
const container = document.getElementById('container')
const spinner = document.getElementById('spinner')
const assetIssuerAddress = Keypair.fromPublicKey('GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG')
const assetCode = 'ARST'

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

const createAccount = async () => {
    try {
        const response = await fetch(
            `https://friendbot.stellar.org?addr=${encodeURIComponent(
                await retrievePublicKey(),
            )}`,
        );
        const responseJSON = await response.json();
        console.log("SUCCESS! You have a new account :)\n", responseJSON);
    } catch (e) {
        console.error("ERROR!", e);
    }
};



const displayPublicKey = async () => {
    const result = await retrievePublicKey();
    const publicKey = document.getElementById('publicKey')
    publicKey.innerText = result
}
displayPublicKey()

// Display the balance of the wallet (all assets)
const connectServer = async () => {
    console.log(await retrievePublicKey())
    server
        .loadAccount(await retrievePublicKey())
        .then((account) => {
            console.log(`account : ${account}`)
            account.balances.forEach(displayAsset);
            const balance = document.createElement('h3')
            balance.innerText = `Total Balance: ${getBalance(account, 'XLM')} XLM`
            container.appendChild(balance)
            spinner.classList.add('d-none')
            container.classList.remove('d-none')

        })
        .catch((err) => {
            console.log(err);
        });
}

connectServer()

const displayAsset = (asset) => {
    const li = document.createElement('li')
    li.classList.add('list-group-item')
    let assetCode = 'XLM'
    if (asset.asset_type !== 'native') {
        assetCode = asset.asset_code
    }
    li.innerText = `${asset.balance}  ${assetCode}`
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
            const fee = 300
            const builder = new StellarSdk.TransactionBuilder(account, { fee, networkPassphrase: StellarSdk.Networks.TESTNET });

            // Change Trustline to trust the asset to be used on the platform.
            builder.addOperation(StellarSdk.Operation.createAccount({
                destination: assetIssuerAddress.publicKey(),
                startingBalance: '1.6'
            }))
            builder.addOperation(
                StellarSdk.Operation.changeTrust({
                    asset: new StellarSdk.Asset(assetCode, assetIssuerAddress.publicKey())
                })
            ).setTimeout(180)
            // builder.addOperation(StellarSdk.Operation.manageSellOffer({
            //     selling: StellarSdk.Asset.native(),
            //     buying: new StellarSdk.Asset(assetCode, assetIssuerAddress.publicKey()),
            //     amount: '1',
            //     price: '0.0202176',
            // })).setTimeout(180)

            // // create the transaction XDR
            let transaction = builder.build();
            let xdr = transaction.toXDR()
            const userSignedTransaction = await userSignTransaction(xdr);
            const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(
                userSignedTransaction,
                StellarSdk.Networks.TESTNET
            );
            console.log(transactionToSubmit)
            try {
                const response = await server.submitTransaction(transactionToSubmit);
                console.log(response);
            } catch (err) {
                console.error(err);
            }
        })
}
trustAsset()