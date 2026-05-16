# Manual de Integração API - IZI Delivery

Este documento descreve como integrar sistemas externos à plataforma IZI Delivery para solicitação de entregas avulsas.

## 1. Configurações Iniciais

*   **URL Base:** `https://cmkylgblkiceiclbewxr.supabase.co/functions/v1/integration-api`
*   **Autenticação:** Bearer Token via Header HTTP.
*   **Content-Type:** `application/json`

**Exemplo de Header:**
```http
Authorization: Bearer SUA_CHAVE_API_AQUI
Content-Type: application/json
```

---

## 2. Endpoints

### 2.1 Cotação de Frete (`POST /quote`)
Utilizado para estimar o valor da entrega antes de criar o pedido.

**Request Body:**
```json
{
  "pickup_address": "Rua Exemplo, 100, Centro",
  "delivery_address": "Av. Principal, 500, Bairro Novo"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "distance_km": 2.5,
  "estimated_fee": 8.50,
  "currency": "BRL"
}
```

---

### 2.2 Criar Pedido de Entrega (`POST /orders`)
Cria uma nova solicitação de entrega avulsa no sistema IZI.

**Request Body:**
```json
{
  "external_id": "ID-DO-SEU-SISTEMA-001",
  "customer": {
    "name": "Nome do Cliente",
    "phone": "31999999999"
  },
  "pickup_address": "Endereço de Retirada, 10, Bairro",
  "delivery_address": "Endereço de Entrega, 500, Bairro",
  "payment": {
    "method": "pix", 
    "total_value": 50.00
  },
  "notes": "Observações da entrega"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "izi_order_id": "uuid-do-pedido",
  "status": "waiting_driver",
  "tracking_url": "https://app.izidelivery.com/tracking/IZI-XXXX"
}
```

---

### 2.3 Consultar Status do Pedido (`GET /orders/{id}`)
Retorna o status atual do pedido e informações do entregador (se houver). O `{id}` pode ser o `izi_order_id` retornado na criação.

**Response (200 OK):**
```json
{
  "success": true,
  "izi_order_id": "uuid-do-pedido",
  "external_id": "ID-DO-SEU-SISTEMA-001",
  "status": "in_transit",
  "driver": {
    "name": "Nome do Entregador",
    "phone": "31999998888",
    "vehicle": "Moto"
  }
}
```

---

## 3. Status de Pedido

| Status | Descrição |
| :--- | :--- |
| `waiting_driver` | Pedido criado, aguardando entregador aceitar. |
| `accepted` | Um entregador aceitou e está indo para a retirada. |
| `in_transit` | Pedido retirado e em deslocamento para o destino. |
| `completed` | Entrega realizada com sucesso. |
| `cancelled` | Pedido cancelado. |

---

## 4. Ambiente de Testes (Sandbox)

Para validar sua integração, utilize as credenciais abaixo:

*   **Chave de API de Teste:** `izi_test_key_2026_safe`
*   **Nota:** Pedidos criados com esta chave aparecerão no painel administrativo como "Entrega Avulsa" vinculada ao American Burguer para fins de teste.

---
© 2026 IZI Delivery - Todos os direitos reservados.
