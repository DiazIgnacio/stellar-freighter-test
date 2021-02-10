const trustAsset2 = async () => {
    const sourcePublicKey = await retrievePublicKey()
    let dest = assetIssuerAddress
    let sourceAccount = await server.loadAccount(sourcePublicKey)
    const fee = await server.fetchBaseFee()
    let builder = new StellarSDK.TransactionBuilder(sourceAccount, { fee, networkPassphrase: StellarSDK.Networks.PUBLIC })

    // builder.addOperation(StellarSDK.Operation.createAccount({
    //     destination: dest.publicKey(),
    //     startingBalance: '1.6'
    // }))

    builder.addOperation(StellarSDK.Operation.changeTrust({
        asset: new StellarSDK.Asset(assetCode, assetIssuerAddress.publicKey()),
        source: dest.publicKey()
    })).setTimeout(180)

    // builder.addOperation(StellarSDK.Operation.payment({
    //     destination: dest.publicKey(),
    //     asset: new StellarSDK.Asset(assetCode, assetIssuerAddress.publicKey()),
    //     amount: '100'
    // })).setTimeout(180)

    let transaction = builder.build()
    let xdr = transaction.toXDR()
    const userSignedTransaction = await userSignTransaction(xdr);
    const transactionToSubmit = StellarSDK.TransactionBuilder.fromXDR(
        userSignedTransaction,
        StellarSDK.Networks.PUBLIC
    );
    const response = await server.submitTransaction(transactionToSubmit);
}