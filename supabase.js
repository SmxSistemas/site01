// ============================================
// CONFIGURAÇÃO DO SUPABASE PARA SMX SISTEMAS
// ============================================

// Importação do Supabase (para uso com módulos)
// Se estiver usando com HTML via script, use a versão CDN abaixo
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Configurações - SUBSTITUA COM SUAS CREDENCIAIS
const SUPABASE_CONFIG = {
    url: 'https://lwozvwtnwiqkeaybveud.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3b3p2d3Rud2lxa2VheWJ2ZXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDE0MzEsImV4cCI6MjA4NzUxNzQzMX0.tsLEZfwPGI9nAsFeNcu8z2sSprdxHszCsQiC1UEiUtc'
};

// Inicialização do cliente Supabase
let supabaseClient = null;

/**
 * Inicializa o cliente Supabase
 * @returns {Object} Cliente Supabase inicializado
 */
function initSupabase() {
    if (!supabaseClient) {
        // Verificar se estamos em ambiente browser com CDN ou Node.js com import
        if (typeof window !== 'undefined' && window.supabase) {
            // Usando CDN
            supabaseClient = window.supabase.createClient(
                SUPABASE_CONFIG.url, 
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                    },
                    realtime: {
                        params: {
                            eventsPerSecond: 10
                        }
                    }
                }
            );
        } else {
            // Usando require ou import (Node.js)
            const { createClient } = require('@supabase/supabase-js');
            supabaseClient = createClient(
                SUPABASE_CONFIG.url, 
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                    }
                }
            );
        }
        
        console.log('✅ Cliente Supabase inicializado');
    }
    
    return supabaseClient;
}

/**
 * Classe principal para operações com o Supabase
 */
class SupabaseService {
    constructor() {
        this.supabase = initSupabase();
    }

    // ============================================
    // OPERAÇÕES COM CONTATOS
    // ============================================

    /**
     * Salva um novo contato no banco de dados
     * @param {Object} contactData - Dados do contato
     * @returns {Promise} Resultado da operação
     */
    async saveContact(contactData) {
        try {
            // Validar dados obrigatórios
            if (!contactData.name || !contactData.email || !contactData.message) {
                throw new Error('Nome, email e mensagem são obrigatórios');
            }

            // Adicionar timestamp e status padrão
            const dataToInsert = {
                ...contactData,
                status: contactData.status || 'pending',
                created_at: new Date().toISOString(),
                // Sanitizar campos
                name: this.sanitizeInput(contactData.name),
                email: this.sanitizeInput(contactData.email).toLowerCase(),
                company: contactData.company ? this.sanitizeInput(contactData.company) : null,
                phone: contactData.phone ? this.sanitizeInput(contactData.phone) : null,
                message: this.sanitizeInput(contactData.message)
            };

            console.log('📝 Salvando contato:', dataToInsert);

            const { data, error } = await this.supabase
                .from('contacts')
                .insert([dataToInsert])
                .select();

            if (error) {
                console.error('❌ Erro Supabase:', error);
                throw error;
            }

            console.log('✅ Contato salvo com sucesso:', data);
            return { success: true, data: data[0] };

        } catch (error) {
            console.error('❌ Erro ao salvar contato:', error);
            return { 
                success: false, 
                error: error.message,
                details: error
            };
        }
    }

    /**
     * Busca todos os contatos (requer autenticação)
     * @param {Object} filters - Filtros para busca
     * @returns {Promise} Lista de contatos
     */
    async getContacts(filters = {}) {
        try {
            let query = this.supabase
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false });

