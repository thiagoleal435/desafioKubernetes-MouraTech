import express from "express";
const app = express();
const PORT = 3000;

const data = [
  { id: 1, nome: "Engenharia de Software", modalidade: "EAD" },
  { id: 2, nome: "Administração", modalidade: "Presencial" }
];

app.get("/api/courses", (req, res) => {
  const { q = "", mod = "" } = req.query;
  let out = data.filter(c =>
    c.nome.toLowerCase().includes(q.toLowerCase())
    && (mod ? c.modalidade === mod : true)
  );
  res.json(out);
});

// 🔧 NOVO:
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Courses API on ${PORT}`));
