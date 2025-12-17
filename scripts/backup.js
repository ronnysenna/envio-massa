const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function createBackup() {
  try {
    console.log("🔄 Iniciando backup do banco de dados...\n");

    // Coletar dados de todas as tabelas
    const [users, contacts, groups, contactGroups, images, selections] =
      await Promise.all([
        prisma.user.findMany(),
        prisma.contact.findMany(),
        prisma.group.findMany(),
        prisma.contactGroup.findMany(),
        prisma.image.findMany(),
        prisma.selection.findMany(),
      ]);

    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      database: "PostgreSQL",
      tables: {
        users,
        contacts,
        groups,
        contactGroups,
        images,
        selections,
      },
      summary: {
        users: users.length,
        contacts: contacts.length,
        groups: groups.length,
        contactGroups: contactGroups.length,
        images: images.length,
        selections: selections.length,
      },
    };

    // Criar diretório de backups se não existir
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Salvar backup com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log("✅ Backup criado com sucesso!\n");
    console.log("📊 Resumo do backup:");
    console.log(`   - Usuários: ${users.length}`);
    console.log(`   - Contatos: ${contacts.length}`);
    console.log(`   - Grupos: ${groups.length}`);
    console.log(`   - Relações (Contato-Grupo): ${contactGroups.length}`);
    console.log(`   - Imagens: ${images.length}`);
    console.log(`   - Seleções: ${selections.length}`);
    console.log(`\n📁 Arquivo salvo em: ${backupFile}`);

    // Também exportar como SQL (para backup mais completo)
    const sqlBackupFile = path.join(backupDir, `backup-${timestamp}.sql`);
    console.log(`\n💾 Para fazer backup via pg_dump, execute:`);
    console.log(`   pg_dump $DATABASE_URL > ${sqlBackupFile}`);
  } catch (error) {
    console.error("❌ Erro ao fazer backup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createBackup();
