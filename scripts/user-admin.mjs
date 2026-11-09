import { neon } from '@neondatabase/serverless';
import { randomBytes, randomUUID, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!url) {
  console.error(
    'Falta DATABASE_URL. Ejecuta el comando con `npm run users:list` para cargar .env.local.'
  );
  process.exit(1);
}

const sql = neon(url);
const [command, ...args] = process.argv.slice(2);

function normalize(username) {
  return username.trim().toLowerCase();
}

function isValidUsername(username) {
  return /^[a-z0-9_]{3,20}$/.test(normalize(username));
}

function isValidPassword(password) {
  return password.length >= 8 && password.length <= 128;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `scrypt$16384$8$1$${salt}$${derived.toString('hex')}`;
}

async function listUsers() {
  const rows = await sql`
    SELECT username, display_name, created_at
    FROM users
    ORDER BY created_at
  `;
  if (rows.length === 0) {
    console.log('No hay usuarios.');
    return;
  }
  console.log(`${rows.length} usuario(s):`);
  for (const row of rows) {
    console.log(
      `- ${row.username} | ${row.display_name} | ${new Date(row.created_at).toISOString()}`
    );
  }
}

async function createUser(usernameInput, password) {
  if (!usernameInput || !password) {
    console.error('Uso: users:create -- <usuario> <contraseña>');
    process.exit(1);
  }
  if (!isValidUsername(usernameInput)) {
    console.error(
      'Usuario inválido: 3-20 caracteres, letras minúsculas, números o guion bajo.'
    );
    process.exit(1);
  }
  if (!isValidPassword(password)) {
    console.error('La contraseña debe tener entre 8 y 128 caracteres.');
    process.exit(1);
  }

  const username = normalize(usernameInput);
  const displayName = usernameInput.trim();
  const passwordHash = await hashPassword(password);

  try {
    await sql`
      INSERT INTO users (id, username, display_name, password_hash)
      VALUES (${randomUUID()}, ${username}, ${displayName}, ${passwordHash})
    `;
    console.log(`Usuario creado: ${username}`);
  } catch (error) {
    if (error.code === '23505') {
      console.error(`El usuario ${username} ya existe.`);
      process.exit(1);
    }
    throw error;
  }
}

async function deleteUser(usernameInput, confirmed) {
  if (!usernameInput) {
    console.error('Uso: users:delete -- <usuario> --yes');
    process.exit(1);
  }
  if (!confirmed) {
    console.error(
      `Esto borrará el usuario ${usernameInput} y todo su progreso. Añade --yes para confirmar.`
    );
    process.exit(1);
  }

  const username = normalize(usernameInput);
  const rows = await sql`
    DELETE FROM users
    WHERE username = ${username}
    RETURNING username
  `;
  console.log(
    rows.length > 0
      ? `Usuario eliminado: ${username}`
      : `No existe el usuario ${username}.`
  );
}

async function changePassword(usernameInput, password) {
  if (!usernameInput || !password) {
    console.error('Uso: users:password -- <usuario> <nueva-contraseña>');
    process.exit(1);
  }
  if (!isValidPassword(password)) {
    console.error('La contraseña debe tener entre 8 y 128 caracteres.');
    process.exit(1);
  }

  const username = normalize(usernameInput);
  const passwordHash = await hashPassword(password);
  const rows = await sql`
    UPDATE users
    SET password_hash = ${passwordHash}
    WHERE username = ${username}
    RETURNING username
  `;
  console.log(
    rows.length > 0
      ? `Contraseña actualizada para ${username}.`
      : `No existe el usuario ${username}.`
  );
}

switch (command) {
  case 'list':
    await listUsers();
    break;
  case 'create':
    await createUser(args[0], args[1]);
    break;
  case 'delete':
    await deleteUser(args[0], args.includes('--yes'));
    break;
  case 'password':
    await changePassword(args[0], args[1]);
    break;
  default:
    console.log(`Uso:
  npm run users:list
  npm run users:create -- <usuario> <contraseña>
  npm run users:password -- <usuario> <nueva-contraseña>
  npm run users:delete -- <usuario> --yes`);
}
