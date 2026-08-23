'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { getDatabasesForFaction } from '../lib/databases';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [selectedDb, setSelectedDb] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const availableDbs =
    status === 'authenticated' ? getDatabasesForFaction(session.faction) : [];

  // Cargar datos de la base seleccionada
  useEffect(() => {
    if (status !== 'authenticated' || !selectedDb) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/getData?db=${selectedDb}`, { cache: 'no-store' });
        const result = await res.json();
        if (!cancelled && Array.isArray(result)) {
          setData(result);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [status, selectedDb]);

  const handleLogout = async () => {
    const res = await signOut({ redirect: false, callbackUrl: '/' });
    window.location.href = res.url || '/';
  };

  // --- Estado: verificando sesión ---
  if (status === 'loading') {
    return (
      <div style={pageCenterStyle}>Verificando sesión...</div>
    );
  }

  // --- Estado: sin sesión ---
  if (status === 'unauthenticated') {
    return (
      <div style={{ ...pageCenterStyle, flexDirection: 'column', gap: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Panel de Bases de Datos</h1>
        <p style={{ color: '#8b949e', margin: 0 }}>Sesión cerrada. Iniciá sesión para continuar.</p>
        <button onClick={() => signIn('discord', { callbackUrl: '/' })} style={discordButtonStyle}>
          Iniciar sesión con Discord
        </button>
      </div>
    );
  }

  // --- Estado: autenticado, sin ninguna base disponible para su facción ---
  if (availableDbs.length === 0) {
    return (
      <div style={{ ...pageCenterStyle, flexDirection: 'column', gap: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Sin acceso</h1>
        <p style={{ color: '#8b949e', margin: 0, textAlign: 'center', maxWidth: '360px' }}>
          Tu rol no tiene ninguna base de datos asignada. Si creés que es un error, contactá a un administrador.
        </p>
        <button onClick={handleLogout} style={logoutButtonStyle}>Salir</button>
      </div>
    );
  }

  // --- Estado: autenticado, mostrando el selector de bases ---
  if (!selectedDb) {
    return (
      <div style={{ backgroundColor: '#0b0e14', color: '#e6edf3', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Panel de Bases de Datos</h1>
          <button onClick={handleLogout} style={logoutButtonStyle}>Salir</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', maxWidth: '900px' }}>
          {availableDbs.map((db) => (
            <button
              key={db.id}
              onClick={() => setSelectedDb(db.id)}
              style={cardButtonStyle}
            >
              {db.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Estado: mostrando la tabla de la base seleccionada ---
  const dbLabel = availableDbs.find((db) => db.id === selectedDb)?.label || '';
  const headers = data[1] || data[0] || [];
  const rows = data.slice(2);

  return (
    <div style={{ backgroundColor: '#0b0e14', color: '#e6edf3', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        html, body { margin: 0 !important; padding: 0 !important; background-color: #0b0e14 !important; }
        .tabla-scroll::-webkit-scrollbar { height: 16px !important; display: block !important; }
        .tabla-scroll::-webkit-scrollbar-track { background: #1c2128 !important; border-radius: 8px; }
        .tabla-scroll::-webkit-scrollbar-thumb { background-color: #8b949e !important; border-radius: 8px; border: 3px solid #1c2128; }
        .tabla-scroll::-webkit-scrollbar-thumb:hover { background-color: #ffffff !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelectedDb(null)} style={backButtonStyle}>&larr; Bases</button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>{dbLabel}</h1>
        </div>
        <button onClick={handleLogout} style={logoutButtonStyle}>Salir</button>
      </div>

      <div
        className="tabla-scroll"
        style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '6px', overflowX: 'scroll', paddingBottom: '8px' }}
      >
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e' }}>Cargando registros...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e' }}>No se encontraron registros o la tabla está vacía.</div>
        ) : (
          <table style={{ width: '100%', minWidth: '2200px', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
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

const pageCenterStyle = {
  backgroundColor: '#0b0e14',
  color: '#e6edf3',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'sans-serif',
};

const discordButtonStyle = {
  backgroundColor: '#5865F2',
  color: '#ffffff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '14px',
};

const logoutButtonStyle = {
  backgroundColor: '#dc2626',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '13px',
};

const backButtonStyle = {
  backgroundColor: '#21262d',
  color: '#e6edf3',
  border: '1px solid #30363d',
  padding: '8px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '13px',
};

const cardButtonStyle = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  color: '#e6edf3',
  borderRadius: '8px',
  padding: '28px 16px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  textAlign: 'center',
};
