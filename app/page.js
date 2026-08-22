'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/getData', { cache: 'no-store' });
        const result = await res.json();
        if (Array.isArray(result)) {
          setData(result);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Omite la primera fila si es la del logo/título
  const headers = data[1] || data[0] || [];
  const rows = data.slice(2);

  return (
    <div className="container">
      <div className="header">
        <h1>Panel de Consulta USMS</h1>
        <button onClick={() => signOut()} className="btn-logout">
          Salir
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <p className="status-msg">Cargando datos...</p>
        ) : data.length === 0 ? (
          <p className="status-msg">No se encontraron registros o la tabla está vacía.</p>
        ) : (
          <table>
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th key={i}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((_, colIndex) => (
                    <td key={colIndex}>{row[colIndex] || ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
