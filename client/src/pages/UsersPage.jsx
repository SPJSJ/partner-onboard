import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { TextField, SelectField } from "../components/Field.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

const emptyForm = { email: "", password: "", role: "viewer" };

export default function UsersPage() {
  const { email: currentEmail } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  function load() {
    setLoading(true);
    api
      .listUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setErrors({});
    setNotice("");
    setSubmitting(true);
    try {
      await api.createUser(form);
      setForm(emptyForm);
      setNotice(`User ${form.email} created.`);
      load();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setNotice(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleRole(user) {
    const nextRole = user.role === "admin" ? "viewer" : "admin";
    try {
      await api.updateUser(user.id, { role: nextRole });
      load();
    } catch (err) {
      alert(err.message || "Could not change role");
    }
  }

  async function resetPassword(user) {
    const password = window.prompt(`New password for ${user.email} (min 8 characters):`);
    if (!password) return;
    try {
      await api.updateUser(user.id, { password });
      alert("Password updated.");
    } catch (err) {
      alert(err.message || "Could not reset password");
    }
  }

  async function removeUser(user) {
    if (!window.confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    try {
      await api.deleteUser(user.id);
      load();
    } catch (err) {
      alert(err.message || "Could not delete user");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users and Roles</h1>
          <p className="page-subtitle">Manage who can access this admin tool</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Add User</div>
        <hr className="card-divider" />
        {notice && <div className="alert alert-success">{notice}</div>}
        <form onSubmit={handleCreate}>
          <div className="field-row">
            <TextField
              id="new-user-email"
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errors.email}
            />
            <TextField
              id="new-user-password"
              label="Password"
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              error={errors.password}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="field-row single">
            <SelectField
              id="new-user-role"
              label="Role"
              required
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              error={errors.role}
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </SelectField>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge-blue" : "badge-amber"}`}>{u.role}</span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggleRole(u)}>
                        Make {u.role === "admin" ? "Viewer" : "Admin"}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => resetPassword(u)}>
                        Reset Password
                      </button>
                      <button
                        type="button"
                        className="btn-danger-text"
                        disabled={u.email === currentEmail}
                        onClick={() => removeUser(u)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
