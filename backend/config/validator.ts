import { isValidUrl, castValue } from './helpers';
import { SchemaField, ConfigurationSchema } from './schema';

export class ValidationError extends Error {
  public field: string;
  public type: string;
  public meta: any;

  constructor(message: string, meta: { field: string; type: string; [key: string]: any }) {
    super(message);
    this.name = 'ValidationError';
    this.field = meta.field;
    this.type = meta.type;
    this.meta = meta;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

class LocalizedMessageManager {
  private static instance: LocalizedMessageManager;

  private messages: Record<string, Record<string, string>> = {
    en: {
      required: 'The field "{field}" is required.',
      invalidType: 'The field "{field}" must be of type {expected}.',
      minLength: 'The field "{field}" must be at least {minLength} characters long.',
      maxLength: 'The field "{field}" must not exceed {maxLength} characters.',
      min: 'The value of "{field}" must be at least {min}.',
      max: 'The value of "{field}" must not exceed {max}.',
      pattern: 'The format of field "{field}" is invalid.',
      invalidEnum: 'The field "{field}" has an invalid value. Allowed values: {allowed}.',
      minItems: 'The array "{field}" must contain at least {minItems} items.',
      maxItems: 'The array "{field}" must not contain more than {maxItems} items.',
      uniqueItems: 'The array "{field}" must contain only unique items.',
      invalidFormat: 'The field "{field}" has an invalid format.',
      custom: 'Custom validation failed for "{field}": {message}'
    },
    fa: {
      required: 'فیلد "{field}" اجباری است.',
      invalidType: 'فیلد "{field}" باید از نوع {expected} باشد.',
      minLength: 'طول فیلد "{field}" باید حداقل {minLength} کاراکتر باشد.',
      maxLength: 'طول فیلد "{field}" نمی‌تواند بیشتر از {maxLength} کاراکتر باشد.',
      min: 'مقدار فیلد "{field}" باید حداقل {min} باشد.',
      max: 'مقدار فیلد "{field}" نمی‌تواند بیشتر از {max} باشد.',
      pattern: 'فرمت فیلد "{field}" نامعتبر است.',
      invalidEnum: 'فیلد "{field}" مقدار نامعتبر دارد. مقادیر مجاز: {allowed}.',
      minItems: 'آرایه "{field}" باید حداقل شامل {minItems} آیتم باشد.',
      maxItems: 'آرایه "{field}" نمی‌تواند بیشتر از {maxItems} آیتم داشته باشد.',
      uniqueItems: 'آرایه "{field}" باید شامل آیتم‌های یکتا باشد.',
      invalidFormat: 'فرمت فیلد "{field}" نامعتبر است.',
      custom: 'اعتبارسنجی فیلد "{field}" شکست خورد: {message}'
    }
  };

  private constructor() {}

  public static getInstance(): LocalizedMessageManager {
    if (!LocalizedMessageManager.instance) {
      LocalizedMessageManager.instance = new LocalizedMessageManager();
    }
    return LocalizedMessageManager.instance;
  }

  public getMessage(type: string, meta: Record<string, any>, locale: 'fa' | 'en' = 'en'): string {
    const translationSet = this.messages[locale] || this.messages.en;
    let template = translationSet[type] || translationSet.invalidFormat;

    // Format fields/allowed/etc.
    Object.keys(meta).forEach((key) => {
      let val = meta[key];
      if (Array.isArray(val)) {
        val = val.join(', ');
      }
      template = template.replace(new RegExp(`{${key}}`, 'g'), String(val));
    });

    return template;
  }
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: Array<{ field: string; message: string }>;
  config: any;
}

export class ConfigValidator {
  private config: any;
  private schema: ConfigurationSchema;
  private locale: 'fa' | 'en';
  private strict: boolean;
  private allowExtra: boolean;

  private errors: ValidationError[] = [];
  private warnings: Array<{ field: string; message: string }> = [];
  private messageManager = LocalizedMessageManager.getInstance();

  constructor(
    config: any,
    schema: ConfigurationSchema,
    options: { locale?: 'fa' | 'en'; strict?: boolean; allowExtra?: boolean } = {}
  ) {
    this.config = JSON.parse(JSON.stringify(config)); // deep clone
    this.schema = schema;
    this.locale = options.locale || 'fa';
    this.strict = options.strict !== false;
    this.allowExtra = options.allowExtra === true;
  }

  public async validate(): Promise<ValidationReport> {
    this.errors = [];
    this.warnings = [];

    for (const [section, fields] of Object.entries(this.schema)) {
      const sectionData = this.config[section] || {};
      await this.validateSection(sectionData, fields as Record<string, SchemaField>, section);
    }

    if (this.strict && !this.allowExtra) {
      this.detectExtraFields(this.config, this.schema, '');
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      config: this.config
    };
  }

  private async validateSection(data: any, schemaFields: Record<string, SchemaField>, path: string) {
    for (const [key, rule] of Object.entries(schemaFields)) {
      const currentPath = path ? `${path}.${key}` : key;
      const value = data !== undefined && data !== null ? data[key] : undefined;

      await this.validateField(currentPath, value, rule, data, key);
    }
  }

  private async validateField(path: string, value: any, rule: SchemaField, parent: any, key: string) {
    if (!rule) return;

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      this.addError(path, 'required', rule);
      return;
    }

    // Default replacement if undefined
    if (value === undefined || value === null || value === '') {
      if (rule.default !== undefined) {
        if (parent) {
          parent[key] = rule.default;
        }
      }
      return;
    }

    // Validate type
    if (rule.type) {
      const typeValid = this.validateType(value, rule.type);
      if (!typeValid) {
        this.addError(path, 'invalidType', { ...rule, expected: rule.type });
        return;
      }
    }

    // Specific string constraints
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        this.addError(path, 'minLength', rule);
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        this.addError(path, 'maxLength', rule);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        this.addError(path, 'pattern', rule);
      }
      if (rule.enum && !rule.enum.includes(value)) {
        this.addError(path, 'invalidEnum', { ...rule, allowed: rule.enum });
      }
    }

