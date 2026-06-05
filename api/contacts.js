import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_KEY são obrigatórios');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const { name, email, phone, message } = req.body;

      // Validação básica
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Nome, email e mensagem são obrigatórios' });
      }

      // Salvar no Supabase
      const { data, error } = await supabase
        .from('contacts')
        .insert([
          {
            name,
            email,
            phone: phone || null,
            message,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error('Erro ao salvar contato:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ 
        success: true, 
        message: 'Contato salvo com sucesso!',
        data 
      });
    }

    if (req.method === 'GET') {
      // Obter contatos (com autenticação simples)
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao obter contatos:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ error: error.message });
  }
}
