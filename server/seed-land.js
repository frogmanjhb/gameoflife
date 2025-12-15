// Standalone script to seed land data
// Run with: node seed-land.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Biome configuration
const BIOME_CONFIG = {
  'Savanna': {
    baseValue: 5000,
    risk: 'medium',
    pros: ['Good grazing land', 'Wildlife tourism potential', 'Moderate rainfall'],
    cons: ['Seasonal droughts', 'Fire risk', 'Limited water sources']
  },
  'Grassland': {
    baseValue: 4000,
    risk: 'low',
    pros: ['Excellent farming potential', 'Easy to develop', 'Stable ecosystem'],
    cons: ['Soil erosion risk', 'Limited shade', 'Overgrazing concerns']
  },
  'Forest': {
    baseValue: 8000,
    risk: 'medium',
    pros: ['Rich biodiversity', 'Timber resources', 'Carbon credits potential'],
    cons: ['Fire risk', 'Clearing restrictions', 'Difficult access']
  },
  'Fynbos': {
    baseValue: 10000,
    risk: 'high',
    pros: ['Unique biodiversity', 'Eco-tourism value', 'Protected species habitat'],
    cons: ['Fire-dependent ecosystem', 'Strict conservation laws', 'Limited development']
  },
  'Nama Karoo': {
    baseValue: 3000,
    risk: 'medium',
    pros: ['Sheep farming suited', 'Low land cost', 'Unique landscape'],
    cons: ['Very dry climate', 'Limited water', 'Remote location']
  },
  'Succulent Karoo': {
    baseValue: 4500,
    risk: 'high',
    pros: ['Rare plant species', 'Research value', 'Mining potential'],
    cons: ['Extreme temperatures', 'Water scarcity', 'Conservation restrictions']
  },
  'Desert': {
    baseValue: 2000,
    risk: 'high',
    pros: ['Solar energy potential', 'Low land price', 'Mineral deposits'],
    cons: ['Extreme conditions', 'No water', 'Uninhabitable without infrastructure']
  },
  'Thicket': {
    baseValue: 6000,
    risk: 'low',
    pros: ['Carbon storage', 'Game farming potential', 'Drought resistant'],
    cons: ['Dense vegetation', 'Clearing needed', 'Elephant damage risk']
  },
  'Indian Ocean Coastal Belt': {
    baseValue: 12000,
    risk: 'medium',
    pros: ['High property value', 'Tourism potential', 'Port access'],
    cons: ['Coastal erosion', 'Cyclone risk', 'High development costs']
  }
};

const biomeTypes = Object.keys(BIOME_CONFIG);

// Helper: Convert row index to Excel-style letter code
function rowToLetterCode(row) {
  if (row < 26) {
    return String.fromCharCode(65 + row); // A-Z
  }
  const first = Math.floor(row / 26) - 1;
  const second = row % 26;
  return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
}

// Helper: Generate grid code from row and column
function generateGridCode(row, col) {
  return `${rowToLetterCode(row)}${col + 1}`;
}

// Simple noise-based biome distribution
function getBiomeForPosition(row, col) {
  const regionSize = 3;
  const regionRow = Math.floor(row / regionSize);
  const regionCol = Math.floor(col / regionSize);
  
  // Seed based on region
  const seed = (regionRow * 7 + regionCol * 13) % biomeTypes.length;
  
  // Add some variation within regions
  const variation = (row * 3 + col * 5) % 100;
  if (variation < 20) {
    return biomeTypes[(seed + 1) % biomeTypes.length];
  }
  
  return biomeTypes[seed];
}

async function seedLandData() {
  const client = await pool.connect();
  
  try {
    // Check if parcels already exist
    const existingCheck = await client.query('SELECT COUNT(*) as count FROM land_parcels');
    if (existingCheck.rows[0].count > 0) {
      console.log(`Land parcels already exist (${existingCheck.rows[0].count} parcels). Skipping seed.`);
      return;
    }

    console.log('Starting land data seeding...');
    console.log('Generating 100 parcels (10x10 grid)...');

    // Start transaction
    await client.query('BEGIN');

    // Generate parcels in batches
    const batchSize = 100;
    let totalInserted = 0;

    for (let batchStart = 0; batchStart < 100; batchStart += batchSize) {
      const values = [];
      const params = [];
      let paramIndex = 1;

      for (let i = batchStart; i < Math.min(batchStart + batchSize, 100); i++) {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const gridCode = generateGridCode(row, col);
        const biome = getBiomeForPosition(row, col);
        const config = BIOME_CONFIG[biome];
        
        // Add some value variation (±20%)
        const valueVariation = 0.8 + (((row * col) % 100) / 250);
        const value = Math.round(config.baseValue * valueVariation);

        values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        params.push(
          gridCode,
          row,
          col,
          biome,
          value,
          config.risk,
          config.pros,
          config.cons
        );
      }

      const query = `
        INSERT INTO land_parcels (grid_code, row_index, col_index, biome_type, value, risk_level, pros, cons)
        VALUES ${values.join(', ')}
      `;

      await client.query(query, params);
      totalInserted += values.length;
      console.log(`Inserted ${totalInserted}/100 parcels...`);
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('✅ Land data seeded successfully!');
    console.log(`   Total parcels created: ${totalInserted}`);

    // Show biome distribution
    const distribution = await client.query(`
      SELECT biome_type, COUNT(*) as count 
      FROM land_parcels 
      GROUP BY biome_type 
      ORDER BY count DESC
    `);
    
    console.log('\nBiome distribution:');
    distribution.rows.forEach(row => {
      console.log(`   ${row.biome_type}: ${row.count} parcels`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed land data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seeder
seedLandData()
  .then(() => {
    console.log('\nSeeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

