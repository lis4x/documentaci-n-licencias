"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setLoading(true);
      fetch("/api/getData")
        .then((res) => res.json())
        .then((resData) => {
          if (Array.isArray(resData)) {
            setData(resData);
          } else {
            setData([]);
          }
          setLoading(false);
        })
        .catch(() => {
          setData([]);
          setLoading(false);
        });
    }
  }, [session]);

  if (status === "loading") return <div style={styles.center}>Cargando seguridad...</div>;

  if (!session) {
    return (
      <div style={styles.center}>
        <h1>Base de Datos USMS</h1>
        <p>Acceso restringido únicamente a personal autorizado.</p>
        <button onClick={() => signIn("discord")} style={styles.button}>
          Iniciar Sesión con Discord
        </button>
      </div>
    );
  }

  if (session.user.hasRole === false) {
    return (
      <div style={styles.center}>
        <h1 style={{color: "#ff4444"}}>Acceso Denegado</h1>
        <p>No posees el rol activo de USMS en el servidor de Discord.</p>
        <button onClick={() => signOut()} style={styles.buttonAlt}>Cerrar Sesión</button>
      </div>
    );
  }

  const safeData = Array.isArray(data) ? data : [];
  const filteredData = safeData.filter((row) =>
    Array.isArray(row) && row.some((cell) => String(cell).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>Panel de Consulta USMS</h2>
        <button onClick={() => signOut()} style={styles.buttonAlt}>Salir</button>
      </header>
      
      <input
        type="text"
        placeholder="Buscar por DNI, Nombre o Placa..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.input}
      />

      {loading ? (
        <p>Sincronizando con la base de datos...</p>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cIndex) => (
                      <td key={cIndex} style={styles.td}>{String(cell)}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.td}>No se encontraron registros o la tabla está vacía.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a", color: "#fff", fontFamily: "sans-serif" },
  container: { padding: "20px", background: "#0f172a", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  button: { background: "#5865F2", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" },
  buttonAlt: { background: "#ef4444", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" },
  input: { width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #334155", background: "#1e293b", color: "#fff", fontSize: "16px" },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#1e293b" },
  td: { padding: "10px", border: "1px solid #334155", fontSize: "14px" }
};
