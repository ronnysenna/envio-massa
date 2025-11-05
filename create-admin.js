const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("277897", 10);

  const admin = await prisma.user.upsert({
    where: { username: "adm@ronnysenna.com.br" },
    update: {},
    create: {
      username: "adm@ronnysenna.com.br",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("Usuário admin criado:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
