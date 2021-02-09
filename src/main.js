import 'babel-polyfill'
import {
    isConnected,
    getPublicKey,
    signTransaction,
} from "@stellar/freighter-api";
import { Keypair } from 'stellar-sdk';

const StellarSDK = require("stellar-sdk");
// const server = new StellarSDK.Server("https://horizon-testnet.stellar.org");
const server = new StellarSDK.Server("https://horizon.stellar.org");
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
            balance.innerText = `Balance: ${getBalance(account, 'XLM')} XLM`
            document.body.appendChild(balance)
        })
        .catch((err) => {
            console.log(err);
        });
}
connectServer()

const displayAsset = (asset) => {
    const li = document.createElement('li')
    li.innerText = asset.balance
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
        .then(account => {
            // create transaction builder
            const builder = new StellarSDK.TransactionBuilder(account);
            //Change Trustline to trust the asset to be used on the platform.
            builder.addOperation(
                StellarSDK.Operation.changeTrust({
                    asset: new StellarSDK.Asset(assetCode, assetIssuerAddress.publicKey())
                })
            )
            // create the transaction XDR
            let transaction = builder.build();
            // sign the XDR
            transaction.sign(Keypair.fromPublicKey(publicKey));
            // submit to the network. this returns a promise (resolves or rejects depending on the outcome of the transaction)
            server.submitTransaction(transaction);
        })
}

const trustAsset2 = async () => {
    const sourcePublicKey = await retrievePublicKey()

    let source = Keypair.fromPublicKey(sourcePublicKey)
    let dest = assetIssuerAddress

    let sourceAccount = await server.loadAccount(sourcePublicKey)

    const fee = await server.fetchBaseFee()
    let builder = new StellarSDK.TransactionBuilder(sourceAccount, { fee, networkPassphrase: StellarSDK.Networks.TESTNET })

    builder.addOperation(StellarSDK.Operation.createAccount({
        destination: dest.publicKey(),
        startingBalance: '1.6'
    }))

    builder.addOperation(StellarSDK.Operation.changeTrust({
        asset: new StellarSDK.Asset(assetCode, assetIssuerAddress.publicKey()),
        source: dest.publicKey()
    }))

    builder.addOperation(StellarSDK.Operation.payment({
        destination: dest.publicKey(),
        asset: new StellarSDK.Asset(assetCode, assetIssuerAddress.publicKey()),
        amount: '100'
    })).setTimeout(180)

    let tx = builder.build()
    console.log(source, dest)
    tx.sign(source)
    tx.sign(dest)
    let txResult = await server.submitTransaction(tx)
}
trustAsset2()