    // Specific numeric constraints
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        this.addError(path, 'min', rule);
      }
      if (rule.max !== undefined && value > rule.max) {
        this.addError(path, 'max', rule);
      }
    }

    // Array elements validation
    if (Array.isArray(value) && rule.items) {
      const itemsRule = rule.items;
      for (let i = 0; i < value.length; i++) {
        await this.validateField(`${path}[${i}]`, value[i], itemsRule, value, String(i));
      }
      if (rule.uniqueItems) {
        const uniqueSet = new Set(value.map((v) => JSON.stringify(v)));
        if (uniqueSet.size !== value.length) {
          this.addError(path, 'uniqueItems', rule);
        }
      }
    }

    // Object deep validation
    if (value && typeof value === 'object' && !Array.isArray(value) && rule.fields) {
      await this.validateSection(value, rule.fields, path);
    }

    // Sanitize values
    if (rule.sanitize && typeof value === 'string') {
      if (rule.sanitize === 'trim') {
        parent[key] = value.trim();
      } else if (rule.sanitize === 'lowercase') {
        parent[key] = value.toLowerCase();
      }
    }
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !Number.isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return value && typeof value === 'object' && !Array.isArray(value);
      case 'url':
        return typeof value === 'string' && isValidUrl(value);
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return typeof value === 'string' && /^(\+?\d{1,3}[- ]?)?\d{9,12}$/.test(value);
      case 'date':
        return !Number.isNaN(Date.parse(value));
      case 'uuid':
        return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      default:
        return true;
    }
  }

  private detectExtraFields(data: any, schemaFields: any, path: string) {
    if (!data || typeof data !== 'object') return;

    for (const key of Object.keys(data)) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!schemaFields[key]) {
        this.warnings.push({
          field: currentPath,
          message: this.locale === 'fa' 
            ? `فیلد اضافی "${currentPath}" در تنظیمات شناسایی شد.`
            : `Extra field "${currentPath}" detected in configurations.`
        });
      } else if (schemaFields[key].fields && data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
        this.detectExtraFields(data[key], schemaFields[key].fields, currentPath);
      }
    }
  }

  private addError(path: string, type: string, meta: any) {
    const formattedMessage = this.messageManager.getMessage(type, { field: path, ...meta }, this.locale);
    this.errors.push(new ValidationError(formattedMessage, { field: path, type, ...meta }));
  }
}