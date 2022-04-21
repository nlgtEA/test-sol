const { mnemonicToSeedSync } = require("bip39");
const {
  Keypair,
  Connection,
  clusterApiUrl,
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const { derivePath } = require("ed25519-hd-key");

const DEFAULT_DERIVE_PATH = (index) => `m/44'/501'/${index}'`;

function bufferToString(buffer) {
  return Buffer.from(buffer).toString("hex");
}

function deriveSeed(seed, walletIndex = 0) {
  return derivePath(DEFAULT_DERIVE_PATH(walletIndex), seed).key;
}

const generateKeypair = async (mnemonic) => {
  const seed = mnemonicToSeedSync(mnemonic);
  return Keypair.fromSeed(deriveSeed(bufferToString(seed)));
};

const importAccount = async () => {
  const mnemonic = process.argv[2];

  const keypair = await generateKeypair(mnemonic);

  return keypair;
};

const transfer = async () => {
  const connection = new Connection(clusterApiUrl("testnet"), "confirmed");

  const keypair = await importAccount();

  const recipient = "7kL3p15SDD6LhzwuUkkhNvgknNerJWdrY8KCM5zqT2hv";
  const amount = 0.00001;

  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(recipient),
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  const receipt = await sendAndConfirmTransaction(connection, transaction, [
    keypair,
  ]);

  console.log("=====receipt ", receipt);

  return receipt;
};

const getTxs = async () => {
  const connection = new Connection(clusterApiUrl("testnet"), "confirmed");

  const keypair = await importAccount();

  const signatureInfos = await connection.getSignaturesForAddress(
    keypair.publicKey
  );

  console.log("signature infos: ", signatureInfos);

  const signatures = signatureInfos.map((x) => x.signature);

  const transactions = await Promise.all(
    signatures.map(async (s) => await connection.getTransaction(s))
  );

  console.log("first transaction: ", JSON.stringify(transactions[0]));
};

const main = async () => {
  await getTxs();
};

main();
