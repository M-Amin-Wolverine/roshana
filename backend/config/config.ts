/**
 * Roshana Enterprise Configuration System - Manager Core
 */

import { schema, ConfigurationSchema } from './schema';
import { ConfigValidator, ValidationReport } from './validator';
import { defaults } from './defaults';
import {
  castValue,
  deepFreeze,
  sanitizeConfig,
  getNestedValue,
  deepClone,
  mergeDeep
} from './helpers';

export interface ValidationHistoryRecord {
  timestamp: string;
  valid: boolean;
  errorsCount: number;
  warningsCount: number;
}

export class ConfigManager {
  private schema: ConfigurationSchema = schema;
  private currentConfig: any = {};
  private history: ValidationHistoryRecord[] = [];
  private activeEnv: Record<string, string> = {};

  constructor(customEnv: Record<string, string> = {}) {
    // If running in browser or test, allow a custom injected env dictionary
    this.activeEnv = { ...customEnv };
  }

  /**
   * Builds the configuration object by combining schema defaults, environment variables, and manual configs.
   */
  public build(manualConfig: Record<string, any> = {}): any {
    const configResult: any = {};

    for (const [section, fields] of Object.entries(this.schema)) {
      configResult[section] = {};

      for (const [key, options] of Object.entries(fields)) {
        // Find environment variable value
        const envName = options.env;
        let rawValue: any = undefined;

        if (envName && this.activeEnv[envName] !== undefined) {
          rawValue = this.activeEnv[envName];
        } else if (envName && typeof process !== 'undefined' && process.env && process.env[envName] !== undefined) {
          rawValue = process.env[envName];
        }

        // Fallback to manual configuration, then schema default
        if (rawValue === undefined && manualConfig[section]?.[key] !== undefined) {
          rawValue = manualConfig[section][key];
        }

        if (rawValue === undefined) {
          rawValue = options.default;
        }

        // Cast type appropriately
        configResult[section][key] = castValue(rawValue, options.type);
      }
    }

    // Custom deep merge of user modules or other configurations that aren't strictly in schema
    const fullyMerged = mergeDeep(configResult, manualConfig);

    // Apply Post Processing (Auto-calculates variables like database URL, JWT expirations)
    const postProcessed = this.postProcess(fullyMerged);

    this.currentConfig = postProcessed;
    return postProcessed;
  }

  /**
   * Run the validation process on the current config
   */
  public async validate(locale: 'fa' | 'en' = 'fa'): Promise<ValidationReport> {
    const validator = new ConfigValidator(this.currentConfig, this.schema, { locale });
    const result = await validator.validate();

    // Log the validation run in historical logs
    this.history.unshift({
      timestamp: new Date().toISOString(),
      valid: result.valid,
      errorsCount: result.errors.length,
      warningsCount: result.warnings.length
    });

    if (this.history.length > 50) {
      this.history.pop();
    }

    return result;
  }

