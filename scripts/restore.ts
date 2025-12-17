import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function restoreBackup(backupFile: string) {
  try {
    // Validar se arquivo existe
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Arquivo não encontrado: ${backupFile}`);
      process.exit(1);
    }

    console.log(`🔄 Restaurando backup de: ${backupFile}\n`);

    // Ler arquivo de backup
    const backupContent = fs.readFileSync(backupFile, "utf-8");
    const backup = JSON.parse(backupContent);

    console.log("⚠️  Aviso: Isso irá SOBRESCREVER os dados existentes!");
    console.log("   Certificar-se de que tem um backup antes de prosseguir!\n");

    // Limpar dados existentes (ordem importa por causa das relações)
    console.log("🗑️  Limpando dados existentes...");
    await prisma.contactGroup.deleteMany({});
    await prisma.selection.deleteMany({});
    await prisma.image.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.user.deleteMany({});

    // Restaurar dados
    console.log("📥 Restaurando dados...");

    // Restaurar usuários
    for (const user of backup.tables.users) {
      await prisma.user.create({ data: user });
    }
    console.log(`   ✓ ${backup.tables.users.length} usuários restaurados`);

    // Restaurar contatos
    for (const contact of backup.tables.contacts) {
      await prisma.contact.create({ data: contact });
    }
    console.log(`   ✓ ${backup.tables.contacts.length} contatos restaurados`);

    // Restaurar grupos
    for (const group of backup.tables.groups) {
      await prisma.group.create({ data: group });
    }
    console.log(`   ✓ ${backup.tables.groups.length} grupos restaurados`);

    // Restaurar relações de contatos-grupos
    for (const cg of backup.tables.contactGroups) {
      await prisma.contactGroup.create({ data: cg });
    }
    console.log(
      `   ✓ ${backup.tables.contactGroups.length} relações restauradas`
    );

    // Restaurar imagens
    for (const image of backup.tables.images) {
      await prisma.image.create({ data: image });
    }
    console.log(`   ✓ ${backup.tables.images.length} imagens restauradas`);

    // Restaurar seleções
    for (const selection of backup.tables.selections) {
      await prisma.selection.create({ data: selection });
    }
    console.log(`   ✓ ${backup.tables.selections.length} seleções restauradas`);

    console.log("\n✅ Backup restaurado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao restaurar backup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Obter arquivo de backup como argumento
const backupFile = process.argv[2];
if (!backupFile) {
  console.error("❌ Por favor, forneça o arquivo de backup como argumento");
  console.error(`   Uso: npx ts-node scripts/restore.ts <arquivo-backup>`);
  console.error(
    `   Exemplo: npx ts-node scripts/restore.ts backups/backup-2025-12-17T10-30-45-123Z.json`
  );
  process.exit(1);
}

restoreBackup(backupFile);
