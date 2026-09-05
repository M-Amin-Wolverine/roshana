'use strict';

// ==================== اضافه شد: پشتیبانی از .env ====================
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

const schema = require('./schema');
const { castValue, deepFreeze, mergeDeep, deepClone } = require('./helpers');
const ConfigValidator = require('./validator');
const { success, warn, error, info, printTable, divider } = require('./printer');

// ==================== اضافه شد: Event Emitter برای رویدادها ====================
class ConfigEventEmitter extends EventEmitter {}
const configEvents = new ConfigEventEmitter();

// ==================== اضافه شد: کش و تنظیمات ====================
let cachedConfig = null;
let cacheTimestamp = null;
let cachedSources = null;
let fileWatchers = [];
let validationHistory = [];

const CACHE_TTL_MS = 60000;
const VALIDATION_HISTORY_MAX = 100;

// ==================== اضافه شد: لیست کاملا پیشوندهای محیطی ====================
const ENV_PREFIXES = {
    production: 'PROD_',
    staging: 'STG_',
    development: 'DEV_',
    test: 'TEST_',
    // اضافه شد: پیشوندهای سفارشی
    custom: {}
};

// ==================== اضافه شد: لیست مسیرهای فایل کانفیگ ====================
const DEFAULT_CONFIG_PATHS = [
    './config/local.json',
    './config/development.json',
    './config/production.json',
    './config/staging.json',
    './config/test.json',
    './roshana.config.json',
    './.roshanarc',
    './config/app.json'
];

// ==================== اضافه شد: الگوهای تشخیص مقادیر حساس ====================
const SENSITIVE_PATTERNS = [
    /password/i, /secret/i, /token/i, /key$/i, /api_key/i, 
    /private/i, /credential/i, /auth/i, /bearer/i, /jwt/i,
    /encryption/i, /signature/i, /certificate/i
];

// ==================== اضافه شد: پشتیبانی از Schema Versioning ====================
const SCHEMA_VERSION = '4.0.0';
const COMPATIBLE_VERSIONS = ['4.0.0', '3.x', '2.x'];

// ==================== اضافه شد: تابع لاگ داخلی ====================
const log = {
    debug: (...args) => {
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG_CONFIG) {
            console.log(`${colors.dim}[CONFIG]${colors.reset}`, ...args);
        }
    },
    info: (...args) => info(...args),
    warn: (...args) => warn(...args),
    error: (...args) => error(...args)
};

