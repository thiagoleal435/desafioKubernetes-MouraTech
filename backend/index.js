import express from 'express';
import pg from 'pg';

const app = express();
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST || 'postgres-db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'rootpassword',
  database: process.env.DB_NAME || 'marketplace',
};

// Conexão com o banco de dados
async function createDBConnection() {
  const client = new pg.Client(dbConfig);
  await client.connect();
  return client;
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'users/catalog' });
});

// Endpoint para cadastrar usuário (users)
app.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  console.log(`[POST /users/register] Dados recebidos:`, req.body);
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  const client = await createDBConnection();
  try {
    const query = 'INSERT INTO users (nome, email, senha) VALUES ($1, $2, $3) RETURNING id';
    const result = await client.query(query, [nome, email, senha]);
    console.log(`[POST /users/register] Usuário cadastrado: id=${result.rows[0].id}`);
    res.status(201).json({ id: result.rows[0].id, nome, email });
  } catch (err) {
    console.error(`[POST /users/register] Erro ao cadastrar usuário:`, err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

// Endpoint para listar usuários (users)
app.get('/users', async (req, res) => {
  console.log(`[GET /users] Listando usuários`);
  const client = await createDBConnection();
  try {
    const result = await client.query('SELECT id, nome, email FROM users');
    console.log(`[GET /users] ${result.rows.length} usuários encontrados.`);
    res.json(result.rows);
  } catch (err) {
    console.error(`[GET /users] Erro ao listar usuários:`, err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});


// Endpoint para listar itens do catálogo (catalog)
app.get('/catalog/items', async (req, res) => {
  console.log(`[GET /catalog/items] Listando itens do catálogo`);
  const client = await createDBConnection();
  try {
    const result = await client.query('SELECT id, nome, preco, estoque FROM catalog');
    console.log(`[GET /catalog/items] ${result.rows.length} itens encontrados.`);
    res.json(result.rows);
  } catch (err) {
    console.error(`[GET /catalog/items] Erro ao listar itens:`, err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

// Endpoint para adicionar item ao catálogo (catalog)
app.post('/catalog/items', async (req, res) => {
  const { nome, preco, estoque } = req.body;
  console.log(`[POST /catalog/items] Dados recebidos:`, req.body);
  if (!nome || !preco || !estoque) {
    return res.status(400).json({ error: 'Nome, preço e estoque são obrigatórios.' });
  }

  const client = await createDBConnection();
  try {
    const query = 'INSERT INTO catalog (nome, preco, estoque) VALUES ($1, $2, $3) RETURNING id';
    const result = await client.query(query, [nome, preco, estoque]);
    console.log(`[POST /catalog/items] Item adicionado: id=${result.rows[0].id}`);
    res.status(201).json({ id: result.rows[0].id, nome, preco, estoque });
  } catch (err) {
    console.error(`[POST /catalog/items] Erro ao adicionar item:`, err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

const PORT = 80;
app.listen(PORT, () => {
  console.log(`Servidor Node.js rodando na porta ${PORT}`);
});