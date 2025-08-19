CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalog (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  preco NUMERIC(10, 2) NOT NULL,
  estoque INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  item_id INT REFERENCES catalog(id),
  quantity INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'RECEBIDO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (nome, email, senha) VALUES
('Alexia Alves', 'alexia@email.com', '123456'),
('Raphaela Samille', 'samille@email.com', 'abcdef');

INSERT INTO catalog (nome, preco, estoque) VALUES
('Teclado Mecânico', 350.50, 20),
('Mouse RGB', 120.00, 50),
('Monitor Ultrawide', 1800.00, 10);