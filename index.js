import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_KEY são obrigatórios');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}` );

  try {
    // ROTA: /api/contacts
    if (pathname === '/api/contacts') {
      if (req.method === 'POST') {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
          return res.status(400).json({ error: 'Nome, email e mensagem são obrigatórios' });
        }

        const { data, error } = await supabase
          .from('contacts')
          .insert([{ name, email, phone: phone || null, message, created_at: new Date().toISOString() }])
          .select();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(201).json({ success: true, message: 'Contato salvo com sucesso!', data });
      }

      if (req.method === 'GET') {
        const token = req.headers.authorization?.split(' ')[1];
        if (token !== process.env.ADMIN_TOKEN) {
          return res.status(401).json({ error: 'Não autorizado' });
        }

        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true, data });
      }
    }

    // ROTA: /api/analytics
    if (pathname === '/api/analytics') {
      if (req.method === 'POST') {
        const { event, data } = req.body;

        if (!event) {
          return res.status(400).json({ error: 'Evento é obrigatório' });
        }

        const { error } = await supabase
          .from('analytics')
          .insert([{ event, data: data || null, created_at: new Date().toISOString() }]);

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(201).json({ success: true, message: 'Evento registrado com sucesso!' });
      }

      if (req.method === 'GET') {
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
    }

    return res.status(404).json({ error: 'Rota não encontrada' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
