// src/pages/admin/DatabaseManager/index.jsx
import React, { useState, useEffect } from 'react';
import { FaDatabase, FaTable } from 'react-icons/fa';
import DataGrid from './components/DataGrid';
import './DatabaseManager.css';

const DatabaseManager = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin-data/schema')
      .then(res => res.json())
      .then(data => {
        setTables(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">در حال بارگذاری ساختار دیتابیس...</div>;

  return (
    <div className="database-manager">
      <div className="db-sidebar">
        <h3><FaDatabase /> جداول دیتابیس</h3>
        <ul>
          {tables.map(table => (
            <li 
              key={table.name}
              className={selectedTable?.name === table.name ? 'active' : ''}
              onClick={() => setSelectedTable(table)}
            >
              <FaTable /> {table.name}
              <span className="table-badge">{table.columns.length} ستون</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="db-content">
        {selectedTable ? (
          <DataGrid table={selectedTable} />
        ) : (
          <div className="no-selection">لطفاً یک جدول از سمت راست انتخاب کنید</div>
        )}
      </div>
    </div>
  );
};

export default DatabaseManager;