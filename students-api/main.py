from fastapi import FastAPI

app = FastAPI()

students = {
    1: {"id": 1, "nome": "Ana",   "curso": "Engenharia"},
    2: {"id": 2, "nome": "Bruno", "curso": "Administração"},
}

hist = {
    1: [{"disciplina": "Algoritmos", "nota": 9.0}],
    2: [{"disciplina": "Economia",   "nota": 8.5}],
}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/students/{sid}")
def get_student(sid: int):
    return students.get(sid, {"erro": "não encontrado"})

@app.get("/api/students/{sid}/history")
def get_history(sid: int):
    return hist.get(sid, [])
