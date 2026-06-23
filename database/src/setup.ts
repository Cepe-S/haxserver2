import { db, connect, disconnect } from './DatabaseManager';

/**
 * Script para inicializar la base de datos SQLite
 * Crea las tablas y datos iniciales si es necesario
 */
async function setupDatabase() {
  try {
    console.log('🔧 Setting up SQLite database...');
    
    await connect();
    
    // Verificar que las tablas existen ejecutando una consulta simple
    await db.serverImage.findMany({ take: 1 });
    
    console.log('✅ SQLite database setup completed');
    console.log('📁 Database file: ./mikuserverpro.db');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase().catch(console.error);
}

export { setupDatabase };