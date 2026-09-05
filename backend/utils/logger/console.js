// utils/logger/console.js
const colors = require('colors');
const util = require('util');
const config = require('../../config');

// ═══════════════════════════════════════════════════════════════
// Configuration & Levels
// ═══════════════════════════════════════════════════════════════

const LEVELS = {
  silly: 0,
  debug: 1,
  verbose: 2,
  info: 3,
  http: 4,
  warn: 5,
  error: 6,
  fatal: 7,
};

const COLORS = {
  silly: 'rainbow',
  debug: 'magenta',
  verbose: 'cyan',
  info: 'green',
  http: 'blue',
  warn: 'yellow',
  error: 'red',
  fatal: 'red.bold',
};

// ═══════════════════════════════════════════════════════════════
// Enhanced Console Logger Class
// ═══════════════════════════════════════════════════════════════

class ConsoleLogger {
  constructor() {
    this.colors = colors;
    this.enabled = config.log?.enableConsole ?? true;
    this.isDev = config.env === 'development';
    this.levels = LEVELS;
    this.currentLevel = config.log?.level ?? 'debug';
    this.prefix = config.service?.name ?? 'APP';
    this.buffer = [];
    this.bufferSize = 100;
    
    // Enable colors in development
    if (!this.isDev) {
      colors.disable();
    }
    
    // Safe console methods
    this.console = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Core Logging Methods
  // ─────────────────────────────────────────────────────────────

  shouldLog(level) {
    return LEVELS[level] >= LEVELS[this.currentLevel];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = this.isDev 
      ? this.colors.gray(new Date().toISOString())
      : new Date().toISOString();
    
    const levelStr = this.isDev 
      ? this.colors.bold(`[${level.toUpperCase().padEnd(5)}]`)
      : `[${level.toUpperCase().padEnd(5)}]`;
    
    const prefix = this.isDev
      ? this.colors.cyan(`[${this.prefix}]`)
      : `[${this.prefix}]`;

    let formatted = `${timestamp} ${levelStr} ${prefix} ${message}`;

    if (Object.keys(meta).length > 0) {
      const metaStr = this.isDev
        ? util.inspect(meta, { colors: true, depth: 4 })
        : JSON.stringify(meta);
      formatted += `\n${this.isDev ? this.colors.gray('  ↳ ') : '  ↳ '}${metaStr}`;
    }

    return formatted;
  }

  log(level, message, meta = {}) {
    if (!this.enabled || !this.shouldLog(level)) return;

    const colorFn = this.colors[COLORS[level]] || ((s) => s);
    const formatted = this.formatMessage(level, message, meta);
    
    // Use appropriate console method
    const consoleMethod = level === 'error' || level === 'fatal' 
      ? this.console.error 
      : level === 'warn' 
        ? this.console.warn 
        : this.console.log;

    consoleMethod(colorFn(formatted));
  }

  // ─────────────────────────────────────────────────────────────
  // Convenience Methods
  // ─────────────────────────────────────────────────────────────

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  http(message, meta = {}) {
    this.log('http', message, meta);
  }

  verbose(message, meta = {}) {
    this.log('verbose', message, meta);
  }

  silly(message, meta = {}) {
    this.log('silly', message, meta);
  }

  // ─────────────────────────────────────────────────────────────
  // Advanced Features
  // ─────────────────────────────────────────────────────────────

  /**
   * Log with custom emoji based on level
   */
  withEmoji(level, message, meta = {}) {
    const emojis = {
      silly: '🎲',
      debug: '🔍',
      verbose: '📝',
      info: 'ℹ️',
      http: '🌐',
      warn: '⚠️',
      error: '❌',
      fatal: '💥',
    };
    const emoji = emojis[level] || '📌';
    this.log(level, `${emoji} ${message}`, meta);
  }

  /**
   * Log with category/namespace
   */
  withCategory(category, level, message, meta = {}) {
    const cat = this.isDev ? this.colors.bold.cyan(`[${category}]`) : `[${category}]`;
    this.log(level, `${cat} ${message}`, meta);
  }

  /**
   * Pretty print table
   */
  table(data, columns = null) {
    if (!this.enabled) return;
    
    if (this.isDev) {
      console.table(data, columns);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Banner/ASCII Art logging
   */
  banner(text, style = 'frame') {
    if (!this.enabled) return;
    
    const frames = {
      frame: ['╔═╗', '║ ║', '╚═╝'],
      double: ['╔═╗', '║ ║', '╚═╝'],
      round: ['╭─╮', '│ │', '╰─╯'],
      simple: ['┌─┐', '│ │', '└─┘'],
    };
    
    const frame = frames[style] || frames.frame;
    const padding = ' '.repeat(Math.max(0, (text.length - frame[1].length + 2) / 2));
    
    this.info(this.colors.cyan(`
${frame[0].replace(/./g, '═')}
${frame[1]}${padding}${text}${padding}${frame[1]}
${frame[2].replace(/./g, '═')}
    `.trim()));
  }

  /**
   * Success message (green checkmark)
   */
  success(message, meta = {}) {
    const msg = this.isDev 
      ? `✅ ${this.colors.green(message)}` 
      : `✅ ${message}`;
    this.log('info', msg, meta);
  }

  /**
   * Failure message
   */
  fail(message, meta = {}) {
    const msg = this.isDev 
      ? `❌ ${this.colors.red(message)}` 
      : `❌ ${message}`;
    this.log('error', message, meta);
  }

  /**
   * Loading/Progress indicator
   */
  loading(message, progress = null) {
    if (!this.enabled) return;
    
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const frame = spinner[Math.floor(Date.now() / 100) % spinner.length];
    
    if (progress !== null) {
      const bar = this.isDev
        ? this.colors.cyan(`[${'█'.repeat(progress / 5)}${' '.repeat(20 - progress / 5)}]`)
        : `[${progress}%]`;
      console.log(`${frame} ${message} ${bar}`);
    } else {
      console.log(`${frame} ${message}`);
    }
  }

  /**
   * Clear console
   */
  clear() {
    if (!this.enabled) return;
    console.clear();
  }

  /**
   * Separator line
   */
  separator(char = '─', length = 50) {
    if (!this.enabled) return;
    console.log(this.colors.gray(char.repeat(length)));
  }

  /**
   * Grouped logs (collapsible in dev)
   */
  group(label) {
    if (!this.enabled) return;
    console.group(this.colors.bold.cyan(label));
  }

  groupEnd() {
    if (!this.enabled) return;
    console.groupEnd();
  }

  /**
   * Timer utility
   */
  time(label = 'operation') {
    console.time(label);
  }

  timeEnd(label = 'operation') {
    console.timeEnd(label);
  }

  /**
   * Stack trace logging
   */
  trace(message) {
    if (!this.enabled) return;
    console.trace(this.colors.yellow(message));
  }

  /**
   * Object inspection with custom depth
   */
  inspect(obj, depth = 4) {
    if (!this.enabled) return;
    console.log(
      this.isDev 
        ? util.inspect(obj, { colors: true, depth })
        : JSON.stringify(obj, null, 2)
    );
  }

  /**
   * JSON pretty print
   */
  json(data, indent = 2) {
    if (!this.enabled) return;
    console.log(JSON.stringify(data, null, indent));
  }

  /**
   * Conditional debug logging
   */
  debugIf(condition, message, meta = {}) {
    if (condition) {
      this.debug(message, meta);
    }
  }

  /**
   * Log with multiple arguments
   */
  logMulti(level, ...args) {
    const message = args.shift();
    const meta = args.length > 0 ? { args } : {};
    this.log(level, message, meta);
  }

  /**
   * Set log level dynamically
   */
  setLevel(level) {
    if (LEVELS[level] !== undefined) {
      this.currentLevel = level;
      this.info(`Log level changed to: ${level}`);
    }
  }

  /**
   * Enable/Disable logger
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// ═══════════════════════════════════════════════════════════════
// Export singleton instance
// ═══════════════════════════════════════════════════════════════

module.exports = new ConsoleLogger();