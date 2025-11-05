const jwt = require("jsonwebtoken");

require("dotenv").config({ path: ".env.local" });

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoicm9ubnlzZW5uYUB5YWhvby5jb20iLCJpYXQiOjE3NjE4MjYxNTYsImV4cCI6MTc2MjQzMDk1Nn0.EuHoukr4x2KDU4PwnFzw6U8o2sseJWYkGvYDSRPxYkM";

console.log("JWT_SECRET:", JWT_SECRET);
console.log("Token:", token);

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log("Token válido!", decoded);
} catch (error) {
  console.log("Erro na validação:", error.message);
}

// Testar com secret padrão
try {
  const decoded = jwt.verify(token, "secret");
  console.log("Token válido com secret padrão!", decoded);
} catch (error) {
  console.log("Erro com secret padrão:", error.message);
}
