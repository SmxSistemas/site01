# SMX Sistemas - Site Institucional

Site institucional da SMX Sistemas com integração Supabase para captura de contatos.

## 🚀 Tecnologias

- HTML5, CSS3, JavaScript (Vanilla)
- [Supabase](https://supabase.com/) - Backend como serviço
- Font Awesome - Ícones
- Unsplash - Imagens de stock

## 📋 Funcionalidades

- ✅ Design responsivo e moderno
- ✅ Formulário de contato com salvamento no Supabase
- ✅ Menu mobile interativo
- ✅ Animações suaves
- ✅ SEO otimizado
- ✅ Notificações em tempo real

## 🛠️ Configuração

### 1. Criar conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub ou email
4. Crie um novo projeto

### 2. Configurar banco de dados

Execute este SQL no editor SQL do Supabase:

```sql
-- Criar tabela de contatos
CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);

-- Configurar RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Permitir inserção anônima
CREATE POLICY "Allow anonymous inserts" ON contacts
    FOR INSERT TO anon
    WITH CHECK (true);