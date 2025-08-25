'''# UUBJ • Portal Universitário (Multi‑Serviços com Docker e Kubernetes)

Este repositório simula o portal de uma universidade com **quatro serviços** rodando juntos:
1. **Frontend** (site estático em Nginx)  
2. **Gateway** (Nginx como reverse proxy)  
3. **Courses API** (Node/Express)  
4. **Students API** (Python/FastAPI) 

A ideia é mostrar como containerizar e orquestrar serviços, primeiro com **Docker Compose** e depois em **Kubernetes (Minikube)**, mantendo tudo simples e fácil de entender.

---

## Visão geral da arquitetura

```
[ Navegador ]
      │
      ▼
  [Gateway Nginx]
    ├── /           → [Frontend estático]
    ├── /api/courses → [Courses API - Node 3000]
    └── /api/students → [Students API - FastAPI 8000]
```

- No **Docker Compose**, o gateway expõe `http://localhost:8080`.
- No **Kubernetes**, o gateway expõe um **NodePort 30080** (via Minikube).

---

## Estrutura (pastas principais)

```
uubj-portal/
├─ frontend-uubj/          # Site estático (HTML/CSS/JS) servido por Nginx
│  └─ Dockerfile
├─ gateway/                # Nginx (reverse proxy)
│  ├─ Dockerfile
│  └─ nginx.conf           # usado no Docker Compose
├─ courses-api/            # Node + Express
│  ├─ Dockerfile
│  ├─ package.json
│  └─ server.js
├─ students-api/           # FastAPI + Uvicorn
│  ├─ Dockerfile
│  ├─ main.py
│  └─ requirements.txt
├─ docker-compose.yml      # stack local com 4 serviços
└─ k8s/                    # manifests para Kubernetes (namespace, deploys, services, configmap, secret)
   ├─ namespace.yaml
   ├─ configmap-gateway.yaml
   ├─ gateway-deploy.yaml
   ├─ frontend-deploy.yaml
   ├─ courses-deploy.yaml
   ├─ students-deploy.yaml
   └─ secret-app.yaml      # exemplo de Secret (opcional)
```

---

## O que foi feito (em poucas palavras)

- Cada serviço tem seu **Dockerfile** próprio.
- No **Compose**, só o **gateway** expõe porta (`8080:80`); os demais ficam atrás dele (com `expose`).
- No **Kubernetes**:
  - Criamos o namespace **`uubj`**.
  - Cada serviço tem um **Deployment** + **Service** (`ClusterIP`), exceto o gateway que expõe **NodePort 30080**.
  - O **gateway** recebe sua config via **ConfigMap** (`configmap-gateway.yaml`), incluindo `location /health`.
  - Adicionamos **readiness** e **liveness probes** para observar a saúde dos pods.
- Ajustes de última milha:
  - **Courses API** ganhou `GET /health`.
  - **Gateway** ganhou `location /health` e `livenessProbe` que aponta para esse endpoint.

---

## Como rodar localmente (Docker Compose)

> Requisitos: Docker Desktop (ou Docker Engine) + Docker Compose

```bash
# Na raiz do projeto (onde está docker-compose.yml)
docker compose up -d --build

# Abrir o portal
# http://localhost:8080
```

**Testes rápidos**

```bash
# Frontend (via gateway)
curl.exe http://localhost:8080/

# Cursos (via gateway → courses-api)
curl.exe "http://localhost:8080/api/courses?q="

# Alunos (via gateway → students-api)
curl.exe http://localhost:8080/api/students/1

# Health do gateway (no Compose já existia esse /health)
curl.exe http://localhost:8080/health
```

> Para encerrar: `docker compose down`

---

## Como rodar no Kubernetes (Minikube)

> Requisitos: Minikube + kubectl

1) **Suba o cluster e use o Docker do Minikube** (para construir as imagens com as mesmas tags usadas nos manifests):

```bash
minikube start
eval $(minikube -p minikube docker-env)
```

2) **Build das imagens** (tags batem com os Deployments):

```bash
docker build -t uubj-frontend:dev ./frontend-uubj
docker build -t uubj-courses:dev  ./courses-api
docker build -t uubj-students:dev ./students-api
docker build -t uubj-gateway:dev  ./gateway
```

3) **Aplicar manifests**:

```bash
kubectl apply -f ./k8s/namespace.yaml
kubectl -n uubj apply -f ./k8s
kubectl -n uubj rollout restart deploy/gateway
kubectl -n uubj get deploy,po,svc

# Como o ConfigMap do gateway controla o Nginx, garanta um restart do deploy:
kubectl -n uubj rollout restart deploy/gateway
kubectl -n uubj get deploy,po,svc
```

4) **Acessar o serviço**:

```bash
# Abre o NodePort do gateway e imprime a URL
minikube service -n uubj gateway --url
# Ex.: http://127.0.0.1:30080
```

**Testes rápidos (K8s)**

```bash
URL=$(minikube service -n uubj gateway --url)

curl -i "$URL/health"                 # health do gateway (NGINX)
curl -i "$URL/api/courses?q="         # lista de cursos (Node)
curl -i "$URL/api/students/1"         # dados do aluno (FastAPI)
```

---

## Endpoints principais

- **Frontend**: `GET /`  
- **Gateway (NGINX)**:
  - `GET /health` → retorna `200 ok` (liveness do gateway)
  - roteia `/:` para o frontend
  - roteia `/api/courses` → Courses API (porta 3000)
  - roteia `/api/students` → Students API (porta 8000)
- **Courses API** (Node/Express):
  - `GET /api/courses?q=&mod=` → filtra por nome e modalidade
  - `GET /health` → `{"status":"ok"}`
- **Students API** (FastAPI):
  - `GET /api/students/{sid}`
  - `GET /api/students/{sid}/history`
  - `GET /health` → `{"status":"ok"}`

---

## Dicas e problemas comuns

- **Página abre mas APIs não respondem**  
  Verifique se os **nomes de Service** batem com o que o Nginx usa (`frontend`, `courses-api`, `students-api`).

- **No K8s, mudei o ConfigMap e nada aconteceu**  
  ConfigMaps não reiniciam pods automaticamente. Rode:
  ```bash
  kubectl -n uubj rollout restart deploy/gateway
  ```

- **Minikube não encontra as imagens**  
  Use o Docker do Minikube antes do `docker build`:
  ```bash
  eval $(minikube -p minikube docker-env)
  ```

- **Quero usar Secrets**  
  O arquivo `k8s/secret-app.yaml` já existe como exemplo. Para consumir no app, adicione em um Deployment:
  ```yaml
  envFrom:
    - secretRef:
        name: portal-secrets
  ```
  E leia `APP_TOKEN` no seu código.

---

## Próximos passos (ideias)

- Adicionar **Ingress** (em vez de NodePort) e TLS no Minikube.  
- Habilitar **logs estruturados** e **métricas**.  
- Configurar **CI/CD** para build & push das imagens.  
- Usar **liveness** no frontend também (ex.: `GET /index.html`).

---

## Requisitos de ambiente (resumo)

- Docker e Docker Compose (para rodar local)  
- Minikube e kubectl (para Kubernetes)  
- Node 20+ para desenvolver a Courses API  
- Python 3.11+ para desenvolver a Students API

---

Feito com foco didático: rodar local, depois orquestrar no K8s, mantendo tudo claro e fácil de testar.
'''