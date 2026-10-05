import { useEffect, useState } from "react";
import "./App.css";

const API = "https://dummyjson.com/quotes";
const LIMIT = 10;

export default function App() {
  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // form state (used for both create and edit)
  const [form, setForm] = useState({ quote: "", author: "" });
  const [editingId, setEditingId] = useState(null);

  // READ (list with pagination)
  const fetchQuotes = async (pageNo = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}?limit=${LIMIT}&skip=${pageNo * LIMIT}`);
      if (!res.ok) throw new Error("Failed to load quotes");
      const data = await res.json();
      setQuotes(data.quotes);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({ quote: "", author: "" });
    setEditingId(null);
  };

  // CREATE
  const createQuote = async () => {
    const res = await fetch(`${API}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote: form.quote, author: form.author }),
    });
    if (!res.ok) throw new Error("Failed to add quote");
    const created = await res.json();
    // Show the new quote at the top of the current list
    setQuotes((prev) => [created, ...prev]);
    setTotal((t) => t + 1);
  };

  // UPDATE
  const updateQuote = async () => {
    const res = await fetch(`${API}/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote: form.quote }),
    });
    // DummyJSON doesn't save new items, so updating a quote you just added
    // returns 404. We still update the UI so the demo feels complete.
    const updated = res.ok ? await res.json() : {};
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === editingId
          ? { ...q, ...updated, quote: form.quote, author: form.author }
          : q
      )
    );
  };

  const handleSubmit = async () => {
    if (!form.quote.trim() || !form.author.trim()) {
      setError("Quote and author are both required");
      return;
    }
    setError("");
    try {
      if (editingId) await updateQuote();
      else await createQuote();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  // DELETE
  const deleteQuote = async (id) => {
    if (!window.confirm("Delete this quote?")) return;
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      setError("Failed to delete quote");
    }
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setForm({ quote: q.quote, author: q.author });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="app">
      <h1 className="title">Quotes Manager</h1>

      {error && <p className="error">{error}</p>}

      <div className="form">
        <h2 className="form-title">
          {editingId ? `Edit quote #${editingId}` : "Add a quote"}
        </h2>
        <textarea className="input" name="quote" placeholder="Quote text" rows="3" value={form.quote} onChange={handleChange}
        />
        <input className="input" name="author" placeholder="Author" value={form.author} onChange={handleChange}
        />
        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editingId ? "Save quote" : "Add quote"}
          </button>
          {editingId && (
            <button className="btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="message">Loading quotes...</p>
      ) : quotes.length === 0 ? (
        <p className="message">No quotes found. Add new one.</p>
      ) : (
        <ul className="list">
          {quotes.map((q) => (
            <li className="card" key={q.id}>
              <p className="card-quote">“{q.quote}”</p>
              <p className="card-author">— {q.author}</p>
              <div className="card-actions">
                <button className="btn" onClick={() => startEdit(q)}>
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => deleteQuote(q.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="pagination">
        <button className="btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span className="page-info">
          Page {page + 1} of {totalPages || 1}
        </span>
        <button className="btn" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
