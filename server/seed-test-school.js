/**
 * Idempotent seed for CivicLab Test School (isolated sandbox).
 * Run: npm run seed:test-school
 * Railway: cd server && railway run npm run seed:test-school
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const SCHOOL_CODE = 'civiclab-test';
const SCHOOL_NAME = 'CivicLab Test School';
const TOWN_CLASS = '6A';
const TOWN_NAME = 'Test Town A';
const TEACHER_USERNAME = 'testteacher@stpeters.co.za';
const TEACHER_PASSWORD = 'Boogie26!';
const STUDENT_PASSWORD = 'Test123!';
const STUDENT_BALANCE = 500000;
const TREASURY_BALANCE = 10000000;

const BIOME_CONFIG = {
  Savanna: { baseValue: 75000, risk: 'medium', pros: ['Good grazing land', 'Wildlife tourism potential', 'Moderate rainfall'], cons: ['Seasonal droughts', 'Fire risk', 'Limited water sources'] },
  Grassland: { baseValue: 56250, risk: 'low', pros: ['Excellent farming potential', 'Easy to develop', 'Stable ecosystem'], cons: ['Soil erosion risk', 'Limited shade', 'Overgrazing concerns'] },
  Forest: { baseValue: 131250, risk: 'medium', pros: ['Rich biodiversity', 'Timber resources', 'Carbon credits potential'], cons: ['Fire risk', 'Clearing restrictions', 'Difficult access'] },
  Fynbos: { baseValue: 135000, risk: 'high', pros: ['Unique biodiversity', 'Eco-tourism value', 'Protected species habitat'], cons: ['Fire-dependent ecosystem', 'Strict conservation laws', 'Limited development'] },
  'Nama Karoo': { baseValue: 58595, risk: 'medium', pros: ['Sheep farming suited', 'Low land cost', 'Unique landscape'], cons: ['Very dry climate', 'Limited water', 'Remote location'] },
  'Succulent Karoo': { baseValue: 37970, risk: 'high', pros: ['Rare plant species', 'Research value', 'Mining potential'], cons: ['Extreme temperatures', 'Water scarcity', 'Conservation restrictions'] },
  Desert: { baseValue: 67500, risk: 'high', pros: ['Solar energy potential', 'Low land price', 'Mineral deposits'], cons: ['Extreme conditions', 'No water', 'Uninhabitable without infrastructure'] },
  Thicket: { baseValue: 93750, risk: 'low', pros: ['Carbon storage', 'Game farming potential', 'Drought resistant'], cons: ['Dense vegetation', 'Clearing needed', 'Elephant damage risk'] },
  'Indian Ocean Coastal Belt': { baseValue: 180000, risk: 'medium', pros: ['High property value', 'Tourism potential', 'Port access'], cons: ['Coastal erosion', 'Cyclone risk', 'High development costs'] },
};

const COMMUNITY_AUCTION_GRID_CODE = 'I6';
const COMMUNITY_AUCTION_VALUE = 500000;
const COMMUNITY_AUCTION_PROS = ['Prime community auction plot', 'High visibility location', 'Special town event site'];
const COMMUNITY_AUCTION_CONS = ['Competitive bidding expected', 'Higher insurance premiums'];

const TEST_STUDENTS = [
  { slug: 'mayor', jobName: 'Mayor', roleLabel: 'Mayor' },
  { slug: 'town-planner', jobName: 'Assistant Town Planner', roleLabel: 'Town Planner' },
  { slug: 'lawyer', jobName: 'Junior Lawyer', roleLabel: 'Lawyer' },
  { slug: 'police', jobName: 'Junior Police Lieutenant', roleLabel: 'Police' },
  { slug: 'hr', jobName: 'Assistant HR Director', roleLabel: 'HR Director' },
  { slug: 'accountant', jobName: 'Junior Chartered Accountant', roleLabel: 'Accountant' },
  { slug: 'financial-manager', jobName: 'Assistant Financial Manager', roleLabel: 'Financial Manager' },
  { slug: 'insurance-manager', jobName: 'Assistant Risk & Insurance Manager', roleLabel: 'Insurance Manager' },
  { slug: 'civil-engineer', jobName: 'Assistant Civil Engineer', roleLabel: 'Civil Engineer' },
  { slug: 'electrical-engineer', jobName: 'Assistant Electrical Engineer', roleLabel: 'Electrical Engineer' },
  { slug: 'architect', jobName: 'Assistant Architect', roleLabel: 'Architect' },
  { slug: 'principal', jobName: 'Assistant Principal', roleLabel: 'Principal' },
  { slug: 'teacher', jobName: 'Assistant Teacher', roleLabel: 'Teacher' },
  { slug: 'doctor', jobName: 'Junior Doctor', roleLabel: 'Doctor' },
  { slug: 'nurse', jobName: 'Assistant Nurse', roleLabel: 'Nurse' },
  { slug: 'retail-manager', jobName: 'Assistant Retail Manager', roleLabel: 'Retail Manager' },
  { slug: 'event-planner', jobName: 'Assistant Event Planner', roleLabel: 'Event Planner' },
  { slug: 'entrepreneur', jobName: 'Entrepreneur – Town Business Founder', roleLabel: 'Entrepreneur' },
  { slug: 'marketing', jobName: 'Assistant Marketing Manager', roleLabel: 'Marketing Manager' },
  { slug: 'graphic-designer', jobName: 'Assistant Graphic Designer', roleLabel: 'Graphic Designer' },
  { slug: 'journalist', jobName: 'Assistant Journalist', roleLabel: 'Journalist' },
  { slug: 'software-engineer', jobName: 'Assistant Software Engineer', roleLabel: 'Software Engineer' },
];

function rowToLetterCode(row) {
  if (row < 26) return String.fromCharCode(65 + row);
  const first = Math.floor(row / 26) - 1;
  const second = row % 26;
  return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
}

function generateGridCode(row, col) {
  return `${rowToLetterCode(row)}${col + 1}`;
}

function getBiomeForPosition(row, col) {
  const biomeTypes = Object.keys(BIOME_CONFIG);
  const regionSize = 3;
  const regionRow = Math.floor(row / regionSize);
  const regionCol = Math.floor(col / regionSize);
  const seed = (regionRow * 7 + regionCol * 13) % biomeTypes.length;
  const variation = (row * 3 + col * 5) % 100;
  if (variation < 20) return biomeTypes[(seed + 1) % biomeTypes.length];
  return biomeTypes[seed];
}

async function ensureSchool(client) {
  const settings = {
    classes: ['6A'],
    allowed_email_domains: ['@stpeters.co.za'],
    allow_teacher_impersonation: true,
    is_test_school: true,
  };

  let school = (await client.query('SELECT id FROM schools WHERE code = $1', [SCHOOL_CODE])).rows[0];
  if (!school) {
    const inserted = await client.query(
      `INSERT INTO schools (name, code, settings, archived)
       VALUES ($1, $2, $3::jsonb, false)
       RETURNING id`,
      [SCHOOL_NAME, SCHOOL_CODE, JSON.stringify(settings)]
    );
    school = inserted.rows[0];
    console.log(`✅ Created school "${SCHOOL_NAME}" (id ${school.id})`);
  } else {
    await client.query(
      `UPDATE schools SET name = $1, settings = $2::jsonb, archived = false WHERE id = $3`,
      [SCHOOL_NAME, JSON.stringify(settings), school.id]
    );
    console.log(`ℹ️ School "${SCHOOL_NAME}" already exists (id ${school.id})`);
  }
  return school.id;
}

async function ensureTeacher(client, schoolId) {
  const passwordHash = await bcrypt.hash(TEACHER_PASSWORD, 10);
  let teacher = (await client.query('SELECT id FROM users WHERE username = $1', [TEACHER_USERNAME])).rows[0];
  if (!teacher) {
    const inserted = await client.query(
      `INSERT INTO users (username, password_hash, role, first_name, last_name, email, school_id, status)
       VALUES ($1, $2, 'teacher', 'TEST', 'Teacher', $3, $4, 'approved')
       RETURNING id`,
      [TEACHER_USERNAME, passwordHash, TEACHER_USERNAME, schoolId]
    );
    teacher = inserted.rows[0];
    console.log(`✅ Created test teacher (${TEACHER_USERNAME})`);
  } else {
    await client.query(
      `UPDATE users SET password_hash = $1, role = 'teacher', first_name = 'TEST', last_name = 'Teacher',
       email = $2, school_id = $3, status = 'approved' WHERE id = $4`,
      [passwordHash, TEACHER_USERNAME, schoolId, teacher.id]
    );
    console.log(`ℹ️ Updated test teacher (${TEACHER_USERNAME})`);
  }
  return teacher.id;
}

async function loadGlobalJobs(client) {
  const rows = (await client.query(
    `SELECT DISTINCT ON (name) id, name
     FROM jobs
     WHERE school_id IS NULL
     ORDER BY name, id`
  )).rows;
  const byName = new Map(rows.map((r) => [r.name, r.id]));
  return byName;
}

async function ensureStudent(client, schoolId, spec, jobId, passwordHash) {
  const username = `cltest-${spec.slug}`;
  let user = (await client.query('SELECT id FROM users WHERE username = $1', [username])).rows[0];
  if (!user) {
    const inserted = await client.query(
      `INSERT INTO users (
         username, password_hash, role, first_name, last_name, class, email, school_id, status,
         job_id, job_level, job_experience_points, job_started_at, rules_agreed_at
       ) VALUES ($1, $2, 'student', 'TEST', $3, $4, $5, $6, 'approved', $7, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [username, passwordHash, spec.roleLabel, TOWN_CLASS, `${username}@test.civiclab.local`, schoolId, jobId]
    );
    user = inserted.rows[0];
    console.log(`✅ Created student ${username} (${spec.roleLabel})`);
  } else {
    await client.query(
      `UPDATE users SET password_hash = $1, first_name = 'TEST', last_name = $2, class = $3,
       email = $4, school_id = $5, status = 'approved', job_id = $6, job_level = 1,
       job_experience_points = 0, job_started_at = COALESCE(job_started_at, CURRENT_TIMESTAMP),
       rules_agreed_at = COALESCE(rules_agreed_at, CURRENT_TIMESTAMP)
       WHERE id = $7`,
      [passwordHash, spec.roleLabel, TOWN_CLASS, `${username}@test.civiclab.local`, schoolId, jobId, user.id]
    );
    console.log(`ℹ️ Updated student ${username} (${spec.roleLabel})`);
  }

  const account = (await client.query('SELECT id FROM accounts WHERE user_id = $1', [user.id])).rows[0];
  if (!account) {
    const accountNumber = `TST${String(user.id).padStart(6, '0')}`;
    await client.query(
      `INSERT INTO accounts (user_id, account_number, balance, school_id)
       VALUES ($1, $2, $3, $4)`,
      [user.id, accountNumber, STUDENT_BALANCE, schoolId]
    );
  } else {
    await client.query(
      `UPDATE accounts SET balance = $1, school_id = $2 WHERE user_id = $3`,
      [STUDENT_BALANCE, schoolId, user.id]
    );
  }
}

async function ensureTownSettings(client, schoolId) {
  const existing = (await client.query(
    'SELECT id FROM town_settings WHERE school_id = $1 AND class = $2',
    [schoolId, TOWN_CLASS]
  )).rows[0];
  if (!existing) {
    await client.query(
      `INSERT INTO town_settings (class, town_name, tax_rate, school_id, treasury_balance, tax_enabled)
       VALUES ($1, $2, 5.00, $3, $4, true)`,
      [TOWN_CLASS, TOWN_NAME, schoolId, TREASURY_BALANCE]
    );
    console.log(`✅ Created town settings for ${TOWN_NAME} (${TOWN_CLASS})`);
  } else {
    await client.query(
      `UPDATE town_settings SET town_name = $1, treasury_balance = $2, tax_enabled = true WHERE id = $3`,
      [TOWN_NAME, TREASURY_BALANCE, existing.id]
    );
    console.log(`ℹ️ Updated town settings for ${TOWN_NAME} (${TOWN_CLASS})`);
  }
}

async function ensureLandParcels(client, schoolId) {
  const countRow = (await client.query(
    'SELECT COUNT(*)::int AS count FROM land_parcels WHERE school_id = $1 AND town_class = $2',
    [schoolId, TOWN_CLASS]
  )).rows[0];
  if (countRow.count >= 100) {
    console.log(`ℹ️ Land already seeded (${countRow.count} parcels for ${TOWN_CLASS})`);
    return;
  }

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const gridCode = generateGridCode(row, col);
      let biome;
      let value;
      let risk;
      let pros;
      let cons;

      if (gridCode === COMMUNITY_AUCTION_GRID_CODE) {
        biome = 'Indian Ocean Coastal Belt';
        value = COMMUNITY_AUCTION_VALUE;
        risk = 'medium';
        pros = COMMUNITY_AUCTION_PROS;
        cons = COMMUNITY_AUCTION_CONS;
      } else {
        biome = getBiomeForPosition(row, col);
        const config = BIOME_CONFIG[biome];
        value = config.baseValue;
        risk = config.risk;
        pros = config.pros;
        cons = config.cons;
      }

      await client.query(
        `INSERT INTO land_parcels (
           grid_code, row_index, col_index, biome_type, value, risk_level, pros, cons, town_class, school_id
         )
         SELECT $1::varchar, $2, $3, $4::varchar, $5, $6::varchar, $7, $8, $9::varchar, $10::integer
         WHERE NOT EXISTS (
           SELECT 1 FROM land_parcels
           WHERE school_id = $10::integer AND town_class = $9::varchar AND grid_code = $1::varchar
         )`,
        [gridCode, row, col, biome, value, risk, pros, cons, TOWN_CLASS, schoolId]
      );
    }
  }
  console.log(`✅ Seeded land parcels for ${TOWN_NAME} (${TOWN_CLASS})`);
}

async function seedTestSchool() {
  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_PUBLIC_URL required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('railway') ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  try {
    console.log('🌱 Seeding CivicLab Test School...');
    await client.query('BEGIN');

    const schoolId = await ensureSchool(client);
    await ensureTeacher(client, schoolId);
    await ensureTownSettings(client, schoolId);
    await ensureLandParcels(client, schoolId);

    const jobsByName = await loadGlobalJobs(client);
    const passwordHash = await bcrypt.hash(STUDENT_PASSWORD, 10);
    const missingJobs = [];

    for (const spec of TEST_STUDENTS) {
      const jobId = jobsByName.get(spec.jobName);
      if (!jobId) {
        missingJobs.push(spec.jobName);
        continue;
      }
      await ensureStudent(client, schoolId, spec, jobId, passwordHash);
    }

    if (missingJobs.length) {
      throw new Error(`Missing global jobs: ${missingJobs.join(', ')}`);
    }

    await client.query('COMMIT');

    console.log('\n🎉 Test school seed completed.');
    console.log(`   School: ${SCHOOL_NAME} (code: ${SCHOOL_CODE})`);
    console.log(`   Town: ${TOWN_NAME} (${TOWN_CLASS})`);
    console.log(`   Teacher: ${TEACHER_USERNAME} / ${TEACHER_PASSWORD}`);
    console.log(`   Students: ${TEST_STUDENTS.length} accounts, password ${STUDENT_PASSWORD}, R${STUDENT_BALANCE.toLocaleString()} each`);
    console.log(`   Treasury: R${TREASURY_BALANCE.toLocaleString()}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestSchool().catch(() => process.exit(1));