            // Aplicar filtros
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.email) {
                query = query.eq('email', filters.email);
            }

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('❌ Erro ao buscar contatos:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Atualiza o status de um contato (requer autenticação)
     * @param {number} contactId - ID do contato
     * @param {string} status - Novo status
     * @returns {Promise} Resultado da operação
     */
    async updateContactStatus(contactId, status) {
        try {
            const validStatuses = ['pending', 'contacted', 'archived'];
            
            if (!validStatuses.includes(status)) {
                throw new Error('Status inválido');
            }

            const { data, error } = await this.supabase
                .from('contacts')
                .update({ 
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contactId)
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };

        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deleta um contato (requer autenticação)
     * @param {number} contactId - ID do contato
     * @returns {Promise} Resultado da operação
     */
    async deleteContact(contactId) {
        try {
            const { data, error } = await this.supabase
                .from('contacts')
                .delete()
                .eq('id', contactId)
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };

        } catch (error) {
            console.error('❌ Erro ao deletar contato:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // OPERAÇÕES DE AUTENTICAÇÃO
    // ============================================

    /**
     * Faz login com email e senha
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @returns {Promise} Resultado do login
     */
    async login(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            return { 
                success: true, 
                user: data.user,
                session: data.session
            };

        } catch (error) {
            console.error('❌ Erro no login:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Faz logout do usuário atual
     * @returns {Promise} Resultado do logout
     */
    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) throw error;
            
            return { success: true };

        } catch (error) {
            console.error('❌ Erro no logout:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verifica se usuário está autenticado
     * @returns {Object} Usuário atual ou null
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            
            if (error) throw error;
            
            return user;

        } catch (error) {
            console.error('❌ Erro ao buscar usuário:', error);
            return null;
        }
    }

    // ============================================
    // OPERAÇÕES DE INSCRIÇÃO EM NEWSLETTER
    // ============================================

    /**
     * Inscreve email na newsletter
     * @param {string} email - Email para inscrição
     * @returns {Promise} Resultado da inscrição
     */
    async subscribeNewsletter(email) {
        try {
            if (!email || !email.includes('@')) {
                throw new Error('Email inválido');
            }

            const { data, error } = await this.supabase
                .from('newsletter')
                .insert([{
                    email: email.toLowerCase(),
                    subscribed_at: new Date().toISOString(),
                    status: 'active'
                }])
                .select();

            if (error) {
                // Se erro for de duplicata, ignorar
                if (error.code === '23505') {
                    return { 
                        success: true, 
                        message: 'Email já está inscrito',
                        alreadySubscribed: true 
                    };
                }
                throw error;
            }

            return { 
                success: true, 
                data: data[0],
                message: 'Inscrição realizada com sucesso!'
            };

        } catch (error) {
            console.error('❌ Erro na inscrição:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // OPERAÇÕES DE ARQUIVOS E UPLOAD
    // ============================================

    /**
     * Faz upload de um arquivo para o storage
     * @param {File} file - Arquivo para upload
     * @param {string} bucket - Nome do bucket
     * @param {string} path - Caminho no bucket
     * @returns {Promise} URL pública do arquivo
     */
    async uploadFile(file, bucket = 'public', path = '') {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = path ? `${path}/${fileName}` : fileName;

            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) throw error;

            // Pegar URL pública
            const { data: { publicUrl } } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return { 
                success: true, 
                path: filePath,
                url: publicUrl 
            };

        } catch (error) {
            console.error('❌ Erro no upload:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // UTILITÁRIOS
    // ============================================

    /**
     * Sanitiza input para prevenir XSS
     * @param {string} input - Texto para sanitizar
     * @returns {string} Texto sanitizado
     */
    sanitizeInput(input) {
        if (!input) return input;
        
        // Remover tags HTML e caracteres especiais
        return input
            .replace(/<[^>]*>/g, '')
            .replace(/[<>]/g, '')
            .trim();
    }

    /**
     * Valida formato de email
     * @param {string} email - Email para validar
     * @returns {boolean} True se válido
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Formata data para exibição
     * @param {string} dateString - Data em string ISO
     * @returns {string} Data formatada
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ============================================
    // SUBSCRIÇÕES EM TEMPO REAL
    // ============================================

    /**
     * Inscreve para receber atualizações em tempo real
     * @param {string} table - Nome da tabela
     * @param {Function} callback - Função de callback
     * @returns {Object} Subscription object
     */
    subscribeToChanges(table, callback) {
        const subscription = this.supabase
            .channel(`${table}-changes`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table
                },
                (payload) => {
                    console.log('📡 Mudança em tempo real:', payload);
                    callback(payload);
                }
            )
            .subscribe();

        return subscription;
    }

    /**
     * Cancela uma inscrição
     * @param {Object} subscription - Subscription object
     */
    unsubscribe(subscription) {
        if (subscription) {
            this.supabase.removeChannel(subscription);
        }
    }
}

// ============================================
// EXPORTAÇÃO
// ============================================

// Criar instância única (Singleton)
const supabaseService = new SupabaseService();

// Exportar para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = supabaseService;
}

// Exportar para uso no navegador
if (typeof window !== 'undefined') {
    window.SupabaseService = supabaseService;
    window.supabaseService = supabaseService;
    
    // Inicializar quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Serviço Supabase carregado e pronto para uso');
    });
}

// Export default para ES6 modules
export default supabaseService;