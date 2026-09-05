export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  black: '\x1b[30m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m'
};

export const symbols = {
  rocket: '🚀',
  success: '✅',
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  database: '🗄️',
  brain: '🧠',
  shield: '🛡️',
  lock: '🔒',
  globe: '🌐',
  gear: '⚙️',
  chart: '📊',
  book: '📚',
  sparkles: '✨',
  module: '📦',
  speed: '⚡'
};

export class RoshanaPrinter {
  private startTime = Date.now();

  public getBanner(config: any): string {
    const env = config.SERVER?.NODE_ENV || 'development';
    const envBadge = this.getEnvBadge(env);
    const host = config.SERVER?.HOST || '0.0.0.0';
    const port = config.SERVER?.PORT || 3000;
    const dbClient = config.DATABASE?.CLIENT || 'postgresql';
    const dbHost = config.DATABASE?.HOST || 'localhost';

    return `
${colors.cyan}${colors.bright}╔══════════════════════════════════════════════════════════════════════════════════╗
║ ${symbols.rocket}  ROSHANA ENTERPRISE FRAMEWORK  ${symbols.sparkles}                                          ║
║   Intelligent Educational Ecosystem with AI & Advanced Analytics                 ║
╚══════════════════════════════════════════════════════════════════════════════════╝${colors.reset}

${colors.green}Environment${colors.reset}   → ${envBadge}
${colors.green}Version${colors.reset}       → ${colors.bright}v4.1.0${colors.reset}
${colors.green}Server${colors.reset}        → ${colors.bright}${host}:${port}${colors.reset}
${colors.green}Database${colors.reset}      → ${colors.bright}${dbClient}${colors.reset} @ ${colors.bright}${dbHost}${colors.reset}
${colors.green}Roshana-SCI${colors.reset}   → ${this.getStatusText(config.ROSHANA_SCI?.ENABLED)}
${colors.green}Started${colors.reset}       → ${new Date().toLocaleString('fa-IR')}
`;
  }

  public getStatus(config: any): string {
    const env = config.SERVER?.NODE_ENV || 'development';
    const port = config.SERVER?.PORT || 3000;
    const host = config.SERVER?.HOST || '0.0.0.0';
    const apiVer = config.SERVER?.API_VERSION || 'v4';
    const dbClient = config.DATABASE?.CLIENT || 'pg';
    const poolMin = config.DATABASE?.POOL?.MIN ?? 2;
    const poolMax = config.DATABASE?.POOL?.MAX ?? 10;
    const rateLimitEnabled = config.SECURITY?.RATE_LIMIT?.ENABLED ?? true;
    const maxRequests = config.SECURITY?.RATE_LIMIT?.MAX_REQUESTS ?? 100;
    const anomalyDet = config.ROSHANA_SCI?.ANOMALY_DETECTION ?? true;
    const cacheEnabled = config.ROSHANA_SCI?.CACHE?.ENABLED ?? true;

    return `
${colors.bgBlue}${colors.white}${colors.bright} 📊 ROSHANA SYSTEM DASHBOARD ${colors.reset}

${colors.cyan}${colors.bright}SERVER${colors.reset}
   Host         : ${colors.bright}${host}${colors.reset}:${port}
   Environment  : ${this.getEnvBadge(env)}
   API Version  : ${colors.bright}${apiVer}${colors.reset}

${colors.cyan}${colors.bright}DATABASE${colors.reset}
   Client       : ${colors.bright}${dbClient}${colors.reset}
   Pool Connections: ${poolMin} ~ ${poolMax}

${colors.cyan}${colors.bright}SECURITY & CRITICALS${colors.reset}
   2FA Auth     : ${this.getStatusIcon(config.SECURITY?.TWO_FACTOR?.ENABLED ?? true)}
   Rate Limit   : ${rateLimitEnabled ? `${colors.green}Active${colors.reset} (${maxRequests} req/window)` : `${colors.red}Inactive${colors.reset}`}

${colors.cyan}${colors.bright}ROSHANA-SCI (AI MODULE)${colors.reset}
   Anomaly Detection : ${this.getStatusText(anomalyDet)}
   Cache Pipeline    : ${this.getStatusText(cacheEnabled)}

${colors.cyan}${colors.bright}UPTIME SPEED${colors.reset}
   Uptime Status : ${this.formatUptime()}
`;
  }

