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

  const headers = data[1] || data[0] || [];
  const rows = data.slice(2);

  return (
    <div style={{ backgroundColor: '#0b0e14', color: '#e6edf3', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>Panel de Consulta USMS</h1>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px'
          }}
        >
          Salir
        </button>
      </div>

      {/* Contenedor Tabla */}
      <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '6px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e' }}>Cargando registros...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e' }}>No se encontraron registros o la tabla está vacía.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#21262d', borderBottom: '1px solid #30363d', color: '#c9d1d9' }}>
                {headers.map((header, i) => (
                  <th key={i} style={{ padding: '10px 12px', borderRight: '1px solid #30363d', whiteSpace: 'nowrap' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ borderBottom: '1px solid #21262d' }}>
                  {headers.map((_, colIndex) => (
                    <td key={colIndex} style={{ padding: '10px 12px', borderRight: '1px solid #21262d', color: '#8b949e', whiteSpace: 'nowrap' }}>
                      {row[colIndex] || ''}
                    </td>
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
