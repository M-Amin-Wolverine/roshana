// src/pages/admin/DatabaseManager/components/DataGrid.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { FaSave, FaTrash, FaPlus } from 'react-icons/fa';

const DataGrid = ({ table }) => {
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);

  // تعریف ستون‌ها بر اساس Schema
  const columnDefs = useMemo(() => {
    return table.columns.map(col => {
      // اگر کلید خارجی باشد، فیلد نمایشی را جایگزین می‌کنیم
      const fk = table.foreignKeys?.find(fk => fk.from === col.name);
      let field = col.name;
      let headerName = col.name;
      
      if (fk) {
        field = `${col.name}_display`; // این فیلد در بک‌اند با JOIN ساخته شده
        headerName = `${col.name} (${fk.table})`;
      }
      
      return {
        field,
        headerName,
        editable: !col.pk, // کلید اصلی قابل ویرایش نیست
        sortable: true,
        filter: true,
        resizable: true
      };
    });
  }, [table]);

  useEffect(() => {
    fetch(`/api/admin-data/data/${table.name}`)
      .then(res => res.json())
      .then(data => setRowData(data.data));
  }, [table]);

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const handleSave = () => {
    // پیاده‌سازی ذخیره تغییرات (ارسال به سرور)
    alert('تغییرات ذخیره شدند (در نسخه کامل پیاده‌سازی شود)');
  };

  return (
    <div className="data-grid-container">
      <div className="grid-toolbar">
        <h2>{table.name}</h2>
        <div className="actions">
          <button className="btn-primary" onClick={handleSave}>
            <FaSave /> ذخیره تغییرات
          </button>
          <button className="btn-secondary">
            <FaPlus /> رکورد جدید
          </button>
        </div>
      </div>
      <div className="ag-theme-alpine" style={{ height: '70vh', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{
            flex: 1,
            minWidth: 100,
            cellStyle: { textAlign: 'right' } // راست‌چین کردن محتوا
          }}
          onGridReady={onGridReady}
          enableCellChangeFlash={true}
          enableRtl={true} // فعال‌سازی راست به چپ
          localeText={{
            // ترجمه فارسی پیام‌های گرید
            noRowsToShow: 'داده‌ای برای نمایش وجود ندارد',
            loadingOoo: 'در حال بارگذاری...'
          }}
        />
      </div>
    </div>
  );
};

export default DataGrid;