// ==================== اضافه شد: اعتبارسنجی محیط ====================
function validateEnvironment() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const allowedEnvs = ['development', 'staging', 'production', 'test'];
    
    if (!allowedEnvs.includes(nodeEnv)) {
        warn(`⚠️ Unknown NODE_ENV: ${nodeEnv}`, 'Using "development" as fallback');
        process.env.NODE_ENV = 'development';
    }
    
    // اضافه شد: بررسی متغیرهای حیاتی
    const criticalVars = ['NODE_ENV'];
    const missing = criticalVars.filter(v => !process.env[v]);
    
    if (missing.length > 0 && process.env.NODE_ENV === 'production') {
        error(`❌ Missing critical environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
    
    return process.env.NODE_ENV;
}

// ==================== اضافه شد: بارگذاری از چندین فایل کانفیگ ====================
function loadFromMultipleFiles(configPaths = null, mergeAll = false) {
    const paths = configPaths || DEFAULT_CONFIG_PATHS;
    const loadedConfigs = [];
    const loadedSources = [];
    
    for (const filePath of paths) {
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        
        if (fs.existsSync(absolutePath)) {
            try {
                const fileContent = fs.readFileSync(absolutePath, 'utf8');
                const fileConfig = JSON.parse(fileContent);
                
                // اعتبارسنجی فایل JSON
                if (fileConfig.$schema) {
                    log.debug(`Config uses schema: ${fileConfig.$schema}`);
                }
                
                loadedConfigs.push(fileConfig);
                loadedSources.push(absolutePath);
                log.debug(`Loaded config from: ${absolutePath}`);
                
                if (!mergeAll) break; // فقط اولین فایل معتبر
                
            } catch (err) {
                warn(`⚠️ Failed to parse config file: ${absolutePath}`, err.message);
            }
        }
    }
    
    if (loadedConfigs.length === 0) {
        return null;
    }
    
    // ادغام تمام فایل‌ها اگر mergeAll فعال باشد
    if (mergeAll && loadedConfigs.length > 1) {
        let merged = {};
        for (const config of loadedConfigs) {
            merged = mergeDeep(merged, config);
        }
        return { config: merged, sources: loadedSources };
    }
    
    return { config: loadedConfigs[0], sources: loadedSources[0] };
}

// ==================== اضافه شد: بارگذاری از YAML ====================
function loadFromYamlFile(filePath) {
    try {
        const yaml = require('js-yaml');
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        
        if (fs.existsSync(absolutePath)) {
            const content = fs.readFileSync(absolutePath, 'utf8');
            const config = yaml.load(content);
            log.debug(`Loaded YAML config from: ${absolutePath}`);
            return { config, source: absolutePath };
        }
    } catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') {
            warn(`⚠️ Failed to load YAML config: ${err.message}`);
        }
    }
    return null;
}

// ==================== اضافه شد: پشتیبانی از فایل .env.local ====================
function loadFromEnvLocal() {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
        require('dotenv').config({ path: envLocalPath, override: true });
        log.debug(`Loaded .env.local from: ${envLocalPath}`);
        return true;
    }
    return false;
}

// ==================== اضافه شد: Schema Validation برای Schema خودش ====================
function validateSchemaStructure() {
    const requiredSections = ['SERVER', 'DATABASE', 'AUTH'];
    const missingSections = requiredSections.filter(s => !schema[s]);
    
    if (missingSections.length > 0) {
        error(`❌ Schema missing required sections: ${missingSections.join(', ')}`);
        return false;
    }
    
    // اضافه شد: اعتبارسنجی type های مجاز
    const allowedTypes = ['string', 'number', 'boolean', 'object', 'array', 'url', 'email'];
    
    for (const [section, fields] of Object.entries(schema)) {
        for (const [key, options] of Object.entries(fields)) {
            if (options.type && !allowedTypes.includes(options.type)) {
                warn(`⚠️ Unknown type in schema: ${section}.${key} = ${options.type}`);
            }
        }
    }
    
    return true;
}

// ==================== اضافه شد: توليد فایل .env.example ====================
function generateEnvExample(outputPath = '.env.example') {
    const lines = [];
    
    lines.push('# ============================================');
    lines.push('# Roshana Configuration File');
    lines.push(`# Schema Version: ${SCHEMA_VERSION}`);
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('# ============================================\n');
    
    for (const [section, fields] of Object.entries(schema)) {
        lines.push(`# ========== ${section} ==========`);
        
        for (const [key, options] of Object.entries(fields)) {
            if (options.env) {
                const comment = options.description || options.env;
                const defaultValue = options.default !== undefined ? options.default : '';
                const example = options.example || defaultValue;
                
                lines.push(`# ${comment}`);
                lines.push(`# ${section}.${key} = ${example}`);
                lines.push(`${options.env}=${defaultValue}`);
                lines.push('');
            }
        }
    }
    
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
    success(`✅ Generated .env.example at ${outputPath}`);
    return outputPath;
}

// ==================== اضافه شد: Sanitization پیشرفته ====================
function sanitizeValue(value, type) {
    if (typeof value === 'string') {
        // حذف فاصله‌های اضافی
        let sanitized = value.trim();
        
        // حذف کاراکترهای کنترل
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
        
        // اعتبارسنجی نوع
        if (type === 'email') {
            const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
            if (!emailRegex.test(sanitized)) {
                warn(`⚠️ Invalid email format: ${sanitized}`);
            }
        }
        
        if (type === 'url') {
            try {
                new URL(sanitized);
            } catch {
                warn(`⚠️ Invalid URL format: ${sanitized}`);
            }
        }
        
        return sanitized;
    }
    
    if (type === 'number' && typeof value === 'string') {
        const num = Number(value);
        return isNaN(num) ? value : num;
    }
    
    if (type === 'boolean') {
        if (value === 'true' || value === '1' || value === 'yes') return true;
        if (value === 'false' || value === '0' || value === 'no') return false;
    }
    
    return value;
}

// ==================== اضافه شد: اعتبارسنجی متقابل (Cross Validation) ====================
function crossValidate(config) {
    const warnings = [];
    const errors = [];
    
    // بررسی NODE_ENV و PORT
    if (config.SERVER?.NODE_ENV === 'production' && config.SERVER?.PORT === 3000) {
        warnings.push('Using default port 3000 in production is not recommended');
    }
    
    // بررسی دیتابیس و کش
    if (config.ROSHANA_SCI?.CACHE?.ENABLED && !config.DATABASE?.URL) {
        warnings.push('Cache is enabled but no database URL configured');
    }
    
    // بررسی JWT secret length
    if (config.AUTH?.JWT?.SECRET && config.AUTH.JWT.SECRET.length < 32) {
        if (config.SERVER?.NODE_ENV === 'production') {
            errors.push('JWT_SECRET must be at least 32 characters in production');
        } else {
            warnings.push('JWT_SECRET is too short (minimum 32 characters recommended)');
        }
    }
    
    // بررسی Rate Limit در production
    if (config.SERVER?.NODE_ENV === 'production') {
        if (config.AUTH?.RATE_LIMIT?.MAX_REQUESTS > 1000) {
            warnings.push('High rate limit may cause performance issues');
        }
    }
    
    return { warnings, errors };
}

// ==================== اضافه شد: Hot Reload با File Watcher ====================
function setupHotReload(watchPaths = null, callback = null) {
    const pathsToWatch = watchPaths || [
        path.join(process.cwd(), 'config'),
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), '.env.local')
    ];
    
    for (const watchPath of pathsToWatch) {
        if (!fs.existsSync(watchPath)) continue;
        
        const watcher = fs.watch(watchPath, { recursive: true }, async (eventType, filename) => {
            if (eventType === 'change') {
                log.debug(`Config file changed: ${filename}`);
                
                try {
                    const newConfig = await reloadConfig({ showSummary: false });
                    configEvents.emit('reload', { config: newConfig, timestamp: new Date() });
                    
                    if (callback) callback(newConfig);
                    
                    success(`🔄 Configuration reloaded`, `from ${filename}`);
                } catch (err) {
                    error(`❌ Failed to reload config: ${err.message}`);
                    configEvents.emit('error', err);
                }
            }
        });
        
        fileWatchers.push(watcher);
    }
    
    return () => {
        fileWatchers.forEach(watcher => watcher.close());
        fileWatchers.length = 0;
    };
}