  /**
   * postProcess computes dynamic configuration properties (DB URLs, JWT metrics, etc.)
   */
  private postProcess(config: any): any {
    const result = deepClone(config);

    // 1. Compute Database URI String if matching client
    if (result.DATABASE) {
      const { CLIENT, HOST, PORT, NAME, USER, PASSWORD } = result.DATABASE;
      const protocol = CLIENT === 'mysql' ? 'mysql' : 'postgresql';
      const auth = USER ? `${USER}:${PASSWORD || ''}@` : '';
      
      result.DATABASE.URL = `${protocol}://${auth}${HOST}:${PORT}/${NAME}`;
      result.DATABASE.URL_MASKED = `${protocol}://${USER ? `${USER}:••••••••@` : ''}${HOST}:${PORT}/${NAME}`;
    }

    // 2. Compute dynamic JWT metrics
    if (result.SECURITY?.JWT) {
      const accessExpires = result.SECURITY.JWT.ACCESS_EXPIRES_IN;
      if (typeof accessExpires === 'number') {
        result.SECURITY.JWT.ACCESS_EXPIRES_SECONDS = accessExpires;
        result.SECURITY.JWT.ACCESS_EXPIRES_HOURS = (accessExpires / 3600).toFixed(1);
        result.SECURITY.JWT.ACCESS_EXPIRES_DAYS = (accessExpires / 86400).toFixed(2);
      }
    }

    // 3. Ensure sub-modules contain proper activation presets (LMS, IOT, etc.)
    const standardModules = {
      LMS: { ENABLED: true, COURSE_MAX_LIMIT: 50 },
      FINANCIAL: { ENABLED: true, CURRENCY: 'IRR' },
      LIBRARY: { ENABLED: true, LOAN_MAX_DAYS: 14 },
      VIRTUAL_CLASS: { ENABLED: true, PLATFORM: 'internal' },
      GAMIFICATION: { ENABLED: false },
      IOT: { ENABLED: false }
    };

    for (const [modName, defOptions] of Object.entries(standardModules)) {
      if (!result[modName]) {
        result[modName] = defOptions;
      } else {
        result[modName] = { ...defOptions, ...result[modName] };
      }
    }

    // 4. Attach Config Meta-info
    result._meta = {
      loadedAt: new Date().toISOString(),
      schemaVersion: '4.1.0',
      environment: result.SERVER?.NODE_ENV || 'development',
      platform: typeof window !== 'undefined' ? 'browser' : 'node'
    };

    return result;
  }

  /**
   * Access nested variables safely using Dot notation path
   */
  public get(pathStr: string, defaultValue: any = null): any {
    return getNestedValue(this.currentConfig, pathStr, defaultValue);
  }

  /**
   * Generates a template commented `.env.example` file based on the config schema.
   */
  public generateEnvExample(): string {
    const lines: string[] = [];

    lines.push('# ====================================================');
    lines.push('# Roshana Enterprise Configuration Template File');
    lines.push('# Schema Version: 4.1.0 (Ultimate Edition)');
    lines.push('# Auto-generated on: ' + new Date().toLocaleDateString('fa-IR'));
    lines.push('# ====================================================\n');

    for (const [section, fields] of Object.entries(this.schema)) {
      lines.push(`# ========== ${section} SETTINGS ==========`);

      for (const [key, options] of Object.entries(fields)) {
        if (options.env) {
          const comment = options.description || `${section}.${key} variable`;
          const defaultValue = options.default !== undefined ? String(options.default) : '';
          
          lines.push(`# ${comment} (Type: ${options.type})`);
          lines.push(`${options.env}=${defaultValue}`);
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Compares two configurations and yields a rich list of edits and differences
   */
  public getDiff(oldConfig: any, newConfig: any, parentPath: string = ''): Array<{ path: string; old: any; new: any }> {
    const diffs: Array<{ path: string; old: any; new: any }> = [];
    const allKeys = new Set([...Object.keys(oldConfig || {}), ...Object.keys(newConfig || {})]);

    for (const key of Array.from(allKeys)) {
      if (key === '_meta') continue;

      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      const oldValue = oldConfig?.[key];
      const newValue = newConfig?.[key];

      if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue !== null && newValue !== null && !Array.isArray(oldValue)) {
        diffs.push(...this.getDiff(oldValue, newValue, currentPath));
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diffs.push({
          path: currentPath,
          old: oldValue,
          new: newValue
        });
      }
    }

    return diffs;
  }

  /**
   * Safe JSON representation masking passwords and secrets
   */
  public toSafeJSON(): any {
    return sanitizeConfig(this.currentConfig, this.schema);
  }

  public toJSON(): any {
    return this.currentConfig;
  }

  public getHistory(): ValidationHistoryRecord[] {
    return this.history;
  }

  public getEnv(): Record<string, string> {
    return this.activeEnv;
  }
}
