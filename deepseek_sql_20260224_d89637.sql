-- Criar tabela de contatos
CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, contacted, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para consultas
    created_at_idx TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_status ON contacts(status);

-- Configurar Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir inserção anônima
CREATE POLICY "Allow anonymous inserts" ON contacts
    FOR INSERT TO anon
    WITH CHECK (true);

-- Política para leitura apenas para usuários autenticados
CREATE POLICY "Allow authenticated select" ON contacts
    FOR SELECT TO authenticated
    USING (true);

-- Política para atualização apenas para usuários autenticados
CREATE POLICY "Allow authenticated update" ON contacts
    FOR UPDATE TO authenticated
    USING (true);