  public getModulesTable(config: any): string {
    const modules = [
      { name: 'LMS Core', enabled: config.LMS?.ENABLED ?? true, desc: 'Learning management system' },
      { name: 'AI Core (SCI)', enabled: config.ROSHANA_SCI?.ENABLED ?? true, desc: 'Anomaly detection and analytics' },
      { name: 'Financial Pipeline', enabled: config.FINANCIAL?.ENABLED ?? true, desc: 'Transaction ledger processor' },
      { name: 'Library Service', enabled: config.LIBRARY?.ENABLED ?? true, desc: 'Book logs & loans mapping' },
      { name: 'Virtual Classroom', enabled: config.VIRTUAL_CLASS?.ENABLED ?? true, desc: 'Video lectures aggregator' },
      { name: 'Gamification System', enabled: config.GAMIFICATION?.ENABLED ?? false, desc: 'Ranks, badges & point engines' },
      { name: 'IoT Edge Integrations', enabled: config.IOT?.ENABLED ?? false, desc: 'Hardware presence logs' }
    ];

    const separator = `${colors.gray}+-----------------------+----------+-------------------------------------+${colors.reset}`;
    const header = `${colors.bright}| Module Name           | Status   | System Description                 |${colors.reset}`;

    let tableLines = [separator, header, separator];

    modules.forEach((m) => {
      const statusText = m.enabled
        ? `${colors.green}ACTIVE  ${colors.reset}`
        : `${colors.red}INACTIVE${colors.reset}`;

      const namePadding = ' '.repeat(21 - m.name.length);
      const descPadding = ' '.repeat(35 - m.desc.length);

      tableLines.push(`| ${colors.bright}${m.name}${colors.reset}${namePadding} | ${statusText} | ${m.desc}${descPadding} |`);
    });

    tableLines.push(separator);

    return `\n${colors.cyan}${colors.bright}📦 ROSHANA ENTERPRISE ACTIVE MODULES REGISTRY${colors.reset}\n` + tableLines.join('\n');
  }

  public success(message: string, details: string = ''): string {
    return `${colors.green}${symbols.success} ${message}${colors.reset} ${details ? `${colors.gray}(${details})${colors.reset}` : ''}`;
  }

  public warn(message: string, details: string = ''): string {
    return `${colors.yellow}${symbols.warning} ${message}${colors.reset} ${details ? `${colors.gray}(${details})${colors.reset}` : ''}`;
  }

  public error(message: string, details: string = ''): string {
    return `${colors.red}${symbols.error} ${colors.bright}${message}${colors.reset} ${details ? `${colors.gray}(${details})${colors.reset}` : ''}`;
  }

  public info(message: string, details: string = ''): string {
    return `${colors.cyan}${symbols.info} ${message}${colors.reset} ${details ? `${colors.gray}(${details})${colors.reset}` : ''}`;
  }

  private getStatusText(enabled: boolean): string {
    return enabled ? `${colors.green}ENABLED${colors.reset}` : `${colors.red}DISABLED${colors.reset}`;
  }

  private getStatusIcon(enabled: boolean): string {
    return enabled ? `${colors.green}● Active${colors.reset}` : `${colors.red}○ Inactive${colors.reset}`;
  }

  private getEnvBadge(env: string): string {
    switch (env) {
      case 'production':
        return `${colors.bgRed}${colors.white}${colors.bright} PRODUCTION ${colors.reset}`;
      case 'staging':
        return `${colors.bgYellow}${colors.black}${colors.bright} STAGING ${colors.reset}`;
      case 'test':
        return `${colors.bgMagenta}${colors.white}${colors.bright} TEST CONTEXT ${colors.reset}`;
      default:
        return `${colors.bgGreen}${colors.black}${colors.bright} DEVELOPMENT ${colors.reset}`;
    }
  }

  private formatUptime(): string {
    const seconds = Math.floor((Date.now() - this.startTime) / 1000);
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return d > 0 
      ? `${d}d ${h}h ${m}m ${s}s` 
      : `${h}h ${m}m ${s}s`;
  }
}

export const printer = new RoshanaPrinter();