// ==================== اضافه شد: تاریخچه اعتبارسنجی ====================
function addToValidationHistory(result) {
    validationHistory.unshift({
        timestamp: new Date().toISOString(),
        valid: result.valid,
        errors: result.errors?.length || 0,
        warnings: result.warnings?.length || 0
    });
    
    if (validationHistory.length > VALIDATION_HISTORY_MAX) {
        validationHistory.pop();
    }
}

// ==================== اضافه شد: گرفتن دیف بین دو کانفیگ ====================
function getConfigDiff(oldConfig, newConfig, path = '') {
    const differences = [];
    
    const allKeys = new Set([
        ...Object.keys(oldConfig || {}),
        ...Object.keys(newConfig || {})
    ]);
    
    for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        const oldValue = oldConfig?.[key];
        const newValue = newConfig?.[key];
        
        if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue !== null && newValue !== null) {
            differences.push(...getConfigDiff(oldValue, newValue, currentPath));
        } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            differences.push({
                path: currentPath,
                old: oldValue,
                new: newValue
            });
        }
    }
    
    return differences;
}

// ==================== اضافه شد: بکاپ از کانفیگ ====================
function backupConfig(backupPath = null) {
    const config = loadConfig({ useCache: false });
    const backupDir = backupPath || path.join(process.cwd(), '.config-backups');
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `config-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(config, null, 2), 'utf8');
    success(`✅ Config backed up to: ${backupFile}`);
    
    return backupFile;
}

// ==================== اضافه شد: CLI Handler ====================
function handleCLI() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'config:validate':
            console.log('\n🔍 Validating configuration...\n');
            const result = validateOnly();
            if (result) {
                success('✅ Configuration is valid');
            } else {
                error('❌ Configuration is invalid');
                process.exit(1);
            }
            process.exit(0);
            break;
            
        case 'config:show':
            const config = loadConfig({ showSummary: true });
            if (config) {
                printConfigSummary(config);
            }
            process.exit(0);
            break;
            
        case 'config:generate-env':
            generateEnvExample(args[1] || '.env.example');
            process.exit(0);
            break;
            
        case 'config:backup':
            backupConfig(args[1]);
            process.exit(0);
            break;
            
        case 'config:reset-cache':
            resetCache();
            success('✅ Cache reset successfully');
            process.exit(0);
            break;
    }
}

// ==================== اضافه شد: Bootstrap اولیه ====================
function bootstrap() {
    log.debug('Bootstrapping configuration system...');
    
    // ایجاد پوشه‌های مورد نیاز
    const requiredDirs = ['./config', './logs', './uploads', './.config-backups'];
    for (const dir of requiredDirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log.debug(`Created directory: ${dir}`);
        }
    }
    
    // بارگذاری .env.local در صورت وجود
    loadFromEnvLocal();
    
    // اعتبارسنجی schema ساختار
    validateSchemaStructure();
    
    log.debug('Bootstrap completed');
}

// ==================== تابع اصلی (تکمیل شده) ====================
function loadConfig(options = {}) {
    const {
        useCache = true,
        forceReload = false,
        strictMode = true,
        suppressWarnings = false,
        exitOnError = true,
        showSummary = false,
        configFile = null,
        validateOnly = false,
        mergeConfigFiles = false,
        enableHotReload = false,
        watchPaths = null,
        onReload = null
    } = options;
    
    const nodeEnv = validateEnvironment();
    
    // بررسی کش
    if (useCache && !forceReload && cachedConfig && cacheTimestamp) {
        if (Date.now() - cacheTimestamp < CACHE_TTL_MS) {
            if (showSummary) printConfigSummary(cachedConfig, cachedSources);
            if (!validateOnly) log.debug('Using cached configuration');
            return cachedConfig;
        }
    }
    
    // Bootstrap اولیه
    bootstrap();
    
    // مرحله 1: بارگذاری از متغیرهای محیطی
    const { config: envConfig, sources: envSources } = loadFromEnvironment(schema, nodeEnv);
    
    // مرحله 2: بارگذاری از فایل‌های کانفیگ
    let fileConfig = null;
    let fileSources = null;
    
    if (configFile) {
        const result = loadFromMultipleFiles([configFile], false);
        if (result) {
            fileConfig = result.config;
            fileSources = result.sources;
        }
    } else {
        const result = loadFromMultipleFiles(DEFAULT_CONFIG_PATHS, mergeConfigFiles);
        if (result) {
            fileConfig = result.config;
            fileSources = result.sources;
        }
    }
    
    // اضافه شد: بارگذاری از YAML
    let yamlConfig = null;
    for (const yamlPath of ['./config/config.yaml', './config/config.yml']) {
        const result = loadFromYamlFile(yamlPath);
        if (result) {
            yamlConfig = result.config;
            break;
        }
    }
    
    // مرحله 3: ادغام تمام منابع
    let config = mergeConfigs(envConfig, fileConfig || {}, yamlConfig || {});
    
    // اضافه شد: Sanitize تمام مقادیر
    config = sanitizeConfig(config);
    
    // مرحله 4: پس‌پردازش
    config = postProcessConfig(config);
    
    // مرحله 5: اعتبارسنجی متقابل
    const { warnings: crossWarnings, errors: crossErrors } = crossValidate(config);
    
    // مرحله 6: اعتبارسنجی اصلی
    const isValid = validateAndExit(config, schema, envSources, {
        strictMode,
        exitOnError: false,
        suppressWarnings,
        locale: config.APP?.LOCALE || 'fa'
    });
    
    const finalErrors = [...(isValid ? [] : ['Validation failed']), ...crossErrors];
    
    if (finalErrors.length > 0 && exitOnError) {
        error('\n❌ Configuration validation failed\n');
        finalErrors.forEach(err => console.error(`   ${colors.red}•${colors.reset} ${err}`));
        process.exit(1);
    }
    
    // نمایش هشدارها
    if (!suppressWarnings) {
        [...crossWarnings].forEach(w => warn(w));
    }
    
    // مرحله 7: فریز کردن و کش کردن
    const frozenConfig = deepFreeze(config);
    const sources = {
        env: envSources,
        file: fileSources,
        yaml: !!yamlConfig
    };
    
    if (useCache && !validateOnly) {
        cachedConfig = frozenConfig;
        cachedSources = sources;
        cacheTimestamp = Date.now();
    }
    
    // اضافه شد: ثبت تاریخچه
    addToValidationHistory({ valid: finalErrors.length === 0, errors: finalErrors, warnings: crossWarnings });
    
    // نمایش خلاصه
    if (showSummary && !validateOnly && process.env.NODE_ENV !== 'production') {
        printConfigSummary(frozenConfig, envSources);
    }
    
    // اضافه شد: نمایش آمار
    if (!validateOnly) {
        const envVarCount = Object.values(envSources).reduce(
            (acc, fields) => acc + Object.values(fields).filter(s => s !== 'default').length, 0
        );
        success(`✅ Configuration loaded`, `(${envVarCount} env vars, ${fileConfig ? 'config file' : 'no file'}, ${yamlConfig ? 'yaml' : 'no yaml'})`);
    }
    
    // اضافه شد: راه‌اندازی Hot Reload
    let stopWatcher = null;
    if (enableHotReload && !validateOnly) {
        stopWatcher = setupHotReload(watchPaths, (newConfig) => {
            if (onReload) onReload(newConfig);
            configEvents.emit('reload', newConfig);
        });
    }
    
    // ذخیره تابع stop در صورت نیاز
    if (stopWatcher && !frozenConfig._stopWatcher) {
        Object.defineProperty(frozenConfig, '_stopWatcher', {
            value: stopWatcher,
            enumerable: false,
            writable: false
        });
    }
    
    return frozenConfig;
}

// ==================== اضافه شد: Sanitize کل کانفیگ ====================
function sanitizeConfig(config) {
    const sanitized = deepClone(config);
    
    for (const [section, fields] of Object.entries(sanitized)) {
        for (const [key, value] of Object.entries(fields)) {
            const schemaField = schema[section]?.[key];
            if (schemaField) {
                sanitized[section][key] = sanitizeValue(value, schemaField.type);
            }
        }
    }
    
    return sanitized;
}

// ==================== اضافه شد: Post-Process کامل ====================
function postProcessConfig(config) {
    const result = deepClone(config);
    
    // محاسبه URL دیتابیس
    if (result.DATABASE) {
        const { CLIENT, HOST, PORT, NAME, USER, PASSWORD } = result.DATABASE;
        
        if (CLIENT === 'postgresql' || CLIENT === 'pg') {
            const auth = USER && PASSWORD ? `${USER}:${PASSWORD}@` : '';
            result.DATABASE.URL = `postgresql://${auth}${HOST}:${PORT}/${NAME}`;
            result.DATABASE.URL_MASKED = result.DATABASE.URL?.replace(PASSWORD || 'xxx', '••••••••');
        } else if (CLIENT === 'mysql') {
            const auth = USER && PASSWORD ? `${USER}:${PASSWORD}@` : '';
            result.DATABASE.URL = `mysql://${auth}${HOST}:${PORT}/${NAME}`;
            result.DATABASE.URL_MASKED = result.DATABASE.URL?.replace(PASSWORD || 'xxx', '••••••••');
        }
    }
    
    // محاسبه زمان‌های JWT
    if (result.AUTH?.JWT) {
        const accessExpires = result.AUTH.JWT.ACCESS_EXPIRES_IN;
        const refreshExpires = result.AUTH.JWT.REFRESH_EXPIRES_IN;
        
        if (typeof accessExpires === 'number') {
            result.AUTH.JWT.ACCESS_EXPIRES_SECONDS = accessExpires;
            result.AUTH.JWT.ACCESS_EXPIRES_HOURS = (accessExpires / 3600).toFixed(1);
            result.AUTH.JWT.ACCESS_EXPIRES_DAYS = (accessExpires / 86400).toFixed(2);
        }
        
        if (typeof refreshExpires === 'number') {
            result.AUTH.JWT.REFRESH_EXPIRES_SECONDS = refreshExpires;
            result.AUTH.JWT.REFRESH_EXPIRES_HOURS = (refreshExpires / 3600).toFixed(1);
            result.AUTH.JWT.REFRESH_EXPIRES_DAYS = (refreshExpires / 86400).toFixed(2);
        }
    }
    
    // تنظیمات پیش‌فرض ماژول‌ها
    const defaultModules = {
        LMS: { ENABLED: true, COURSE: { PER_PAGE: 20 } },
        ROSHANA_SCI: { ENABLED: true, ANOMALY_DETECTION: true, CACHE: { ENABLED: true, TTL: 3600 } },
        NOTIFICATION: { EMAIL: { ENABLED: false }, SMS: { ENABLED: false }, PUSH: { ENABLED: false } },
        FINANCIAL: { ENABLED: true, CURRENCY: { DEFAULT: 'IRR' } },
        VIRTUAL_CLASS: { ENABLED: true, DEFAULT_PLATFORM: 'internal' },
        IOT: { ENABLED: false },
        GAMIFICATION: { ENABLED: false },
        ALUMNI: { ENABLED: true },
        LIBRARY: { ENABLED: true, LOAN_DAYS: 14 }
    };
    
    for (const [moduleName, defaults] of Object.entries(defaultModules)) {
        if (!result[moduleName]) {
            result[moduleName] = defaults;
        } else {
            result[moduleName] = mergeDeep(defaults, result[moduleName]);
        }
    }
    
    // اضافه شد: متادیتا
    result._meta = {
        loadedAt: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version
    };
    
    return result;
}

