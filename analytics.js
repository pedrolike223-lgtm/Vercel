import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
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
      const { event, data } = req.body;

      if (!event) {
        return res.status(400).json({ error: 'Evento é obrigatório' });
      }

      // Salvar evento no Supabase
      const { error } = await supabase
        .from('analytics')
        .insert([
          {
            event,
            data: data || null,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ 
        success: true, 
        message: 'Evento registrado com sucesso!' 
      });
    }

    if (req.method === 'GET') {
      // Obter analytics (com autenticação simples)
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
