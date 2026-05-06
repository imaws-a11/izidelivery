-- Trigger function para garantir que entregadores não aprovados NUNCA fiquem online
CREATE OR REPLACE FUNCTION public.check_driver_approval_before_online()
RETURNS trigger AS $$
BEGIN
  -- Se o campo is_online estiver sendo definido como true, mas is_active é false
  IF NEW.is_online = true AND NEW.is_active = false THEN
    -- Reverte silenciosamente a tentativa de ficar online
    -- Isso garante que chamadas de API feitas diretamente ou via "F5" sejam neutralizadas no banco de dados
    NEW.is_online := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove o trigger se ele já existir (para evitar duplicações)
DROP TRIGGER IF EXISTS trigger_enforce_driver_approval_online ON public.drivers_delivery;

-- Cria o trigger que executa antes de inserir ou atualizar a tabela de entregadores
CREATE TRIGGER trigger_enforce_driver_approval_online
BEFORE INSERT OR UPDATE ON public.drivers_delivery
FOR EACH ROW
EXECUTE FUNCTION public.check_driver_approval_before_online();
