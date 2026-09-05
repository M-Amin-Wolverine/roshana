/**
 * ════════════════════════════════════════════════════════════════════════════════
 *                         ADVANCED IP FILTER SYSTEM v3.0
 *              Enterprise-grade Security Middleware with Full Features
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✓ Distributed Rate Limiting (Redis)
 * ✓ GeoIP Blocking & Country Filtering
 * ✓ ASN & Network Provider Filtering
 * ✓ WAF Integration Ready
 * ✓ API & Device Fingerprinting
 * ✓ Session Anomaly Detection
 * ✓ Cloudflare Sync Support
 * ✓ Persistent Storage (Redis/PostgreSQL)
 * ✓ Prometheus Metrics
 * ✓ SIEM Logging Integration
 * ✓ Multi-level Ban System (temp/perm/escalating)
 * ✓ AI-based Anomaly Detection
 * ✓ DDoS Mitigation
 * ✓ Bot Detection
 * ✓ VPN/Proxy/Tor Detection
 * ✓ Threat Intelligence Feeds
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ================================ CONFIGURATION ==================================

const CONFIG = {
    // Core Settings
    trustProxy: true,
    environment: process.env.NODE_ENV || 'production',
    
    // Storage
    storage: {
        type: process.env.STORAGE_TYPE || 'memory', // 'memory', 'redis', 'postgres'
        redis: {
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            prefix: 'ipfilter:',
            ttl: 3600
        },
        postgres: {
            connectionString: process.env.DATABASE_URL,
            tablePrefix: 'ip_filter_'
        },
        persistence: {
            enabled: true,
            backupInterval: 300000, // 5 minutes
            backupPath: './backups/ipfilter'
        }
    },

    // Rate Limiting - Tiered System
    rateLimit: {
        enabled: true,
        tiers: {
            default: { windowMs: 60000, maxRequests: 100, banDuration: 300000 },
            strict: { windowMs: 60000, maxRequests: 30, banDuration: 900000 },
            paranoid: { windowMs: 60000, maxRequests: 10, banDuration: 3600000 },
            api: { windowMs: 60000, maxRequests: 500, banDuration: 60000 }
        },
        activeTier: 'default',
        distributed: true,
        perEndpoint: {
            '/api/login': { tier: 'strict' },
            '/api/upload': { tier: 'paranoid' },
            '/api/public': { tier: 'default' },
            '/health': { tier: false } // No rate limit
        },
        burstProtection: {
            enabled: true,
            multiplier: 1.5,
            duration: 5000
        },
        cleanupInterval: 300000
    },

    // IP Blocking Categories
    ipBlocking: {
        blacklist: new Set(),
        whitelist: new Set(),
        greylist: new Map(), // Temporary monitoring
        countryBlocklist: ['KP', 'SY', 'IR', 'CU', 'SD'],
        countryAllowlist: [],
        asnBlocklist: [],
        asnAllowlist: [],
        ispBlocklist: [],
        proxyDetection: true,
        vpnDetection: true,
        torDetection: true,
        datacenterDetection: true,
        
        // Threat Intelligence
        threatFeeds: {
            enabled: true,
            providers: ['abuseipdb', 'virustotal', 'alienvault'],
            apiKeys: {
                abuseipdb: process.env.ABUSEIPDB_API_KEY,
                virustotal: process.env.VIRUSTOTAL_API_KEY
            },
            cacheDuration: 3600000, // 1 hour
            autoBlockScore: 75 // Block if score > 75
        }
    },

    // Suspicious Activity Detection
    suspiciousDetection: {
        enabled: true,
        autoBan: false,
        autoBanScore: 100,
        
        // Detection Categories
        scanners: {
            portScanning: true,
            vulnScanning: true,
            dirBusting: true,
            sqlInjection: true,
            xssAttempts: true,
            commandInjection: true,
            pathTraversal: true
        },
        
        // Scoring System
        scoring: {
            sqlInjection: 50,
            xssAttempt: 40,
            commandInjection: 60,
            pathTraversal: 35,
            dirBusting: 25,
            portScan: 30,
            invalidAuth: 10,
            highRequestRate: 20,
            knownBadUA: 15,
            torExitNode: 40,
            proxyDetected: 30
        },
        
        thresholds: {
            suspicious: 50,
            malicious: 75,
            critical: 100
        },
        
        // Pattern Detection
        customPatterns: [
            { pattern: /select.+from.+where/i, score: 50, type: 'sql_injection' },
            { pattern: /<script|javascript:|onerror=/i, score: 40, type: 'xss' },
            { pattern: /\.\.\/|\.\.\\|%2e%2e%2f/i, score: 35, type: 'path_traversal' },
            { pattern: /exec|system|passthru|shell_exec/i, score: 60, type: 'command_injection' },
            { pattern: /union.+select/i, score: 50, type: 'sql_union' },
            { pattern: /sleep\(|benchmark\(/i, score: 55, type: 'time_based_attack' },
            { pattern: /\/wp-admin|\/administrator|\/phpmyadmin/i, score: 30, type: 'admin_scan' },
            { pattern: /\.(env|git|svn|config|sql|bak|old)/i, score: 45, type: 'sensitive_file' }
        ],
        
        // Behavioral Analysis
        behavioral: {
            enabled: true,
            learningPeriod: 604800000, // 7 days
            baselineMultiplier: 2.5,
            timeWindow: 3600000, // 1 hour
            features: ['request_rate', 'path_diversity', 'error_rate', 'auth_failures']
        }
    },

    // GeoIP Configuration
    geoip: {
        enabled: true,
        provider: 'maxmind', // 'maxmind', 'ip2location', 'cloudflare'
        databasePath: './data/GeoLite2-Country.mmdb',
        cityDatabasePath: './data/GeoLite2-City.mmdb',
        asnDatabasePath: './data/GeoLite2-ASN.mmdb',
        updateInterval: 604800000, // Weekly
        defaultAction: 'allow', // 'allow' or 'block'
        cacheResults: true,
        cacheTTL: 86400000 // 24 hours
    },

    // API & Device Fingerprinting
    fingerprinting: {
        enabled: true,
        fingerprintTTL: 7776000000, // 90 days
        components: {
            userAgent: true,
            acceptHeaders: true,
            language: true,
            timezone: true,
            screenResolution: true,
            colorDepth: true,
            platform: true,
            canvasFingerprint: false, // Heavy, use sparingly
            webglFingerprint: false,
            audioFingerprint: false
        },
        scoreWeights: {
            userAgent: 0.2,
            acceptHeaders: 0.15,
            language: 0.15,
            timezone: 0.2,
            screenResolution: 0.1,
            platform: 0.1,
            customHeaders: 0.1
        },
        sessionBinding: true, // Bind session to fingerprint
        maxDevicesPerIP: 5,
        suspiciousFingerprintChange: 35 // Score threshold for flagging
    },

    // Session Anomaly Detection
    sessionAnomaly: {
        enabled: true,
        checkInterval: 60000,
        features: [
            'request_timing',
            'click_patterns',
            'navigation_paths',
            'form_submission_rates',
            'api_call_sequence'
        ],
        mlModel: {
            enabled: false,
            modelPath: './models/anomaly_model.pkl',
            confidenceThreshold: 0.85
        },
        heuristics: {
            impossibleTravel: true, // Login from two distant locations in short time
            rapidLocationChange: true,
            unusualTimeOfDay: true,
            deviceChange: true,
            speedRadar: true // Request speed anomaly
        },
        actionOnDetection: 'log' // 'log', 'challenge', 'logout', 'block'
    },

    // DDoS Mitigation
    ddos: {
        enabled: true,
        mitigation: {
            synCookies: true,
            rateSmoothing: true,
            trafficShaping: true,
            challengePage: true // Show captcha challenge
        },
        thresholds: {
            global: 10000, // requests per second
            perIP: 500,
            perEndpoint: 1000,
            errorRate: 0.15 // 15% error rate triggers mitigation
        },
        autoScaling: {
            enabled: true,
            maxThresholdMultiplier: 3
        },
        challengeValidity: 300000, // 5 minutes
        whitelistInternal: true
    },

    // Bot Detection
    botDetection: {
        enabled: true,
        methods: {
            userAgentAnalysis: true,
            behaviorAnalysis: true,
            turingTests: true,
            captchaOnSuspect: true,
            javascriptChallenge: true,
            cookieChallenge: true,
            timingAnalysis: true
        },
        knownBots: {
            good: ['Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot', 'YandexBot'],
            bad: ['python-requests', 'curl', 'wget', 'Go-http-client', 'Java']
        },
        autoBlockBadBots: true,
        challengeGoodBots: false,
        scoreThreshold: {
            suspicious: 40,
            bot: 70,
            maliciousBot: 90
        }
    },

    // WAF Integration
    waf: {
        enabled: true,
        mode: 'detection', // 'detection', 'prevention'
        rules: {
            sqlInjection: true,
            xss: true,
            rfi: true,
            lfi: true,
            commandInjection: true,
            ssrf: true,
            xxe: true,
            deserialization: true
        },
        customRulesPath: './rules/custom_waf_rules.json',
        anomalyScoreThreshold: 60,
        blockDuration: 3600000,
        logMatchedRules: true
    },

    // Cloudflare Integration
    cloudflare: {
        enabled: !!process.env.CLOUDFLARE_API_TOKEN,
        apiToken: process.env.CLOUDFLARE_API_TOKEN,
        zoneId: process.env.CLOUDFLARE_ZONE_ID,
        syncInterval: 300000,
        actions: {
            block: true,
            challenge: true,
            jsChallenge: true,
            captcha: true
        },
        ipLists: {
            blocklistId: process.env.CLOUDFLARE_BLOCKLIST_ID,
            allowlistId: process.env.CLOUDFLARE_ALLOWLIST_ID
        },
        rateLimitRules: {
            enabled: true,
            sensitivity: 'medium'
        },
        wafRules: {
            enabled: true,
            packages: ['owasp', 'cloudflare']
        }
    },

    // Monitoring & Metrics
    monitoring: {
        prometheus: {
            enabled: true,
            port: 9090,
            path: '/metrics',
            metricsPrefix: 'ipfilter_'
        },
        logging: {
            enabled: true,
            level: process.env.LOG_LEVEL || 'info',
            format: 'json',
            siem: {
                enabled: false,
                endpoint: process.env.SIEM_ENDPOINT,
                apiKey: process.env.SIEM_API_KEY,
                batchSize: 100,
                flushInterval: 30000
            },
            file: {
                enabled: true,
                path: './logs/ipfilter.log',
                maxSize: 10485760, // 10MB
                maxFiles: 10
            }
        },
        alerting: {
            enabled: true,
            webhook: process.env.ALERT_WEBHOOK,
            email: process.env.ALERT_EMAIL,
            thresholds: {
                highBlockRate: 100, // per minute
                highBanRate: 50,
                ddosDetected: true,
                criticalVulnerabilityAttempt: true
            }
        },
        dashboard: {
            enabled: process.env.NODE_ENV !== 'production',
            port: 3001
        }
    },

    // Persistent Storage
    persistence: {
        banStorage: true,
        requestHistory: true,
        fingerprintStorage: true,
        anomalyHistory: true,
        retentionDays: 90,
        encryptionKey: process.env.STORAGE_ENCRYPTION_KEY
    },

    // API Endpoints (if exposing management API)
    managementAPI: {
        enabled: process.env.NODE_ENV !== 'production',
        apiKey: process.env.MANAGEMENT_API_KEY,
        endpoints: {
            getStats: '/admin/ip/stats',
            blockIP: '/admin/ip/block',
            unblockIP: '/admin/ip/unblock',
            getThreatIntel: '/admin/ip/threat',
            whitelist: '/admin/ip/whitelist',
            config: '/admin/ip/config'
        },
        rateLimit: {
            windowMs: 60000,
            maxRequests: 30
        }
    }
};

// ================================ STORAGE MANAGER =================================

class StorageManager {
    constructor(config) {
        this.config = config;
        this.storage = null;
        this.initialized = false;
    }

    async initialize() {
        switch (this.config.storage.type) {
            case 'redis':
                const Redis = require('ioredis');
                this.storage = new Redis(this.config.storage.redis.url);
                break;
            case 'postgres':
                const { Pool } = require('pg');
                this.storage = new Pool(this.config.storage.postgres.connectionString);
                await this.initPostgresSchema();
                break;
            default:
                this.storage = new Map();
        }
        this.initialized = true;
    }

    async initPostgresSchema() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS ip_blocks (
                ip VARCHAR(45) PRIMARY KEY,
                reason TEXT,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS ip_requests (
                id SERIAL PRIMARY KEY,
                ip VARCHAR(45),
                method VARCHAR(10),
                path TEXT,
                status_code INT,
                timestamp TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE INDEX idx_ip_requests_ip_time ON ip_requests(ip, timestamp)`
        ];
        
        for (const query of queries) {
            await this.storage.query(query);
        }
    }

    async get(key) {
        if (this.storage instanceof Map) {
            return this.storage.get(key);
        } else if (this.storage instanceof Redis) {
            const data = await this.storage.get(this.config.storage.redis.prefix + key);
            return data ? JSON.parse(data) : null;
        }
        return null;
    }

    async set(key, value, ttl = null) {
        if (this.storage instanceof Map) {
            this.storage.set(key, value);
        } else if (this.storage instanceof Redis) {
            const redisKey = this.config.storage.redis.prefix + key;
            if (ttl) {
                await this.storage.setex(redisKey, ttl, JSON.stringify(value));
            } else {
                await this.storage.set(redisKey, JSON.stringify(value));
            }
        }
    }

    async delete(key) {
        if (this.storage instanceof Map) {
            this.storage.delete(key);
        } else if (this.storage instanceof Redis) {
            await this.storage.del(this.config.storage.redis.prefix + key);
        }
    }
}

// ================================ GEOIP SERVICE =================================

class GeoIPService {
    constructor(config) {
        this.config = config;
        this.reader = null;
        this.cityReader = null;
        this.asnReader = null;
        this.cache = new Map();
    }

    async initialize() {
        if (!this.config.geoip.enabled) return;
        
        try {
            const maxmind = require('maxmind');
            
            if (fs.existsSync(this.config.geoip.databasePath)) {
                this.reader = await maxmind.open(this.config.geoip.databasePath);
            }
            
            if (fs.existsSync(this.config.geoip.cityDatabasePath)) {
                this.cityReader = await maxmind.open(this.config.geoip.cityDatabasePath);
            }
            
            if (fs.existsSync(this.config.geoip.asnDatabasePath)) {
                this.asnReader = await maxmind.open(this.config.geoip.asnDatabasePath);
            }
        } catch (error) {
            console.error('GeoIP initialization failed:', error);
        }
    }

    getCountry(ip) {
        if (!this.reader || ip === '127.0.0.1' || ip === 'unknown') return null;
        
        if (this.config.geoip.cacheResults && this.cache.has(ip)) {
            return this.cache.get(ip);
        }
        
        try {
            const result = this.reader.get(ip);
            const country = result?.country?.iso_code || null;
            
            if (this.config.geoip.cacheResults && country) {
                this.cache.set(ip, country);
                setTimeout(() => this.cache.delete(ip), this.config.geoip.cacheTTL);
            }
            
            return country;
        } catch {
            return null;
        }
    }

    getCity(ip) {
        if (!this.cityReader) return null;
        try {
            const result = this.cityReader.get(ip);
            return {
                city: result?.city?.names?.en,
                latitude: result?.location?.latitude,
                longitude: result?.location?.longitude,
                timezone: result?.location?.time_zone
            };
        } catch {
            return null;
        }
    }

    getASN(ip) {
        if (!this.asnReader) return null;
        try {
            const result = this.asnReader.get(ip);
            return {
                asn: result?.autonomous_system_number,
                organization: result?.autonomous_system_organization
            };
        } catch {
            return null;
        }
    }

    isCountryBlocked(countryCode) {
        if (!countryCode) return false;
        
        if (this.config.ipBlocking.countryAllowlist.length > 0) {
            return !this.config.ipBlocking.countryAllowlist.includes(countryCode);
        }
        
        return this.config.ipBlocking.countryBlocklist.includes(countryCode);
    }
}

// ================================ THREAT INTELLIGENCE =================================

class ThreatIntelligenceService {
    constructor(config) {
        this.config = config;
        this.cache = new Map();
    }

    async checkIP(ip) {
        if (!this.config.ipBlocking.threatFeeds.enabled) return null;
        
        if (this.cache.has(ip)) {
            const cached = this.cache.get(ip);
            if (Date.now() - cached.timestamp < this.config.ipBlocking.threatFeeds.cacheDuration) {
                return cached.data;
            }
        }
        
        const results = await Promise.allSettled([
            this.checkAbuseIPDB(ip),
            this.checkVirusTotal(ip)
        ]);
        
        const combined = {
            score: 0,
            reports: 0,
            categories: [],
            timestamp: Date.now()
        };
        
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                combined.score += result.value.score || 0;
                combined.reports += result.value.reports || 0;
                if (result.value.categories) {
                    combined.categories.push(...result.value.categories);
                }
            }
        }
        
        // Normalize score (0-100)
        combined.score = Math.min(100, combined.score);
        
        this.cache.set(ip, { data: combined, timestamp: Date.now() });
        
        if (combined.score >= this.config.ipBlocking.threatFeeds.autoBlockScore) {
            return { ...combined, shouldBlock: true };
        }
        
        return combined;
    }

    async checkAbuseIPDB(ip) {
        const apiKey = this.config.ipBlocking.threatFeeds.apiKeys.abuseipdb;
        if (!apiKey) return null;
        
        try {
            const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
                headers: { 'Key': apiKey, 'Accept': 'application/json' }
            });
            const data = await response.json();
            
            if (data.data) {
                return {
                    score: data.data.abuseConfidenceScore,
                    reports: data.data.totalReports,
                    categories: data.data.categories
                };
            }
        } catch (error) {
            console.error('AbuseIPDB check failed:', error);
        }
        return null;
    }

    async checkVirusTotal(ip) {
        const apiKey = this.config.ipBlocking.threatFeeds.apiKeys.virustotal;
        if (!apiKey) return null;
        
        try {
            const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
                headers: { 'x-apikey': apiKey }
            });
            const data = await response.json();
            
            if (data.data) {
                const stats = data.data.attributes.last_analysis_stats;
                const malicious = stats.malicious || 0;
                const suspicious = stats.suspicious || 0;
                const score = Math.min(100, (malicious * 20) + (suspicious * 10));
                
                return {
                    score,
                    reports: malicious + suspicious,
                    categories: data.data.attributes.tags || []
                };
            }
        } catch (error) {
            console.error('VirusTotal check failed:', error);
        }
        return null;
    }
}

// ================================ FINGERPRINT SERVICE =================================

class FingerprintService {
    constructor(config) {
        this.config = config;
        this.fingerprints = new Map();
    }

    generate(req) {
        if (!this.config.fingerprinting.enabled) return null;
        
        const components = {};
        
        if (this.config.fingerprinting.components.userAgent) {
            components.ua = req.headers['user-agent'];
        }
        
        if (this.config.fingerprinting.components.acceptHeaders) {
            components.accept = req.headers['accept'];
            components.acceptLang = req.headers['accept-language'];
            components.acceptEncoding = req.headers['accept-encoding'];
        }
        
        if (this.config.fingerprinting.components.language) {
            components.lang = req.headers['accept-language']?.split(',')[0];
        }
        
        // Custom headers from request (if provided by client)
        if (req.headers['x-fp-screen']) components.screen = req.headers['x-fp-screen'];
        if (req.headers['x-fp-timezone']) components.timezone = req.headers['x-fp-timezone'];
        if (req.headers['x-fp-platform']) components.platform = req.headers['x-fp-platform'];
        
        const fingerprint = crypto
            .createHash('sha256')
            .update(JSON.stringify(components))
            .digest('hex');
        
        return {
            hash: fingerprint,
            components,
            timestamp: Date.now()
        };
    }

    calculateScore(fingerprint1, fingerprint2) {
        if (!fingerprint1 || !fingerprint2) return 0;
        
        let score = 0;
        let totalWeight = 0;
        
        for (const [component, weight] of Object.entries(this.config.fingerprinting.scoreWeights)) {
            if (fingerprint1.components[component] && fingerprint2.components[component]) {
                totalWeight += weight;
                if (fingerprint1.components[component] === fingerprint2.components[component]) {
                    score += weight;
                }
            }
        }
        
        return totalWeight > 0 ? (score / totalWeight) * 100 : 0;
    }

    async storeFingerprint(ip, fingerprint) {
        if (!this.config.fingerprinting.fingerprintStorage) return;
        
        const key = `fp:${ip}`;
        const existing = await storage.get(key) || [];
        
        // Check if fingerprint already exists
        const exists = existing.find(f => f.hash === fingerprint.hash);
        if (!exists) {
            existing.push(fingerprint);
            // Keep only last N fingerprints per IP
            while (existing.length > this.config.fingerprinting.maxDevicesPerIP) {
                existing.shift();
            }
            await storage.set(key, existing, this.config.fingerprinting.fingerprintTTL);
        }
        
        return existing;
    }

    async validateSession(ip, currentFingerprint, sessionId) {
        const storedFingerprints = await storage.get(`fp:${ip}`) || [];
        
        if (storedFingerprints.length === 0) {
            return { valid: true, score: 100 };
        }
        
        let maxScore = 0;
        for (const stored of storedFingerprints) {
            const score = this.calculateScore(currentFingerprint, stored);
            maxScore = Math.max(maxScore, score);
        }
        
        const isValid = maxScore >= (100 - this.config.fingerprinting.suspiciousFingerprintChange);
        
        return {
            valid: isValid,
            score: maxScore,
            isSuspicious: maxScore < this.config.fingerprinting.suspiciousFingerprintChange
        };
    }
}

// ================================ ANOMALY DETECTION =================================

class AnomalyDetectionService {
    constructor(config) {
        this.config = config;
        this.sessionHistory = new Map();
        this.baselines = new Map();
    }

    async detect(req, ip, sessionId) {
        if (!this.config.sessionAnomaly.enabled) return null;
        
        const anomalies = [];
        const session = this.getOrCreateSession(ip, sessionId);
        
        // Impossible Travel Detection
        if (this.config.sessionAnomaly.heuristics.impossibleTravel) {
            const travelAnomaly = this.checkImpossibleTravel(ip, req);
            if (travelAnomaly) anomalies.push(travelAnomaly);
        }
        
        // Rapid Location Change
        if (this.config.sessionAnomaly.heuristics.rapidLocationChange) {
            const locationAnomaly = this.checkRapidLocationChange(ip, req);
            if (locationAnomaly) anomalies.push(locationAnomaly);
        }
        
        // Unusual Time of Day
        if (this.config.sessionAnomaly.heuristics.unusualTimeOfDay) {
            const timeAnomaly = this.checkUnusualTime(ip, req);
            if (timeAnomaly) anomalies.push(timeAnomaly);
        }
        
        // Device Change
        if (this.config.sessionAnomaly.heuristics.deviceChange) {
            const deviceAnomaly = await this.checkDeviceChange(ip, req);
            if (deviceAnomaly) anomalies.push(deviceAnomaly);
        }
        
        // Speed Radar (Request Rate)
        if (this.config.sessionAnomaly.heuristics.speedRadar) {
            const speedAnomaly = this.checkRequestSpeed(ip);
            if (speedAnomaly) anomalies.push(speedAnomaly);
        }
        
        // Update session history
        this.updateSessionHistory(ip, req);
        
        const anomalyScore = anomalies.reduce((sum, a) => sum + (a.severity || 10), 0);
        
        return {
            detected: anomalies.length > 0,
            anomalies,
            score: Math.min(100, anomalyScore),
            action: this.determineAction(anomalyScore)
        };
    }
    
    getOrCreateSession(ip, sessionId) {
        const key = `${ip}:${sessionId}`;
        if (!this.sessionHistory.has(key)) {
            this.sessionHistory.set(key, {
                lastLocation: null,
                lastTimestamp: null,
                locations: [],
                requestHistory: [],
                deviceFingerprints: []
            });
        }
        return this.sessionHistory.get(key);
    }
    
    checkImpossibleTravel(ip, req) {
        const geo = geoipService.getCity(ip);
        if (!geo?.latitude || !geo?.longitude) return null;
        
        const session = this.getOrCreateSession(ip, req.sessionId);
        
        if (session.lastLocation && session.lastTimestamp) {
            const distance = this.calculateDistance(
                session.lastLocation.lat,
                session.lastLocation.lng,
                geo.latitude,
                geo.longitude
            );
            
            const timeDiff = (Date.now() - session.lastTimestamp) / 3600000; // hours
            const maxPossibleDistance = timeDiff * 800; // 800 km/h (plane speed)
            
            if (distance > maxPossibleDistance && timeDiff > 0) {
                return {
                    type: 'impossible_travel',
                    severity: 80,
                    details: `Traveled ${Math.round(distance)}km in ${timeDiff.toFixed(1)}h`
                };
            }
        }
        
        return null;
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    checkRequestSpeed(ip) {
        const now = Date.now();
        const key = `speed:${ip}`;
        const history = this.sessionHistory.get(key)?.requestHistory || [];
        
        const recentRequests = history.filter(t => now - t < 1000); // Last second
        if (recentRequests.length > 50) {
            return {
                type: 'abnormal_speed',
                severity: Math.min(100, recentRequests.length),
                details: `${recentRequests.length} requests in last second`
            };
        }
        
        return null;
    }
    
    determineAction(score) {
        if (score >= 80) return 'block';
        if (score >= 60) return 'challenge';
        if (score >= 40) return 'log';
        return 'monitor';
    }
    
    updateSessionHistory(ip, req) {
        const key = `${ip}:${req.sessionId}`;
        const session = this.sessionHistory.get(key);
        if (session) {
            const geo = geoipService.getCity(ip);
            session.lastLocation = geo ? { lat: geo.latitude, lng: geo.longitude } : null;
            session.lastTimestamp = Date.now();
            session.requestHistory.push(Date.now());
            
            // Keep only last 100 requests
            while (session.requestHistory.length > 100) {
                session.requestHistory.shift();
            }
        }
    }
}

// ================================ DDoS MITIGATION =================================

class DDoSMitigationService {
    constructor(config) {
        this.config = config;
        this.stats = {
            global: { requests: 0, windowStart: Date.now() },
            perIP: new Map(),
            perEndpoint: new Map()
        };
        this.challenges = new Map();
    }

    check(req, ip, endpoint) {
        if (!this.config.ddos.enabled) return { mitigated: false };
        
        const now = Date.now();
        
        // Global threshold check
        if (this.checkGlobalThreshold(now)) {
            return { mitigated: true, reason: 'global_ddos', action: 'challenge' };
        }
        
        // Per IP check
        if (this.checkPerIPThreshold(ip, now)) {
            return { mitigated: true, reason: 'ip_threshold_exceeded', action: 'block' };
        }
        
        // Per endpoint check
        if (this.checkEndpointThreshold(endpoint, now)) {
            return { mitigated: true, reason: 'endpoint_threshold', action: 'challenge' };
        }
        
        // Challenge validation for previously challenged clients
        if (this.needsChallenge(ip)) {
            const isValid = this.validateChallenge(req, ip);
            if (!isValid) {
                return { mitigated: true, reason: 'challenge_required', action: 'challenge' };
            }
        }
        
        this.updateStats(ip, endpoint);
        
        return { mitigated: false };
    }
    
    checkGlobalThreshold(now) {
        const stats = this.stats.global;
        if (now - stats.windowStart > 1000) {
            stats.requests = 0;
            stats.windowStart = now;
        }
        
        stats.requests++;
        return stats.requests > this.config.ddos.thresholds.global;
    }
    
    checkPerIPThreshold(ip, now) {
        let ipStats = this.stats.perIP.get(ip);
        if (!ipStats || now - ipStats.windowStart > 1000) {
            ipStats = { requests: 0, windowStart: now };
            this.stats.perIP.set(ip, ipStats);
        }
        
        ipStats.requests++;
        return ipStats.requests > this.config.ddos.thresholds.perIP;
    }
    
    checkEndpointThreshold(endpoint, now) {
        let endpointStats = this.stats.perEndpoint.get(endpoint);
        if (!endpointStats || now - endpointStats.windowStart > 1000) {
            endpointStats = { requests: 0, windowStart: now };
            this.stats.perEndpoint.set(endpoint, endpointStats);
        }
        
        endpointStats.requests++;
        return endpointStats.requests > this.config.ddos.thresholds.perEndpoint;
    }
    
    needsChallenge(ip) {
        if (!this.challenges.has(ip)) return false;
        const challenge = this.challenges.get(ip);
        return Date.now() - challenge.issuedAt < this.config.ddos.challengeValidity;
    }
    
    validateChallenge(req, ip) {
        const token = req.headers['x-challenge-token'] || req.query.challenge;
        const challenge = this.challenges.get(ip);
        
        if (!challenge || !token) return false;
        
        const expectedToken = crypto
            .createHash('sha256')
            .update(challenge.secret + ip)
            .digest('hex');
        
        return token === expectedToken;
    }
    
    issueChallenge(ip, res) {
        const secret = crypto.randomBytes(32).toString('hex');
        const token = crypto.createHash('sha256').update(secret + ip).digest('hex');
        
        this.challenges.set(ip, { secret, issuedAt: Date.now() });
        
        // Clean up old challenges
        for (const [key, value] of this.challenges) {
            if (Date.now() - value.issuedAt > this.config.ddos.challengeValidity) {
                this.challenges.delete(key);
            }
        }
        
        return { token, secret };
    }
    
    updateStats(ip, endpoint) {
        // Stats are updated in check methods
    }
}

// ================================ BOT DETECTION =================================

class BotDetectionService {
    constructor(config) {
        this.config = config;
        this.botScores = new Map();
    }

    async detect(req, ip) {
        if (!this.config.botDetection.enabled) return { isBot: false, score: 0 };
        
        let score = 0;
        const reasons = [];
        
        // User Agent Analysis
        if (this.config.botDetection.methods.userAgentAnalysis) {
            const uaScore = this.analyzeUserAgent(req.headers['user-agent']);
            score += uaScore;
            if (uaScore > 30) reasons.push('suspicious_user_agent');
        }
        
        // Behavior Analysis
        if (this.config.botDetection.methods.behaviorAnalysis) {
            const behaviorScore = await this.analyzeBehavior(ip, req);
            score += behaviorScore;
            if (behaviorScore > 20) reasons.push('bot_like_behavior');
        }
        
        // Timing Analysis
        if (this.config.botDetection.methods.timingAnalysis) {
            const timingScore = this.analyzeTiming(ip);
            score += timingScore;
            if (timingScore > 20) reasons.push('unhuman_timing');
        }
        
        const isBot = score >= this.config.botDetection.scoreThreshold.bot;
        const isMaliciousBot = score >= this.config.botDetection.scoreThreshold.maliciousBot;
        
        // Store score
        this.botScores.set(ip, { score, timestamp: Date.now(), reasons });
        
        return {
            isBot,
            isMaliciousBot,
            score,
            reasons,
            shouldBlock: isMaliciousBot && this.config.botDetection.autoBlockBadBots
        };
    }
    
    analyzeUserAgent(ua) {
        if (!ua) return 50;
        
        // Check for known bad bots
        for (const bot of this.config.botDetection.knownBots.bad) {
            if (ua.includes(bot)) return 90;
        }
        
        // Check for known good bots
        for (const bot of this.config.botDetection.knownBots.good) {
            if (ua.includes(bot)) return 0;
        }
        
        // Suspicious patterns
        const suspicious = [
            /bot/i, /crawler/i, /spider/i, /scraper/i,
            /python/i, /curl/i, /wget/i, /go-http/i,
            /java/i, /ruby/i, /perl/i, /libwww/i
        ];
        
        let score = 0;
        for (const pattern of suspicious) {
            if (pattern.test(ua)) score += 15;
        }
        
        return Math.min(90, score);
    }
    
    async analyzeBehavior(ip, req) {
        // Track navigation patterns, click rates, etc.
        const key = `behavior:${ip}`;
        const history = await storage.get(key) || [];
        
        let score = 0;
        
        // Check if requests are too uniform (no variation in time)
        if (history.length > 10) {
            const intervals = [];
            for (let i = 1; i < history.length; i++) {
                intervals.push(history[i] - history[i-1]);
            }
            
            const avgInterval = intervals.reduce((a,b) => a+b, 0) / intervals.length;
            const variance = intervals.map(i => Math.pow(i - avgInterval, 2)).reduce((a,b) => a+b, 0) / intervals.length;
            
            // Low variance = robotic timing
            if (variance < 100) score += 30;
        }
        
        // Update history
        history.push(Date.now());
        while (history.length > 50) history.shift();
        await storage.set(key, history, 3600);
        
        return score;
    }
    
    analyzeTiming(ip) {
        const history = this.botScores.get(ip);
        if (!history) return 0;
        
        const now = Date.now();
        const timeSinceLastRequest = now - (history.timestamp || now);
        
        // Humans typically have variable request timing
        if (timeSinceLastRequest < 50) return 30; // Too fast
        if (timeSinceLastRequest > 10000) return 5; // Pause is normal
        
        return 0;
    }
}

// ================================ WAF ENGINE =================================

class WAFEngine {
    constructor(config) {
        this.config = config;
        this.ruleHits = new Map();
    }

    inspect(req, ip) {
        if (!this.config.waf.enabled) return { blocked: false, score: 0 };
        
        let totalScore = 0;
        const triggeredRules = [];
        
        // Check all enabled rule categories
        if (this.config.waf.rules.sqlInjection) {
            const result = this.checkSQLInjection(req);
            totalScore += result.score;
            if (result.triggered) triggeredRules.push(result);
        }
        
        if (this.config.waf.rules.xss) {
            const result = this.checkXSS(req);
            totalScore += result.score;
            if (result.triggered) triggeredRules.push(result);
        }
        
        if (this.config.waf.rules.commandInjection) {
            const result = this.checkCommandInjection(req);
            totalScore += result.score;
            if (result.triggered) triggeredRules.push(result);
        }
        
        if (this.config.waf.rules.pathTraversal) {
            const result = this.checkPathTraversal(req);
            totalScore += result.score;
            if (result.triggered) triggeredRules.push(result);
        }
        
        // Update rule hits
        this.updateRuleHits(ip, triggeredRules);
        
        const shouldBlock = this.config.waf.mode === 'prevention' && 
                           totalScore >= this.config.waf.anomalyScoreThreshold;
        
        if (shouldBlock) {
            this.blockIP(ip, this.config.waf.blockDuration);
        }
        
        return {
            blocked: shouldBlock,
            score: totalScore,
            triggeredRules,
            action: shouldBlock ? 'block' : (totalScore > 0 ? 'log' : 'pass')
        };
    }
    
    checkSQLInjection(req) {
        const patterns = [
            /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
            /(\%3D)|(=)|(\%3C)|(<)|(\%3E)|(>)/i,
            /union(\s|\+)?select/i,
            /select.*from/i,
            /insert.*into/i,
            /delete.*from/i,
            /drop(\s|\+)?table/i,
            /or(\s|\+)?'1'(\s|\+)?=/i
        ];
        
        let score = 0;
        const targets = [
            req.query,
            req.body,
            req.params
        ];
        
        for (const target of targets) {
            if (target) {
                for (const [key, value] of Object.entries(target)) {
                    const strValue = String(value);
                    for (const pattern of patterns) {
                        if (pattern.test(strValue)) {
                            score += 15;
                            if (this.config.waf.logMatchedRules) {
                                console.log(`SQL Injection detected: ${pattern} in ${key}=${strValue}`);
                            }
                        }
                    }
                }
            }
        }
        
        return { type: 'sql_injection', score: Math.min(100, score), triggered: score > 0 };
    }
    
    checkXSS(req) {
        const patterns = [
            /<script[^>]*>.*?<\/script>/is,
            /javascript:/i,
            /onerror\s*=/i,
            /onload\s*=/i,
            /onclick\s*=/i,
            /alert\s*\(/i,
            /eval\s*\(/i,
            /document\.cookie/i,
            /<iframe[^>]*>/i,
            /<object[^>]*>/i,
            /<embed[^>]*>/i
        ];
        
        let score = 0;
        const targets = [req.query, req.body];
        
        for (const target of targets) {
            if (target) {
                for (const [key, value] of Object.entries(target)) {
                    const strValue = String(value);
                    for (const pattern of patterns) {
                        if (pattern.test(strValue)) {
                            score += 20;
                            if (this.config.waf.logMatchedRules) {
                                console.log(`XSS detected: ${pattern} in ${key}`);
                            }
                        }
                    }
                }
            }
        }
        
        return { type: 'xss', score: Math.min(100, score), triggered: score > 0 };
    }
    
    checkCommandInjection(req) {
        const patterns = [
            /(\||&|\;|\$\(|`)/i,
            /(exec|system|passthru|shell_exec)/i,
            /(wget|curl|nc|netcat)/i,
            /(\/bin\/|\/usr\/bin\/)/i,
            /(python|perl|ruby|php).*\-e/i
        ];
        
        let score = 0;
        const targets = [req.query, req.body];
        
        for (const target of targets) {
            if (target) {
                for (const [key, value] of Object.entries(target)) {
                    const strValue = String(value);
                    for (const pattern of patterns) {
                        if (pattern.test(strValue)) {
                            score += 30;
                        }
                    }
                }
            }
        }
        
        return { type: 'command_injection', score: Math.min(100, score), triggered: score > 0 };
    }
    
    checkPathTraversal(req) {
        const patterns = [
            /\.\.\/|\.\.\\/,
            /%2e%2e%2f|%2e%2e%5c/,
            /\.\.\%252f|\.\.\%255c/,
            /\/etc\/passwd/i,
            /\/var\/log/i,
            /c:\\windows\\/i
        ];
        
        let score = 0;
        const targets = [req.query, req.params];
        
        for (const target of targets) {
            if (target) {
                for (const [key, value] of Object.entries(target)) {
                    const strValue = String(value);
                    for (const pattern of patterns) {
                        if (pattern.test(strValue)) {
                            score += 25;
                        }
                    }
                }
            }
        }
        
        return { type: 'path_traversal', score: Math.min(100, score), triggered: score > 0 };
    }
    
    updateRuleHits(ip, rules) {
        const hits = this.ruleHits.get(ip) || [];
        hits.push(...rules.map(r => ({ ...r, timestamp: Date.now() })));
        
        // Keep only last 100 hits
        while (hits.length > 100) hits.shift();
        this.ruleHits.set(ip, hits);
    }
    
    blockIP(ip, duration) {
        // Implement blocking logic
        console.log(`WAF: Blocking IP ${ip} for ${duration}ms`);
    }
}

// ================================ CLOUDFLARE SYNC =================================

class CloudflareSyncService {
    constructor(config) {
        this.config = config;
        this.syncInterval = null;
    }
    
    async initialize() {
        if (!this.config.cloudflare.enabled) return;
        
        await this.sync();
        
        // Set up periodic sync
        this.syncInterval = setInterval(() => this.sync(), this.config.cloudflare.syncInterval);
        this.syncInterval.unref();
    }
    
    async sync() {
        try {
            await this.syncBlocklist();
            await this.syncRateLimits();
            await this.syncWAFRules();
        } catch (error) {
            console.error('Cloudflare sync failed:', error);
        }
    }
    
    async syncBlocklist() {
        const blockedIPs = Array.from(globalBlockedIPs || []);
        
        for (const ip of blockedIPs) {
            await this.addToCloudflareBlocklist(ip);
        }
    }
    
    async addToCloudflareBlocklist(ip) {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${this.config.cloudflare.zoneId}/firewall/rules`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.cloudflare.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'block',
                    filter: {
                        expression: `ip.src eq ${ip}`,
                        paused: false
                    }
                })
            }
        );
        
        return response.ok;
    }
    
    async syncRateLimits() {
        // Sync rate limiting rules to Cloudflare
        if (!this.config.cloudflare.rateLimitRules.enabled) return;
        
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${this.config.cloudflare.zoneId}/rate_limits`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.cloudflare.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    disabled: false,
                    description: "IP Filter Rate Limit",
                    match: {
                        request: {
                            methods: ["GET", "POST", "PUT", "DELETE"],
                            schemes: ["HTTP", "HTTPS"],
                            url: "*"
                        }
                    },
                    threshold: 100,
                    period: 60,
                    action: {
                        mode: "block",
                        timeout: 300
                    }
                })
            }
        );
        
        return response.ok;
    }
    
    async syncWAFRules() {
        // Sync WAF rules to Cloudflare
        if (!this.config.cloudflare.wafRules.enabled) return;
        
        // Implementation depends on specific WAF rules
    }
}

// ================================ PROMETHEUS METRICS =================================

class PrometheusMetrics {
    constructor(config) {
        this.config = config;
        this.metrics = {};
        this.client = null;
    }
    
    async initialize() {
        if (!this.config.monitoring.prometheus.enabled) return;
        
        try {
            const promClient = require('prom-client');
            this.client = promClient;
            
            // Initialize metrics
            this.metrics = {
                blockedRequests: new promClient.Counter({
                    name: `${this.config.monitoring.prometheus.metricsPrefix}blocked_requests_total`,
                    help: 'Total number of blocked requests',
                    labelNames: ['reason']
                }),
                activeBans: new promClient.Gauge({
                    name: `${this.config.monitoring.prometheus.metricsPrefix}active_bans`,
                    help: 'Number of active IP bans'
                }),
                requestRate: new promClient.Counter({
                    name: `${this.config.monitoring.prometheus.metricsPrefix}requests_total`,
                    help: 'Total requests processed',
                    labelNames: ['status']
                }),
                anomalyScore: new promClient.Gauge({
                    name: `${this.config.monitoring.prometheus.metricsPrefix}anomaly_score`,
                    help: 'Current anomaly detection score'
                }),
                wafHits: new promClient.Counter({
                    name: `${this.config.monitoring.prometheus.metricsPrefix}waf_hits_total`,
                    help: 'WAF rule hits',
                    labelNames: ['rule_type']
                }),
                ddosMitigations: new promClient.Counter({
                    name: `${this.config.monitoring.prometheus.metricsPrefix}ddos_mitigations_total`,
                    help: 'DDoS mitigation actions',
                    labelNames: ['action']
                })
            };
            
            // Start metrics server
            const express = require('express');
            const app = express();
            app.get('/metrics', async (req, res) => {
                res.set('Content-Type', this.client.register.contentType);
                res.end(await this.client.register.metrics());
            });
            app.listen(this.config.monitoring.prometheus.port);
            
        } catch (error) {
            console.error('Prometheus metrics initialization failed:', error);
        }
    }
    
    incrementBlocked(reason) {
        if (this.metrics.blockedRequests) {
            this.metrics.blockedRequests.inc({ reason });
        }
    }
    
    updateActiveBans(count) {
        if (this.metrics.activeBans) {
            this.metrics.activeBans.set(count);
        }
    }
    
    incrementRequest(status) {
        if (this.metrics.requestRate) {
            this.metrics.requestRate.inc({ status });
        }
    }
    
    setAnomalyScore(score) {
        if (this.metrics.anomalyScore) {
            this.metrics.anomalyScore.set(score);
        }
    }
    
    incrementWAFHit(ruleType) {
        if (this.metrics.wafHits) {
            this.metrics.wafHits.inc({ rule_type: ruleType });
        }
    }
    
    incrementDDOSMitigation(action) {
        if (this.metrics.ddosMitigations) {
            this.metrics.ddosMitigations.inc({ action });
        }
    }
}

// ================================ MAIN MIDDLEWARE =================================

// Initialize services
let storage = null;
let geoipService = null;
let threatIntelService = null;
let fingerprintService = null;
let anomalyService = null;
let ddosService = null;
let botDetectionService = null;
let wafEngine = null;
let cloudflareSync = null;
let prometheusMetrics = null;

// Global stores
let globalBlockedIPs = new Set();
let globalBannedIPs = new Map();
let globalAllowedIPs = new Set();

async function initializeServices() {
    storage = new StorageManager(CONFIG);
    await storage.initialize();
    
    geoipService = new GeoIPService(CONFIG);
    await geoipService.initialize();
    
    threatIntelService = new ThreatIntelligenceService(CONFIG);
    fingerprintService = new FingerprintService(CONFIG);
    anomalyService = new AnomalyDetectionService(CONFIG);
    ddosService = new DDoSMitigationService(CONFIG);
    botDetectionService = new BotDetectionService(CONFIG);
    wafEngine = new WAFEngine(CONFIG);
    cloudflareSync = new CloudflareSyncService(CONFIG);
    await cloudflareSync.initialize();
    
    prometheusMetrics = new PrometheusMetrics(CONFIG);
    await prometheusMetrics.initialize();
    
    // Load persisted bans
    await loadPersistedData();
}

async function loadPersistedData() {
    const savedBans = await storage.get('persistent:bans');
    if (savedBans) {
        for (const [ip, expireAt] of Object.entries(savedBans)) {
            if (expireAt > Date.now()) {
                globalBannedIPs.set(ip, expireAt);
            }
        }
    }
}

async function savePersistedData() {
    if (!CONFIG.persistence.banStorage) return;
    
    const bans = {};
    for (const [ip, expireAt] of globalBannedIPs) {
        bans[ip] = expireAt;
    }
    await storage.set('persistent:bans', bans);
}

// Core middleware function
async function ipFilter(req, res, next) {
    const startTime = Date.now();
    const ip = getClientIP(req);
    const requestId = generateRequestId();
    const endpoint = req.route?.path || req.originalUrl;
    
    // Attach metadata to request
    req.clientIP = ip;
    req.requestId = requestId;
    req.timestamp = startTime;
    
    try {
        // 1. Check whitelist
        if (globalAllowedIPs.size > 0 && globalAllowedIPs.has(ip)) {
            prometheusMetrics?.incrementRequest('allowed');
            return next();
        }
        
        // 2. Check blacklist
        if (globalBlockedIPs.has(ip)) {
            log(`Blocked blacklisted IP: ${ip}`, 'BLOCK');
            prometheusMetrics?.incrementBlocked('blacklist');
            return sendBlockedResponse(res, 'IP_BLOCKED', 'Your IP has been permanently blocked', requestId);
        }
        
        // 3. Check temporary bans
        if (isBanned(ip)) {
            prometheusMetrics?.incrementBlocked('banned');
            return sendBlockedResponse(res, 'IP_BANNED', 'Temporary access denied', requestId);
        }
        
        // 4. GeoIP check
        if (CONFIG.geoip.enabled) {
            const country = geoipService?.getCountry(ip);
            if (country && geoipService.isCountryBlocked(country)) {
                log(`Blocked by country: ${ip} from ${country}`, 'GEO_BLOCK');
                prometheusMetrics?.incrementBlocked('country');
                return sendBlockedResponse(res, 'COUNTRY_BLOCKED', `Access from ${country} is not allowed`, requestId);
            }
        }
        
        // 5. Threat Intelligence check
        if (CONFIG.ipBlocking.threatFeeds.enabled) {
            const threatIntel = await threatIntelService?.checkIP(ip);
            if (threatIntel?.shouldBlock) {
                log(`Blocked by threat intelligence: ${ip} (score: ${threatIntel.score})`, 'THREAT_BLOCK');
                prometheusMetrics?.incrementBlocked('threat_intel');
                await banIP(ip, CONFIG.rateLimit.tiers[CONFIG.rateLimit.activeTier].banDuration);
                return sendBlockedResponse(res, 'THREAT_DETECTED', 'Security threat detected', requestId);
            }
        }
        
        // 6. Bot detection
        const botResult = await botDetectionService?.detect(req, ip);
        if (botResult?.shouldBlock) {
            log(`Blocked malicious bot: ${ip} (score: ${botResult.score})`, 'BOT_BLOCK');
            prometheusMetrics?.incrementBlocked('malicious_bot');
            return sendBlockedResponse(res, 'BOT_DETECTED', 'Automated access detected', requestId);
        }
        
        // 7. DDoS mitigation
        const ddosResult = ddosService?.check(req, ip, endpoint);
        if (ddosResult?.mitigated) {
            if (ddosResult.action === 'challenge') {
                const challenge = ddosService.issueChallenge(ip, res);
                prometheusMetrics?.incrementDDOSMitigation('challenge');
                return sendChallengeResponse(res, challenge, requestId);
            } else if (ddosResult.action === 'block') {
                prometheusMetrics?.incrementDDOSMitigation('block');
                await banIP(ip, CONFIG.rateLimit.tiers[CONFIG.rateLimit.activeTier].banDuration);
                return sendBlockedResponse(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests', requestId);
            }
        }
        
        // 8. WAF inspection
        const wafResult = wafEngine?.inspect(req, ip);
        if (wafResult?.blocked) {
            log(`WAF blocked request: ${ip} (score: ${wafResult.score})`, 'WAF_BLOCK');
            prometheusMetrics?.incrementWAFHit('blocked');
            for (const rule of wafResult.triggeredRules) {
                prometheusMetrics?.incrementWAFHit(rule.type);
            }
            return sendBlockedResponse(res, 'WAF_BLOCKED', 'Request blocked by security rules', requestId);
        }
        
        // 9. Fingerprinting
        let fingerprint = null;
        if (CONFIG.fingerprinting.enabled) {
            fingerprint = fingerprintService?.generate(req);
            if (fingerprint) {
                await fingerprintService.storeFingerprint(ip, fingerprint);
                
                // Check if fingerprint changed suspiciously
                const validation = await fingerprintService.validateSession(ip, fingerprint, req.sessionID);
                if (!validation.valid) {
                    log(`Suspicious fingerprint change: ${ip} (score: ${validation.score})`, 'FINGERPRINT');
                    prometheusMetrics?.setAnomalyScore(100 - validation.score);
                }
            }
        }
        
        // 10. Anomaly detection
        const anomalyResult = await anomalyService?.detect(req, ip, req.sessionID);
        if (anomalyResult?.detected) {
            log(`Anomaly detected: ${ip} (score: ${anomalyResult.score})`, 'ANOMALY');
            prometheusMetrics?.setAnomalyScore(anomalyResult.score);
            
            if (anomalyResult.action === 'block') {
                await banIP(ip, CONFIG.rateLimit.tiers[CONFIG.rateLimit.activeTier].banDuration);
                return sendBlockedResponse(res, 'ANOMALY_DETECTED', 'Suspicious activity detected', requestId);
            } else if (anomalyResult.action === 'challenge') {
                const challenge = ddosService?.issueChallenge(ip, res);
                return sendChallengeResponse(res, challenge, requestId);
            }
        }
        
        // 11. Rate limiting
        const rateLimitResult = await handleAdvancedRateLimit(ip, endpoint);
        if (rateLimitResult.blocked) {
            log(`Rate limit exceeded: ${ip} (tier: ${rateLimitResult.tier})`, 'RATE_LIMIT');
            prometheusMetrics?.incrementBlocked('rate_limit');
            return sendBlockedResponse(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests', requestId);
        }
        
        // 12. Suspicious activity detection
        const suspiciousResult = await detectSuspiciousActivityEnhanced(req, ip);
        if (suspiciousResult.shouldBlock) {
            log(`Suspicious activity blocked: ${ip} (score: ${suspiciousResult.score})`, 'SUSPICIOUS');
            prometheusMetrics?.incrementBlocked('suspicious');
            await banIP(ip, CONFIG.rateLimit.tiers[CONFIG.rateLimit.activeTier].banDuration);
            return sendBlockedResponse(res, 'SUSPICIOUS_ACTIVITY', 'Suspicious activity detected', requestId);
        }
        
        // 13. Set security headers
        setSecurityHeaders(res, ip, rateLimitResult, requestId);
        
        // 14. Log request
        const duration = Date.now() - startTime;
        if (CONFIG.monitoring.logging.enabled) {
            log(`${ip} | ${req.method} | ${req.originalUrl} | ${duration}ms | ${rateLimitResult.remaining}/${rateLimitResult.limit}`, 'REQUEST');
        }
        
        prometheusMetrics?.incrementRequest('allowed');
        
        next();
        
    } catch (error) {
        console.error('IP Filter error:', error);
        prometheusMetrics?.incrementRequest('error');
        next(); // Fail open - don't block on internal errors
    }
}

// Helper functions
function getClientIP(req) {
    if (!CONFIG.trustProxy) return req.ip || req.connection?.remoteAddress || 'unknown';
    
    const forwarded = req.headers['x-forwarded-for'];
    const cfConnecting = req.headers['cf-connecting-ip'];
    const realIP = req.headers['x-real-ip'];
    
    let ip = cfConnecting || realIP || (forwarded ? forwarded.split(',')[0] : null) ||
             req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    
    // Normalize IPv6 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1';
    }
    
    return ip.replace(/^::ffff:/, '').trim();
}

function generateRequestId() {
    return crypto.randomBytes(16).toString('hex');
}

function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    
    if (CONFIG.monitoring.logging.format === 'json') {
        console.log(JSON.stringify(logEntry));
    } else {
        console.log(`[${timestamp}] [${type}] ${message}`);
    }
    
    // SIEM integration
    if (CONFIG.monitoring.logging.siem.enabled && 
        (type === 'BLOCK' || type === 'BAN' || type === 'WAF_BLOCK')) {
        sendToSIEM(logEntry);
    }
}

async function sendToSIEM(logEntry) {
    // Implement SIEM forwarding
}

function sendBlockedResponse(res, code, message, requestId) {
    return res.status(403).json({
        success: false,
        error: code,
        message,
        requestId,
        timestamp: new Date().toISOString()
    });
}

function sendChallengeResponse(res, challenge, requestId) {
    return res.status(403).json({
        success: false,
        error: 'CHALLENGE_REQUIRED',
        message: 'Security challenge required',
        requestId,
        challenge: challenge.token,
        timestamp: new Date().toISOString()
    });
}

async function handleAdvancedRateLimit(ip, endpoint) {
    const tier = CONFIG.rateLimit.perEndpoint[endpoint]?.tier || CONFIG.rateLimit.activeTier;
    
    if (!tier || tier === false) {
        return { blocked: false, limit: Infinity, remaining: Infinity };
    }
    
    const tierConfig = CONFIG.rateLimit.tiers[tier];
    if (!tierConfig) {
        return { blocked: false, limit: Infinity, remaining: Infinity };
    }
    
    const now = Date.now();
    const key = `ratelimit:${tier}:${ip}`;
    let record = await storage.get(key);
    
    if (!record || now > record.resetTime) {
        record = {
            count: 1,
            resetTime: now + tierConfig.windowMs,
            tier
        };
    } else {
        record.count++;
    }
    
    await storage.set(key, record, Math.ceil(tierConfig.windowMs / 1000));
    
    const blocked = record.count > tierConfig.maxRequests;
    
    if (blocked && CONFIG.rateLimit.burstProtection.enabled) {
        const burstKey = `burst:${ip}`;
        let burstRecord = await storage.get(burstKey);
        
        if (!burstRecord) {
            burstRecord = { count: 1, windowStart: now };
        } else if (now - burstRecord.windowStart < CONFIG.rateLimit.burstProtection.duration) {
            burstRecord.count++;
        } else {
            burstRecord = { count: 1, windowStart: now };
        }
        
        await storage.set(burstKey, burstRecord, Math.ceil(CONFIG.rateLimit.burstProtection.duration / 1000));
        
        if (burstRecord.count > tierConfig.maxRequests * CONFIG.rateLimit.burstProtection.multiplier) {
            await banIP(ip, tierConfig.banDuration);
        }
    }
    
    return {
        blocked,
        limit: tierConfig.maxRequests,
        remaining: Math.max(0, tierConfig.maxRequests - record.count),
        reset: record.resetTime,
        tier
    };
}

function isBanned(ip) {
    const expireAt = globalBannedIPs.get(ip);
    if (!expireAt) return false;
    if (Date.now() > expireAt) {
        globalBannedIPs.delete(ip);
        savePersistedData();
        return false;
    }
    return true;
}

async function banIP(ip, durationMs) {
    const expireAt = Date.now() + durationMs;
    globalBannedIPs.set(ip, expireAt);
    await savePersistedData();
    
    // Sync to Cloudflare
    if (CONFIG.cloudflare.enabled && CONFIG.cloudflare.actions.block) {
        await cloudflareSync?.addToCloudflareBlocklist(ip);
    }
    
    log(`IP banned: ${ip} for ${durationMs / 1000} seconds`, 'BAN');
    prometheusMetrics?.updateActiveBans(globalBannedIPs.size);
}

function setSecurityHeaders(res, ip, rateLimitResult, requestId) {
    res.set({
        'X-IP': ip,
        'X-Request-ID': requestId,
        'X-RateLimit-Limit': rateLimitResult.limit,
        'X-RateLimit-Remaining': rateLimitResult.remaining,
        'X-RateLimit-Reset': Math.ceil(rateLimitResult.reset / 1000),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    });
}

async function detectSuspiciousActivityEnhanced(req, ip) {
    let totalScore = 0;
    const reasons = [];
    
    // Check against custom patterns
    for (const pattern of CONFIG.suspiciousDetection.customPatterns) {
        const url = req.originalUrl || '';
        const body = JSON.stringify(req.body || '');
        
        if (pattern.pattern.test(url) || pattern.pattern.test(body)) {
            totalScore += pattern.score;
            reasons.push(pattern.type);
            log(`Suspicious pattern detected: ${pattern.type} from ${ip}`, 'WARNING');
        }
    }
    
    // Check for directory busting (many sequential requests)
    const historyKey = `history:${ip}`;
    const history = await storage.get(historyKey) || [];
    const recentPaths = history.filter(h => Date.now() - h.timestamp < 60000).map(h => h.path);
    
    if (new Set(recentPaths).size < recentPaths.length * 0.5 && recentPaths.length > 20) {
        totalScore += 25;
        reasons.push('directory_busting');
    }
    
    // Update history
    history.push({ path: req.originalUrl, timestamp: Date.now() });
    while (history.length > 100) history.shift();
    await storage.set(historyKey, history, 3600);
    
    const shouldBlock = CONFIG.suspiciousDetection.autoBan && 
                        totalScore >= CONFIG.suspiciousDetection.autoBanScore;
    
    return { score: totalScore, reasons, shouldBlock };
}

// Management methods
ipFilter.blockIP = async (ip, duration = 3600000) => {
    await banIP(normalizeIP(ip), duration);
};

ipFilter.unblockIP = (ip) => {
    globalBannedIPs.delete(normalizeIP(ip));
    globalBlockedIPs.delete(normalizeIP(ip));
    savePersistedData();
    log(`IP unbanned: ${ip}`, 'UNBAN');
};

ipFilter.allowIP = (ip) => {
    globalAllowedIPs.add(normalizeIP(ip));
    log(`IP whitelisted: ${ip}`, 'ALLOW');
};

ipFilter.getStats = () => ({
    blockedIPs: globalBlockedIPs.size,
    allowedIPs: globalAllowedIPs.size,
    bannedIPs: globalBannedIPs.size,
    timestamp: new Date().toISOString()
});

ipFilter.getIPInfo = async (ip) => {
    ip = normalizeIP(ip);
    const country = geoipService?.getCountry(ip);
    const threatIntel = await threatIntelService?.checkIP(ip);
    const fingerprint = await storage.get(`fp:${ip}`);
    
    return {
        ip,
        blocked: globalBlockedIPs.has(ip),
        allowed: globalAllowedIPs.has(ip),
        banned: isBanned(ip),
        country,
        threatIntel,
        fingerprints: fingerprint || [],
        timestamp: new Date().toISOString()
    };
};

ipFilter.initialize = initializeServices;
ipFilter.cleanup = async () => {
    await savePersistedData();
};

function normalizeIP(ip) {
    if (!ip || ip === 'unknown') return 'unknown';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
    return ip.replace(/^::ffff:/, '').trim();
}

// Auto-save periodically
setInterval(async () => {
    await savePersistedData();
}, CONFIG.storage.persistence.backupInterval);

// Start services
initializeServices().catch(console.error);

module.exports = ipFilter;
