# Edge Function: reset-password

Esta função permite que admins enviem e-mails de redefinição de senha para usuários.

## Como fazer o deploy

### 1. Instalar o Supabase CLI
```bash
npm install -g supabase
```

### 2. Fazer login
```bash
supabase login
```

### 3. Linkar ao projeto
```bash
supabase link --project-ref aygklcvmformzblzomie
```

### 4. Fazer deploy da função
```bash
supabase functions deploy reset-password
```

### 5. Configurar variáveis de ambiente no Supabase
No painel do Supabase → Settings → Edge Functions → adicione:
- `MASTER_ADMIN_EMAIL` = seu e-mail de admin master

> As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`
> são injetadas automaticamente pelo Supabase — não precisa configurar.

## Como funciona

1. O admin clica em "Resetar Senha" no painel
2. O App.tsx chama esta Edge Function passando o `userId` do cliente
3. A função verifica se o caller é um admin autenticado
4. Usa a `service_role` para gerar um link de recuperação
5. O Supabase envia o e-mail automaticamente para o cliente
6. A ação é registrada no log de auditoria

## Segurança

- Apenas admins autenticados podem chamar esta função
- A `service_role` nunca é exposta ao frontend
- Todas as chamadas são registradas no `audit_logs_delivery`
