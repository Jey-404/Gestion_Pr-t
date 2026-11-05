
import argon2 from "argon2";
import readline from "node:readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

try {
  const password = await rl.question(
    "Saisissez un mot de passe de test : "
  );

  if (password.length < 12) {
    console.log("Utilisez au moins 12 caractères.");
  } else {
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    console.log("\nEmpreinte Argon2id :");
    console.log(hash);
  }
} finally {
  rl.close();
}
