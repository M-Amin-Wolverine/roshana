import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Settings, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  History, 
  HelpCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Download, 
  Layers, 
  Info,
  ChevronRight,
  Database,
  Lock,
  Globe,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import our custom-built Roshana configuration modules
import { ConfigManager } from './roshana/config';
import { printer, colors as printColors } from './roshana/printer';
import { schema } from './roshana/schema';
import { defaults } from './roshana/defaults';

// Simple ANSI color code to styled HTML parser
function renderAnsiToHtml(text: string) {
  if (!text) return '';

  const styles: { regex: RegExp; class: string }[] = [
    { regex: /\x1b\[1m/g, class: 'font-bold' },
    { regex: /\x1b\[2m/g, class: 'opacity-60' },
    { regex: /\x1b\[30m/g, class: 'text-neutral-900' },
    { regex: /\x1b\[31m/g, class: 'text-rose-400' },
    { regex: /\x1b\[32m/g, class: 'text-emerald-400 font-semibold' },
    { regex: /\x1b\[33m/g, class: 'text-amber-300' },
    { regex: /\x1b\[34m/g, class: 'text-blue-400' },
    { regex: /\x1b\[35m/g, class: 'text-fuchsia-400' },
    { regex: /\x1b\[36m/g, class: 'text-cyan-400 font-semibold' },
    { regex: /\x1b\[37m/g, class: 'text-neutral-100' },
    { regex: /\x1b\[90m/g, class: 'text-neutral-500' },
    { regex: /\x1b\[41m/g, class: 'bg-rose-900 px-1.5 py-0.5 rounded text-rose-100' },
    { regex: /\x1b\[42m/g, class: 'bg-emerald-900 px-1.5 py-0.5 rounded text-emerald-100' },
    { regex: /\x1b\[43m/g, class: 'bg-amber-900 px-1.5 py-0.5 rounded text-amber-100' },
    { regex: /\x1b\[44m/g, class: 'bg-blue-900 px-1.5 py-0.5 rounded text-blue-100' },
    { regex: /\x1b\[45m/g, class: 'bg-fuchsia-900 px-1.5 py-0.5 rounded text-fuchsia-100' },
    { regex: /\x1b\[0m/g, class: '' }
  ];

  // We split the text by actual escape blocks
  const parts = text.split(/(\x1b\[\d+m)/);
  let currentClass = '';
  
  return parts.map((part, index) => {
    const matchingStyle = styles.find(s => s.regex.test(part));
    if (matchingStyle) {
      if (part === '\x1b[0m') {
        currentClass = '';
      } else {
        currentClass = matchingStyle.class;
      }
      return null;
    }
    return (
      <span key={index} className={currentClass || undefined}>
        {part}
      </span>
    );
  }).filter(Boolean);
}

export default function App() {
  // We initialize the Roshana config manager with some initial custom environment configurations
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    PORT: '3000',
    HOST: '0.0.0.0',
    NODE_ENV: 'development',
    DB_CLIENT: 'postgresql',
    DB_HOST: '127.0.0.1',
    DB_PORT: '5432',
    DB_USER: 'postgres',
    DB_PASSWORD: 'securePassword123!',
    DB_NAME: 'roshana_db',
    JWT_SECRET: 'roshana-enterprise-security-super-secret-key-32chars',
    APP_URL: 'http://localhost:3000',
    LOG_LEVEL: 'info'
  });

  const [activeTab, setActiveTab] = useState<'env' | 'form' | 'diff'>('env');
  const [editorLocale, setEditorLocale] = useState<'fa' | 'en'>('en');
  const [maskSensitive, setMaskSensitive] = useState<boolean>(true);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [cliInput, setCliInput] = useState<string>('');
  
  // Instance state
  const [configManager, setConfigManager] = useState<ConfigManager>(new ConfigManager(envVars));
  const [activeConfig, setActiveConfig] = useState<any>({});
  const [validationResult, setValidationResult] = useState<any>({ valid: true, errors: [], warnings: [] });
  const [selectedSchemaSection, setSelectedSchemaSection] = useState<string>('SERVER');

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Sync when envVars change
  useEffect(() => {
    const manager = new ConfigManager(envVars);
    const built = manager.build();
    setActiveConfig(built);
    
    // Auto-validate current state
    manager.validate(editorLocale).then((res) => {
      setValidationResult(res);
    });

    setConfigManager(manager);
  }, [envVars, editorLocale]);

  // Initial banner print in terminal
  useEffect(() => {
    const manager = new ConfigManager(envVars);
    const conf = manager.build();
    setTerminalLogs([
      printer.getBanner(conf),
      `\nType ${printColors.cyan}help${printColors.reset} or click quick actions to execute Roshana Core operations.\n`
    ]);
  }, []);

  // Auto scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Handle visual form inputs update
  const handleFormChange = (section: string, key: string, value: any, envName?: string) => {
    if (envName) {
      setEnvVars(prev => ({
        ...prev,
        [envName]: String(value)
      }));
    } else {
      // Direct config inject via manual overwrite
      const updated = { ...activeConfig };
      if (!updated[section]) updated[section] = {};
      updated[section][key] = value;
      setActiveConfig(updated);
    }
  };

  // Convert raw .env text and parse
  const handleEnvTextChange = (text: string) => {
    const lines = text.split('\n');
    const newEnv: Record<string, string> = {};
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index === -1) return;
      const key = trimmed.substring(0, index).trim();
      const val = trimmed.substring(index + 1).trim();
      newEnv[key] = val;
    });
    setEnvVars(newEnv);
  };

  // Construct raw .env representation
  const getEnvText = () => {
    return Object.entries(envVars)
      .map(([key, val]) => `${key}=${val}`)
      .join('\n');
  };

  // Triggers visual CLI command runs
  const runCommand = (cmd: string) => {
    const cleaned = cmd.trim();
    if (!cleaned) return;

    let output = '';
    const newLogs = [...terminalLogs, `\n$ roshana ${cleaned}`];

    switch (cleaned.toLowerCase()) {
      case 'help':
        output = `
${printColors.bright}Roshana Enterprise CLI v4.1.0${printColors.reset}
Available Commands:
  ${printColors.cyan}config:status${printColors.reset}         - Print ASCII Framework Banner and diagnostic status.
  ${printColors.cyan}config:validate${printColors.reset}       - Execute validation on the active config schema.
  ${printColors.cyan}config:show${printColors.reset}           - Display resolved JSON parameters.
  ${printColors.cyan}config:generate-env${printColors.reset}   - Output a documented copyable .env template.
  ${printColors.cyan}config:backup${printColors.reset}         - Create a simulation of backing up settings.
  ${printColors.cyan}clear${printColors.reset}                 - Clear the console history.
`;
        break;

      case 'config:status':
        output = printer.getBanner(activeConfig) + '\n' + printer.getStatus(activeConfig) + '\n' + printer.getModulesTable(activeConfig);
        break;

      case 'config:validate': {
        const errors = validationResult.errors;
        const warnings = validationResult.warnings;
        
        if (validationResult.valid) {
          output = `\n${printer.success('Schema verification completed successfully. All constraints met.', 'Valid Config')}\n`;
        } else {
          output = `\n${printer.error(`Schema verification failed with ${errors.length} errors.`)}\n`;
          errors.forEach((err: any) => {
            output += `  ${printColors.red}•${printColors.reset} [${err.field}]: ${err.message}\n`;
          });
        }

        if (warnings.length > 0) {
          output += `\n${printColors.yellow}Warnings Found (${warnings.length}):${printColors.reset}\n`;
          warnings.forEach((warn: any) => {
            output += `  ${printColors.yellow}⚠${printColors.reset} [${warn.field}]: ${warn.message}\n`;
          });
        }
        break;
      }

      case 'config:show': {
        const displayData = maskSensitive ? configManager.toSafeJSON() : configManager.toJSON();
        output = `\n${printColors.bright}Active JSON Parameters:${printColors.reset}\n` + JSON.stringify(displayData, null, 2);
        break;
      }

      case 'config:generate-env':
        output = `\n${printColors.bright}Generated Documented .env.example:${printColors.reset}\n\n` + configManager.generateEnvExample();
        break;

      case 'config:backup': {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        output = `
${printer.success('Configuration state parsed and serialised.', 'Success')}
Backup file compiled: ${printColors.bright}config-${timestamp}.json${printColors.reset}
Backup status: Saved safely in backup storage.
`;
        // Trigger simulated file download
        const blob = new Blob([JSON.stringify(activeConfig, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roshana-config-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
      }

      case 'clear':
        setTerminalLogs([]);
        setCliInput('');
        return;

      default:
        output = `\n${printColors.red}Error:${printColors.reset} Command "${cleaned}" not recognized. Type ${printColors.cyan}help${printColors.reset} for support.`;
    }

    setTerminalLogs([...newLogs, output]);
    setCliInput('');
  };

  // Compute differences compared to default parameters
  const currentDiff = configManager.getDiff(defaults, activeConfig);

  return (
    <div id="roshana_workspace" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Premium Top Navigation bar */}
      <header id="roshana_header" className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Roshana Config System
              </span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                v4.1.0 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400">Intelligent Educational Ecosystem with AI & Advanced Analytics</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button 
              id="lang_en"
              onClick={() => setEditorLocale('en')}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${editorLocale === 'en' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              English Messages
            </button>
            <button 
              id="lang_fa"
              onClick={() => setEditorLocale('fa')}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${editorLocale === 'fa' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              پیام‌های فارسی
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-slate-300">SYSTEM STABLE</span>
          </div>
        </div>
      </header>

      {/* Main Panel layout */}
      <main id="roshana_main" className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        
        {/* LEFT COLUMN: Input settings and editors */}
        <section id="config_editor_column" className="lg:col-span-5 flex flex-col space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[520px]">
            
            {/* Tab selector */}
            <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-sm">Configuration Source</span>
              </div>
              
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
                <button 
                  id="tab_env"
                  onClick={() => setActiveTab('env')}
                  className={`px-3 py-1 rounded transition-colors ${activeTab === 'env' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-white'}`}
                >
                  .env Code
                </button>
                <button 
                  id="tab_form"
                  onClick={() => setActiveTab('form')}
                  className={`px-3 py-1 rounded transition-colors ${activeTab === 'form' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-white'}`}
                >
                  Visual Fields
                </button>
                <button 
                  id="tab_diff"
                  onClick={() => setActiveTab('diff')}
                  className={`px-3 py-1 rounded transition-colors ${activeTab === 'diff' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-white'}`}
                >
                  Active Diffs ({currentDiff.length})
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-900/40">
              <AnimatePresence mode="wait">
                {activeTab === 'env' && (
                  <motion.div 
                    key="env_editor"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="h-full flex flex-col"
                  >
                    <div className="mb-2 text-xs text-slate-400 flex items-center justify-between">
                      <span>Edit standard dotenv variables below to watch validation update.</span>
                      <button 
                        onClick={() => handleEnvTextChange(getEnvText())}
                        className="text-cyan-400 hover:underline flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Re-sync</span>
                      </button>
                    </div>
                    <textarea
                      id="env_textarea"
                      value={getEnvText()}
                      onChange={(e) => handleEnvTextChange(e.target.value)}
                      className="flex-1 w-full p-4 bg-slate-950 text-slate-300 font-mono text-xs rounded-lg border border-slate-800 focus:border-cyan-500/50 focus:outline-none resize-none leading-relaxed"
                      placeholder="# Roshana Environment Configurations"
                    />
                  </motion.div>
                )}

                {activeTab === 'form' && (
                  <motion.div 
                    key="form_editor"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    {/* Visual forms mapped to active sections */}
                    <div className="flex space-x-1 border-b border-slate-800 pb-2 overflow-x-auto">
                      {['SERVER', 'DATABASE', 'SECURITY', 'APP'].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setSelectedSchemaSection(sec)}
                          className={`px-3 py-1 text-xs rounded transition-all whitespace-nowrap ${selectedSchemaSection === sec ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4 pt-2">
                      {Object.entries(schema[selectedSchemaSection] || {}).map(([key, field]) => {
                        const envName = field.env;
                        const value = envName ? envVars[envName] : activeConfig[selectedSchemaSection]?.[key];
                        const isSensitive = field.sensitive;

                        return (
                          <div key={key} className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60 flex flex-col space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <label className="text-xs font-semibold text-slate-300 tracking-wide font-mono block">
                                  {selectedSchemaSection}.{key}
                                </label>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {envName ? `ENV: ${envName}` : 'In-Schema Variable'}
                                </span>
                              </div>
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-mono">
                                {field.type}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-normal">{field.description}</p>

                            {field.enum ? (
                              <select
                                value={value || ''}
                                onChange={(e) => handleFormChange(selectedSchemaSection, key, e.target.value, envName)}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                              >
                                {field.enum.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.type === 'boolean' ? (
                              <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                                  <input
                                    type="radio"
                                    checked={value === 'true' || value === true}
                                    onChange={() => handleFormChange(selectedSchemaSection, key, 'true', envName)}
                                    className="text-cyan-500 focus:ring-0 bg-slate-900 border-slate-800"
                                  />
                                  <span>Enabled</span>
                                </label>
                                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                                  <input
                                    type="radio"
                                    checked={value === 'false' || value === false}
                                    onChange={() => handleFormChange(selectedSchemaSection, key, 'false', envName)}
                                    className="text-cyan-500 focus:ring-0 bg-slate-900 border-slate-800"
                                  />
                                  <span>Disabled</span>
                                </label>
                              </div>
                            ) : (
                              <input
                                type={isSensitive ? "password" : "text"}
                                value={value !== undefined ? value : ''}
                                onChange={(e) => handleFormChange(selectedSchemaSection, key, e.target.value, envName)}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500/50"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'diff' && (
                  <motion.div 
                    key="diff_editor"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-3"
                  >
                    <p className="text-xs text-slate-400">Differences between current parameters and default system presets:</p>
                    {currentDiff.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mb-2" />
                        <span className="text-xs">No parameters modified. Config is identical to system defaults.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentDiff.map((diff) => (
                          <div key={diff.path} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg text-xs font-mono">
                            <span className="text-cyan-400 block mb-1">{diff.path}</span>
                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-900">
                              <div>
                                <span className="text-slate-500 block">Default:</span>
                                <span className="text-rose-400 line-through truncate block">
                                  {diff.old === '' ? '""' : String(diff.old)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Current:</span>
                                <span className="text-emerald-400 truncate block">
                                  {diff.new === '' ? '""' : String(diff.new)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ACTIVE DIAGNOSTICS & SYSTEM STATUS BOARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-sm">Validation Diagnostics</span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded font-semibold tracking-wider ${validationResult.valid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {validationResult.valid ? 'PASSED' : 'INVALID'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block font-mono">ERRORS</span>
                  <span className={`text-lg font-bold ${validationResult.errors.length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {validationResult.errors.length}
                  </span>
                </div>
                <XCircle className={`w-5 h-5 ${validationResult.errors.length > 0 ? 'text-rose-400' : 'text-slate-600'}`} />
              </div>

              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block font-mono">WARNINGS</span>
                  <span className={`text-lg font-bold ${validationResult.warnings.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {validationResult.warnings.length}
                  </span>
                </div>
                <AlertTriangle className={`w-5 h-5 ${validationResult.warnings.length > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
              </div>
            </div>

            {/* Error messaging block */}
            <div className="max-h-36 overflow-y-auto space-y-2">
              {validationResult.errors.length === 0 && validationResult.warnings.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  All active values match schema constraint bounds. System fully secure.
                </div>
              ) : (
                <>
                  {validationResult.errors.map((err: any, i: number) => (
                    <div key={i} className="p-2.5 bg-rose-950/20 rounded border border-rose-900/30 text-xs flex items-start space-x-2">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-rose-400 font-mono block mb-0.5">{err.field}</span>
                        <p className="text-slate-300 leading-normal">{err.message}</p>
                      </div>
                    </div>
                  ))}
                  {validationResult.warnings.map((warn: any, i: number) => (
                    <div key={i} className="p-2.5 bg-amber-950/20 rounded border border-amber-900/30 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-400 font-mono block mb-0.5">{warn.field}</span>
                        <p className="text-slate-300 leading-normal">{warn.message}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Interactive Terminal Simulator & Docs */}
        <section id="terminal_console_column" className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Active Terminal HUD */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[520px]">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-sm font-mono text-cyan-400">Roshana Terminal Emulator</span>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={maskSensitive}
                    onChange={(e) => setMaskSensitive(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Mask Secrets</span>
                </label>
                <button
                  onClick={() => runCommand('clear')}
                  className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                >
                  Clear Terminal
                </button>
              </div>
            </div>

            {/* Simulated Command prompt buttons */}
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800/60 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide mr-1">Quick Commands:</span>
              <button 
                id="cmd_status"
                onClick={() => runCommand('config:status')}
                className="bg-slate-950 text-xs px-2.5 py-1 rounded border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all font-mono"
              >
                config:status
              </button>
              <button 
                id="cmd_validate"
                onClick={() => runCommand('config:validate')}
                className="bg-slate-950 text-xs px-2.5 py-1 rounded border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all font-mono"
              >
                config:validate
              </button>
              <button 
                id="cmd_show"
                onClick={() => runCommand('config:show')}
                className="bg-slate-950 text-xs px-2.5 py-1 rounded border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all font-mono"
              >
                config:show
              </button>
              <button 
                id="cmd_env"
                onClick={() => runCommand('config:generate-env')}
                className="bg-slate-950 text-xs px-2.5 py-1 rounded border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all font-mono"
              >
                config:generate-env
              </button>
              <button 
                id="cmd_backup"
                onClick={() => runCommand('config:backup')}
                className="bg-slate-950 text-xs px-2.5 py-1 rounded border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all font-mono flex items-center space-x-1"
              >
                <Download className="w-3 h-3" />
                <span>config:backup</span>
              </button>
            </div>

            {/* Terminal log stream */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed space-y-2 selection:bg-cyan-500/30">
              {terminalLogs.map((log, i) => (
                <pre key={i} className="whitespace-pre-wrap">
                  {renderAnsiToHtml(log)}
                </pre>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Interactive Terminal input bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                runCommand(cliInput);
              }}
              className="bg-slate-950 border-t border-slate-800 p-3 flex items-center space-x-2"
            >
              <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="Type a CLI command (e.g. config:status, config:validate, clear) and press Enter..."
                className="flex-1 bg-transparent text-slate-200 font-mono text-xs focus:outline-none placeholder-slate-600"
              />
            </form>
          </div>

          {/* HISTORICAL RECOLLECTION & DOCUMENTATION NOTES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Validation History HUD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[200px]">
              <div className="flex items-center space-x-2 mb-3">
                <History className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-sm">Validation History Log</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {configManager.getHistory().length === 0 ? (
                  <div className="text-xs text-slate-500 h-full flex items-center justify-center">
                    No history logged yet. Run validations to populate.
                  </div>
                ) : (
                  configManager.getHistory().map((record, index) => (
                    <div key={index} className="bg-slate-950/40 p-2.5 rounded border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-slate-300">
                          {record.errorsCount} Errors • {record.warningsCount} Warnings
                        </span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${record.valid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {record.valid ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Helper guidelines */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[200px]">
              <div className="flex items-center space-x-2 mb-3">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-sm">Framework Architecture</span>
              </div>

              <div className="flex-1 overflow-y-auto text-xs text-slate-400 space-y-3 leading-relaxed">
                <p>
                  The <strong className="text-slate-300">Roshana Enterprise Configuration Engine</strong> dynamically resolves, casts, and verifies environment variables against strict target typings on startup.
                </p>
                <div className="space-y-1.5 pl-2 border-l border-slate-800">
                  <div className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>
                    <span className="text-[11px] text-slate-300">Auto-resolved PostgreSQL URLs</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>
                    <span className="text-[11px] text-slate-300">Strict JWT secret checks (min 32 chars)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>
                    <span className="text-[11px] text-slate-300">Multi-locale custom validation errors</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </section>

      </main>

      {/* Decorative developer credit block */}
      <footer id="roshana_footer" className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-600 font-mono">
        Roshana Framework Configuration Console. Rendered in a secure Sandbox.
      </footer>

    </div>
  );
}
