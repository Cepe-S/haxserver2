#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function cleanDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 Limpiando base de datos...');
    
    // Eliminar datos en orden correcto (respetando foreign keys)
    console.log('📋 Eliminando conexiones...');
    const connectionsDeleted = await prisma.connection.deleteMany({});
    console.log(`   ✅ ${connectionsDeleted.count} conexiones eliminadas`);
    
    console.log('📊 Eliminando estadísticas de jugadores...');
    const statsDeleted = await prisma.playerStats.deleteMany({});
    console.log(`   ✅ ${statsDeleted.count} estadísticas eliminadas`);
    
    console.log('🚫 Eliminando sanciones...');
    const sanctionsDeleted = await prisma.playerSanction.deleteMany({});
    console.log(`   ✅ ${sanctionsDeleted.count} sanciones eliminadas`);
    
    console.log('🔑 Eliminando permisos...');
    const permissionsDeleted = await prisma.playerPermission.deleteMany({});
    console.log(`   ✅ ${permissionsDeleted.count} permisos eliminados`);
    
    console.log('🔐 Eliminando auths...');
    const authsDeleted = await prisma.playerAuth.deleteMany({});
    console.log(`   ✅ ${authsDeleted.count} auths eliminados`);
    
    console.log('🌐 Eliminando conexiones de red...');
    const networkConnectionsDeleted = await prisma.playerConnection.deleteMany({});
    console.log(`   ✅ ${networkConnectionsDeleted.count} conexiones de red eliminadas`);
    
    console.log('📝 Eliminando nombres...');
    const namesDeleted = await prisma.playerName.deleteMany({});
    console.log(`   ✅ ${namesDeleted.count} nombres eliminados`);
    
    console.log('👤 Eliminando identidades de jugadores...');
    const identitiesDeleted = await prisma.playerIdentity.deleteMany({});
    console.log(`   ✅ ${identitiesDeleted.count} identidades eliminadas`);
    
    console.log('\n🎉 ¡Base de datos limpiada exitosamente!');
    console.log('📈 Resumen:');
    console.log(`   • ${connectionsDeleted.count} conexiones`);
    console.log(`   • ${statsDeleted.count} estadísticas`);
    console.log(`   • ${sanctionsDeleted.count} sanciones`);
    console.log(`   • ${permissionsDeleted.count} permisos`);
    console.log(`   • ${authsDeleted.count} auths`);
    console.log(`   • ${networkConnectionsDeleted.count} conexiones de red`);
    console.log(`   • ${namesDeleted.count} nombres`);
    console.log(`   • ${identitiesDeleted.count} identidades`);
    
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  cleanDatabase();
}

module.exports = { cleanDatabase };