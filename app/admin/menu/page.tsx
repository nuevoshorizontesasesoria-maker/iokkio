'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export default function GestionMenuPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Reemplaza esto con el ID real del restaurante según la sesión o contexto del usuario
  const restaurant_id = 'RESTAURANT_ID_AQUI'; 

  const cargarMenuActual = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant_id);

    if (!error && data) {
      setMenuItems(data);
    }
  };

  useEffect(() => {
    cargarMenuActual();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCargando(true);
    setMensaje('Procesando archivo...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) throw new Error('El archivo Excel está vacío.');

        // Reemplazar la carta anterior limpiando los registros previos del restaurante
        await supabase
          .from('menu_items')
          .delete()
          .eq('restaurant_id', restaurant_id);

        const itemsAInsertar = data.map((row) => ({
          restaurant_id: restaurant_id,
          name: row.name || row.Nombre,
          description: row.description || row.Descripcion || '',
          price: parseFloat(row.price || row.Precio || 0),
          category: row.category || row.Categoria || 'general',
        }));

        const { error } = await supabase
          .from('menu_items')
          .insert(itemsAInsertar);

        if (error) throw error;

        setMensaje('¡Carta actualizada con éxito!');
        cargarMenuActual();
      } catch (err: any) {
        setMensaje(`Error: ${err.message}`);
      } finally {
        setCargando(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const eliminarPlato = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este plato?')) return;
    
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (!error) {
      cargarMenuActual();
    }
  };

  return (
    <main style={{ maxWidth: '800px', margin: '3rem auto', padding: '2rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Administrar Carta / Menú</h2>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Actualiza tu carta subiendo un nuevo archivo Excel o elimina platos individualmente.
      </p>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', border: '1px dashed #ccc' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Subir / Actualizar Carta Completa (Excel)</h3>
        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={cargando} />
        {cargando && <p style={{ color: '#1976d2', marginTop: '0.5rem' }}>Actualizando menú...</p>}
        {mensaje && <p style={{ fontWeight: 'bold', marginTop: '0.5rem', color: mensaje.includes('Error') ? '#d32f2f' : '#2e7d32' }}>{mensaje}</p>}
      </div>

      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Platos Actuales en el Menú ({menuItems.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {menuItems.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#fff', border: '1px solid #eee', borderRadius: '6px' }}>
            <div>
              <strong>{item.name}</strong> <span style={{ color: '#666', fontSize: '0.85rem' }}>({item.category})</span>
              <div style={{ color: '#444', fontSize: '0.9rem' }}>${item.price} - {item.description}</div>
            </div>
            <button 
              onClick={() => eliminarPlato(item.id)}
              style={{ background: '#d32f2f', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}


