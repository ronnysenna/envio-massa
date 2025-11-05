const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Hash da nova senha
    const newPassword = "admin123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar a senha do usuário existente
    const user = await prisma.user.update({
      where: { username: "ronnysenna@yahoo.com" },
      data: { password: hashedPassword },
    });

    console.log(
      `✅ Senha do usuário ${user.username} atualizada para: ${newPassword}`
    );
  } catch (error) {
    console.error("❌ Erro ao atualizar senha:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