// ==================== توابع کمکی اضافه شده ====================

/**
 * بازنشانی کش
 */
function resetCache() {
    cachedConfig = null;
    cachedSources = null;
    cacheTimestamp = null;
    info('🔄 Configuration cache cleared');
}

/**
 * بارگذاری مجدد
 */
async function reloadConfig(options = {}) {
    resetCache();
    const newConfig = loadConfig({ ...options, forceReload: true });
    configEvents.emit('reloaded', { config: newConfig, timestamp: new Date() });
    return newConfig;
}

/**
 * اعتبارسنجی فقط
 */
function validateOnly() {
    return loadConfig({ validateOnly: true, exitOnError: false });
}

/**
 * دیباگ کانفیگ
 */
function debugConfig() {
    const config = loadConfig({ showSummary: true, useCache: false });
    
    console.log(`\n${colors.bgBlue}${colors.white} 🔍 CONFIG DEBUG INFO ${colors.reset}\n`);
    console.log(`${colors.bright}Environment:${colors.reset} ${process.env.NODE_ENV || 'development'}`);
    console.log(`${colors.bright}Cache TTL:${colors.reset} ${CACHE_TTL_MS}ms`);
    console.log(`${colors.bright}Cached:${colors.reset} ${cachedConfig ? 'Yes' : 'No'}`);
    console.log(`${colors.bright}Schema Version:${colors.reset} ${SCHEMA_VERSION}`);
    console.log(`${colors.bright}Validation History:${colors.reset} ${validationHistory.length} records`);
    
    // نمایش آخرین اعتبارسنجی
    if (validationHistory.length > 0) {
        const last = validationHistory[0];
        console.log(`\n${colors.bright}Last Validation:${colors.reset}`);
        console.log(`   Valid: ${last.valid ? colors.green + 'Yes' : colors.red + 'No'}${colors.reset}`);
        console.log(`   Errors: ${last.errors}`);
        console.log(`   Warnings: ${last.warnings}`);
        console.log(`   Time: ${last.timestamp}`);
    }
    
    return config;
}

