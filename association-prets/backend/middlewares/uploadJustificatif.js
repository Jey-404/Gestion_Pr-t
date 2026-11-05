import multer from "multer";

const types = ["application/pdf", "image/jpeg", "image/png"];

export const uploadJustificatif = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 3, parts: 4, fieldSize: 3000 },
  fileFilter(req, file, callback) {
    if (!types.includes(file.mimetype)) {
      return callback(new Error("Format refusé : PDF, JPG ou PNG uniquement."));
    }
    callback(null, true);
  },
}).single("justificatif");

export function verifierFichier(fichier) {
  if (!fichier?.buffer?.length) return false;
  const b = fichier.buffer;
  if (fichier.mimetype === "application/pdf") {
    return b.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  if (fichier.mimetype === "image/jpeg") {
    return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  }
  if (fichier.mimetype === "image/png") {
    return b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  }
  return false;
}
