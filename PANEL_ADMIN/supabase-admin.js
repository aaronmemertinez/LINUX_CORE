// El acceso se valida en una Edge Function de Supabase; no se necesita iniciar sesión.
const SUPABASE_URL = "https://dunybrplrpprexggkrgj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_mo_3vIz4qpf7TeWKkJ4qXw_WqzoNdSG";
const PANEL_ENDPOINT = `${SUPABASE_URL}/functions/v1/panel-admin-clave`;
let clavePanel = '';

async function llamarPanel(action, datos = {}) {
  if (!clavePanel) {
    clavePanel = window.prompt('Introduce la contraseña del panel administrativo:') || '';
    if (!clavePanel) throw new Error('Acceso cancelado.');
  }
  const ejecutar = async () => fetch(PANEL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ action, password: clavePanel, ...datos })
  });
  let respuesta = await ejecutar();
  let resultado = await respuesta.json().catch(() => ({}));
  if (respuesta.status === 401) {
    clavePanel = '';
    clavePanel = window.prompt('Contraseña incorrecta. Inténtalo de nuevo:') || '';
    if (!clavePanel) throw new Error('Acceso cancelado.');
    respuesta = await ejecutar();
    resultado = await respuesta.json().catch(() => ({}));
  }
  if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo completar la operación.');
  return resultado.data;
}
