export const WidgetPermissionManager = ({ currentUserRole }) => {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [widgetPermissions, setWidgetPermissions] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [compareRole, setCompareRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const canEdit = ['admin', 'it_manager'].includes(currentUserRole);
  
  // ... تمام توابع بالا
  
  return (
    <div className="widget-permission-manager">
      {/* هدر */}
      <div className="permission-header">
        <h2>🔐 مدیریت دسترسی ویجت‌ها</h2>
        
        <div className="header-actions">
          {canEdit && (
            <>
              <button onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? '🔒 قفل' : '🔓 ویرایش'}
              </button>
              <button onClick={handleSave} disabled={!hasChanges}>
                💾 ذخیره
              </button>
              <button onClick={handleReset}>🔄 بازنشانی</button>
              <button onClick={handleExport}>📥 خروجی</button>
              <button onClick={handleImport}>📤 ورودی</button>
            </>
          )}
          <button onClick={() => setShowAuditLog(!showAuditLog)}>
            📋 تاریخچه
          </button>
          <button onClick={() => setShowDiff(!showDiff)}>
            🔍 مقایسه
          </button>
        </div>
      </div>
      
      {/* انتخاب نقش */}
      <div className="role-selector">
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
          {Object.entries(ROLE_LEVELS).map(([role, level]) => (
            <option key={role} value={role}>
              {ROLE_NAMES[role]} (سطح {level})
            </option>
          ))}
        </select>
        
        <div className="clone-section">
          <span>📋 کپی از:</span>
          <select onChange={(e) => handleClonePermissions(e.target.value)}>
            <option value="">انتخاب نقش...</option>
          </select>
        </div>
        
        <input 
          type="text" 
          placeholder="🔍 جستجوی ویجت..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">همه دسته‌ها</option>
          {Object.entries(categories).map(([key, name]) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </select>
      </div>
      
      {/* پریست‌ها */}
      {isEditing && (
        <div className="presets-section">
          <h4>🎨 پیش‌فرض‌های آماده</h4>
          <div className="preset-cards">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button key={key} className="preset-card" onClick={() => handleApplyPreset(key)}>
                <span className="preset-icon">{preset.icon}</span>
                <span className="preset-name">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* لیست ویجت‌ها */}
      {Object.entries(categories).map(([catKey, catName]) => (
        <div key={catKey} className="permission-category">
          <h4>
            {catName}
            {isEditing && (
              <div className="category-actions">
                <button onClick={() => handleSelectAll(catKey)}>✅ همه</button>
                <button onClick={() => handleDeselectAll(catKey)}>❌ هیچکدام</button>
              </div>
            )}
          </h4>
          
          <div className="widgets-list">
            {Object.entries(WIDGET_PERMISSIONS)
              .filter(([_, perms]) => perms.category === catKey)
              .map(([widgetType, perms]) => (
                <div key={widgetType} className="widget-permission-item">
                  <input 
                    type="checkbox" 
                    checked={widgetPermissions[selectedRole]?.[widgetType]?.allowed ??  (perms.allowedRoles?.includes(selectedRole) || (perms.minLevel && ROLE_LEVELS[selectedRole] >= perms.minLevel))}
                    onChange={(e) => handleTogglePermission(widgetType, e.target.checked)}
                    disabled={!isEditing}
                  />
                  
                  <span className="widget-name">{perms.name}</span>
                  
                  {perms.sensitive && <span className="sensitive-badge">🔒 حساس</span>}
                  {perms.realtime && <span className="realtime-badge">⚡ زنده</span>}
                  
                  {isEditing && (
                    <select 
                      value={widgetPermissions[selectedRole]?.[widgetType]?.level || 'read'}
                      onChange={(e) => handleChangeLevel(widgetType, e.target.value)}
                    >
                      {Object.entries(PERMISSION_LEVELS).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
      
      {/* Audit Log */}
      {showAuditLog && <AuditLogPanel logs={auditLogs} />}
      
      {/* Diff Viewer */}
      {showDiff && <DiffViewer role1={selectedRole} role2={compareRole} />}
    </div>
  );
};