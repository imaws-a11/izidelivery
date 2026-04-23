const fs = require('fs');
const path = require('path');

const apps = [
  'app-admin-completo',
  'app-entregador-completo',
  'app-servicos-completo'
];

const REQUIRED_KEY = 'VITE_GOOGLE_MAPS_API_KEY';
const EXPECTED_VALUE = 'AIzaSyAIg4IxHwCzYH6dfYdpn7zMA70h-tE7-V0';

console.log("🛡️  Iniciando Validação de Blindagem do Google Maps...\n");

apps.forEach(app => {
  const envPath = path.join(__dirname, '..', app, '.env');
  console.log(`Verificando ${app}...`);
  
  if (!fs.existsSync(envPath)) {
    console.error(`❌ Erro: Arquivo .env não encontrado em ${app}`);
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const keyLine = lines.find(line => line.startsWith(REQUIRED_KEY + '='));

  if (!keyLine) {
    console.error(`❌ Erro: ${REQUIRED_KEY} ausente em ${app}/.env`);
  } else {
    const value = keyLine.split('=')[1].trim();
    if (value === EXPECTED_VALUE) {
      console.log(`✅ Sucesso: Chave correta encontrada em ${app}`);
    } else {
      console.warn(`⚠️  Atenção: Chave em ${app} é diferente da esperada!`);
      console.warn(`   Encontrada: ${value}`);
      console.warn(`   Esperada:   ${EXPECTED_VALUE}`);
    }
  }
  console.log("");
});

console.log("🏁 Validação concluída.");
