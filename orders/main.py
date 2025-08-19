import os
import psycopg2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class OrderCreate(BaseModel):
    user_id: int
    item_id: int
    quantity: int

class OrderStatusUpdate(BaseModel):
    status: str

DB_HOST = os.getenv('DB_HOST', 'postgres-db')
DB_NAME = os.getenv('DB_NAME', 'marketplace')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASS', 'rootpassword')

# Conexão com o banco de dados
def get_db_connection():
    try:
        conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        return None

# Health Check Endpoint
@app.get('/health')
def health_check():
    return {'status': 'ok', 'service': 'orders'}

# Endpoint para criar pedido
@app.post('/create')
def create_order(order: OrderCreate):
    print(f"[POST /orders/create] Recebendo pedido: {order.dict()}")
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Erro de conexão com o banco de dados")
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO orders (user_id, item_id, quantity, status) VALUES (%s, %s, %s, %s) RETURNING id",
            (order.user_id, order.item_id, order.quantity, 'RECEBIDO')
        )
        order_id = cursor.fetchone()[0]
        conn.commit()
        print(f"[POST /orders/create] Pedido criado: id={order_id}")
        return {'message': 'Pedido criado com sucesso', 'order_id': order_id}
    except Exception as e:
        print(f"[POST /orders/create] Erro ao criar pedido: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# Endpoint para consultar pedidos de um usuário
@app.get('/user/{user_id}')
def get_user_orders(user_id: int):
    print(f"[GET /orders/user/{user_id}] Consultando pedidos")
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Erro de conexão com o banco de dados")
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, user_id, item_id, quantity, status, created_at FROM orders WHERE user_id = %s", (user_id,))
        orders = cursor.fetchall()
        print(f"[GET /orders/user/{user_id}] {len(orders)} pedidos encontrados.")
        return [{'id': o[0], 'user_id': o[1], 'item_id': o[2], 'quantity': o[3], 'status': o[4], 'created_at': o[5]} for o in orders]
    except Exception as e:
        print(f"[GET /orders/user/{user_id}] Erro ao consultar pedidos: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# Endpoint para mudar status do pedido
@app.put('/status/{order_id}')
def update_order_status(order_id: int, status_update: OrderStatusUpdate):
    print(f"[PUT /orders/status/{order_id}] Atualizando status para: {status_update.status}")
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Erro de conexão com o banco de dados")
    
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (status_update.status, order_id))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        print(f"[PUT /orders/status/{order_id}] Status atualizado com sucesso.")
        return {'message': 'Status do pedido atualizado com sucesso'}
    except Exception as e:
        print(f"[PUT /orders/status/{order_id}] Erro ao atualizar status: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()