/**
 * نمایش خلاصه کانفیگ
 */
function printConfigSummary(config, sources = null) {
    divider('─', 60);
    info('📋 Configuration Summary', false);
    divider('─', 60);
    
    for (const [section, fields] of Object.entries(config)) {
        if (Object.keys(fields).length === 0) continue;
        if (section === '_meta') continue;
        
        console.log(`\n${colors.bright}${colors.cyan}[${section}]${colors.reset}`);
        
        for (const [key, value] of Object.entries(fields)) {
            const isSensitive = SENSITIVE_PATTERNS.some(p => p.test(key));
            let displayValue = isSensitive ? '••••••••' : String(value);
            
            if (typeof value === 'object' && value !== null) {
                displayValue = JSON.stringify(value).substring(0, 60);
                if (displayValue.length > 60) displayValue += '...';
            }
            
            const sourceInfo = sources?.env?.[section]?.[key] ? 
                ` ${colors.dim}(${sources.env[section][key]})${colors.reset}` : '';
            
            console.log(`   ${key}: ${colors.green}${displayValue}${colors.reset}${sourceInfo}`);
        }
    }
    
    divider('─', 60);
}

/**
 * گرفتن رویدادها
 */
function onConfigEvent(event, handler) {
    configEvents.on(event, handler);
}

/**
 * توقف Hot Reload
 */
function stopHotReload() {
    if (cachedConfig?._stopWatcher) {
        cachedConfig._stopWatcher();
        info('🛑 Hot reload stopped');
    }
}

// ==================== اجرای CLI و خروجی ====================
handleCLI();

module.exports = {
    loadConfig,
    reloadConfig,
    resetCache,
    validateOnly,
    debugConfig,
    printConfigSummary,
    generateEnvExample,
    backupConfig,
    onConfigEvent,
    stopHotReload,
    getConfigDiff,
    getValidationHistory: () => [...validationHistory],
    // برای سازگاری
    default: loadConfig
};