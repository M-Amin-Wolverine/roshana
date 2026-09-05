// src/pages/admin/AdminTerminal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Terminal from 'react-console-emulator';
import { toast } from 'react-hot-toast';
import { 
  FaTerminal, FaTimes, FaExpand, FaCompress, 
  FaTrash, FaCopy, FaDownload 
} from 'react-icons/fa';

const AdminTerminal = ({ onClose }) => {
  const terminalRef = useRef(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const commands = {
    help: {
      description: 'نمایش لیست دستورات',
      usage: 'help [command]',
      fn: (args) => {
        if (args[0]) {
          const cmd = commands[args[0]];
          if (cmd) {
            return `${args[0]}: ${cmd.description}\nUsage: ${cmd.usage}`;
          }
          return `دستور "${args[0]}" یافت نشد`;
        }
        
        return Object.keys(commands)
          .map(cmd => `${cmd.padEnd(15)} - ${commands[cmd].description}`)
          .join('\n');
      }
    },
    
    clear: {
      description: 'پاک کردن صفحه ترمینال',
      usage: 'clear',
      fn: () => {
        terminalRef.current?.clearStdout();
        return '';
      }
    },
    
    status: {
      description: 'نمایش وضعیت سیستم',
      usage: 'status',
      fn: () => {
        return `
🖥️ SYSTEM STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CPU Usage:     ${Math.floor(Math.random() * 40) + 20}%
Memory Usage:  ${Math.floor(Math.random() * 30) + 40}%
Disk Usage:    ${Math.floor(Math.random() * 50) + 30}%
Uptime:        ${Math.floor(process.uptime() / 3600)}h ${Math.floor(process.uptime() / 60) % 60}m
Connections:   ${Math.floor(Math.random() * 100) + 50}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
      }
    },
    
    users: {
      description: 'نمایش کاربران آنلاین',
      usage: 'users [--detailed]',
      fn: (args) => {
        const users = [
          { name: 'admin', role: 'مدیر سیستم', ip: '192.168.1.1', session: '2h 30m' },
          { name: 'teacher1', role: 'استاد', ip: '192.168.1.45', session: '45m' },
          { name: 'student1', role: 'دانشجو', ip: '192.168.1.123', session: '15m' }
        ];
        
        if (args.includes('--detailed')) {
          return users.map(u => 
            `${u.name.padEnd(12)} | ${u.role.padEnd(15)} | ${u.ip.padEnd(15)} | ${u.session}`
          ).join('\n');
        }
        
        return users.map(u => `${u.name} (${u.role})`).join('\n');
      }
    },
    
    logs: {
      description: 'نمایش لاگ‌های سیستم',
      usage: 'logs [--tail] [--lines=N]',
      fn: (args) => {
        const logs = [
          '[INFO] 2024-01-15 10:30:22 - User admin logged in',
          '[INFO] 2024-01-15 10:35:15 - Course "React Advanced" created',
          '[WARN] 2024-01-15 10:40:01 - High memory usage detected',
          '[ERROR] 2024-01-15 10:42:30 - Failed to connect to external API',
          '[INFO] 2024-01-15 10:45:00 - Backup completed successfully'
        ];
        
        let lines = 10;
        const linesArg = args.find(a => a.startsWith('--lines='));
        if (linesArg) {
          lines = parseInt(linesArg.split('=')[1]) || 10;
        }
        
        if (args.includes('--tail')) {
          return logs.slice(-lines).join('\n');
        }
        
        return logs.join('\n');
      }
    },
    
    backup: {
      description: 'تهیه نسخه پشتیبان',
      usage: 'backup [--type=database|files|all]',
      fn: (args) => {
        let type = 'all';
        const typeArg = args.find(a => a.startsWith('--type='));
        if (typeArg) {
          type = typeArg.split('=')[1];
        }
        
        return `
🚀 Starting backup process...
📦 Type: ${type}
⏳ Please wait...
✅ Backup completed successfully!
📁 Location: /backups/backup_${Date.now()}.tar.gz
💾 Size: ${Math.floor(Math.random() * 500) + 100}MB
⏱️ Duration: ${Math.floor(Math.random() * 30) + 5}s
        `;
      }
    },
    
    restart: {
      description: 'راه‌اندازی مجدد سرویس',
      usage: 'restart [service]',
      fn: (args) => {
        const service = args[0] || 'all';
        return `
⚠️ Restarting ${service} service...
3... 2... 1...
✅ Service ${service} restarted successfully!
        `;
      }
    },
    
    config: {
      description: 'نمایش یا تغییر تنظیمات',
      usage: 'config [get|set] [key] [value]',
      fn: (args) => {
        const configs = {
          'app.name': 'Fartak LMS',
          'app.version': '4.0.0',
          'app.debug': 'false',
          'cache.enabled': 'true',
          'cache.ttl': '3600'
        };
        
        if (args[0] === 'get') {
          if (args[1]) {
            return `${args[1]} = ${configs[args[1]] || 'undefined'}`;
          }
          return Object.entries(configs).map(([k, v]) => `${k.padEnd(20)} = ${v}`).join('\n');
        }
        
        if (args[0] === 'set' && args[1] && args[2]) {
          configs[args[1]] = args[2];
          return `✅ Configuration updated: ${args[1]} = ${args[2]}`;
        }
        
        return 'Usage: config [get|set] [key] [value]';
      }
    },
    
    echo: {
      description: 'چاپ متن',
      usage: 'echo [text]',
      fn: (args) => args.join(' ')
    },
    
    date: {
      description: 'نمایش تاریخ و زمان',
      usage: 'date',
      fn: () => new Date().toLocaleString('fa-IR')
    },
    
    whoami: {
      description: 'نمایش کاربر فعلی',
      usage: 'whoami',
      fn: () => 'admin (مدیر سیستم)'
    },
    
    pwd: {
      description: 'نمایش مسیر فعلی',
      usage: 'pwd',
      fn: () => '/admin/terminal'
    },
    
    ls: {
      description: 'نمایش لیست فایل‌ها',
      usage: 'ls [path]',
      fn: () => {
        const files = [
          { name: 'backups/', type: 'dir', size: '-', modified: '2024-01-15' },
          { name: 'logs/', type: 'dir', size: '-', modified: '2024-01-15' },
          { name: 'config.json', type: 'file', size: '2.4KB', modified: '2024-01-14' },
          { name: 'database.sql', type: 'file', size: '15.8MB', modified: '2024-01-15' }
        ];
        
        return files.map(f => 
          `${f.type === 'dir' ? '📁' : '📄'} ${f.name.padEnd(20)} ${f.size.padEnd(10)} ${f.modified}`
        ).join('\n');
      }
    },
    
    ping: {
      description: 'بررسی اتصال',
      usage: 'ping [host]',
      fn: (args) => {
        const host = args[0] || 'google.com';
        return `
PING ${host} (172.217.16.142): 56 data bytes
64 bytes from 172.217.16.142: icmp_seq=0 ttl=54 time=${Math.floor(Math.random() * 50) + 30}ms
64 bytes from 172.217.16.142: icmp_seq=1 ttl=54 time=${Math.floor(Math.random() * 50) + 30}ms
64 bytes from 172.217.16.142: icmp_seq=2 ttl=54 time=${Math.floor(Math.random() * 50) + 30}ms

--- ${host} ping statistics ---
3 packets transmitted, 3 packets received, 0% packet loss
round-trip min/avg/max = 32/38/45 ms
        `;
      }
    },
    
    calc: {
      description: 'ماشین حساب',
      usage: 'calc [expression]',
      fn: (args) => {
        try {
          const result = eval(args.join(' '));
          return `= ${result}`;
        } catch (e) {
          return 'Invalid expression';
        }
      }
    },
    
    exit: {
      description: 'بستن ترمینال',
      usage: 'exit',
      fn: () => {
        setTimeout(onClose, 500);
        return 'Closing terminal...';
      }
    },

    // ===== قابلیت‌های خفن جدید - بخش اول =====
    
    color: {
      description: 'تست رنگ‌های ترمینال',
      usage: 'color',
      fn: () => {
        const colors = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤'];
        const styles = {
          bold: '𝗕𝗼𝗹𝗱',
          italic: '𝘐𝘵𝘢𝘭𝘪𝘤',
          underline: 'U̲n̲d̲e̲r̲l̲i̲n̲e̲',
          strike: 'S̶t̶r̶i̶k̶e̶'
        };
        return `
🎨 TERMINAL COLOR TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colors.join(' ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${Object.entries(styles).map(([k,v]) => `${k.padEnd(10)}: ${v}`).join('\n')}
        `;
      }
    },
    
    matrix: {
      description: 'افکت ماتریکس',
      usage: 'matrix [--duration=5]',
      fn: (args) => {
        const chars = '01アイウエオカキクケコサシスセソタチツテト';
        let output = '';
        for(let i = 0; i < 20; i++) {
          output += Array(50).fill(0).map(() => 
            chars[Math.floor(Math.random() * chars.length)]
          ).join('') + '\n';
        }
        return `🔷 MATRIX MODE ACTIVATED 🔷\n${output}`;
      }
    },
    
    ascii: {
      description: 'تولید متن ASCII',
      usage: 'ascii [text]',
      fn: (args) => {
        const text = args.join(' ') || 'FARTAK';
        const fonts = {
          'A': ' █████╗ \n██╔══██╗\n███████║\n██╔══██║\n██║  ██║\n╚═╝  ╚═╝',
          'B': '██████╗ \n██╔══██╗\n██████╔╝\n██╔══██╗\n██████╔╝\n╚═════╝ ',
          'F': '███████╗\n██╔════╝\n█████╗  \n██╔══╝  \n██║     \n╚═╝     ',
          'R': '██████╗ \n██╔══██╗\n██████╔╝\n██╔══██╗\n██║  ██║\n╚═╝  ╚═╝',
          'T': '████████╗\n╚══██╔══╝\n   ██║   \n   ██║   \n   ██║   \n   ╚═╝   ',
          'K': '██╗  ██╗\n██║ ██╔╝\n█████╔╝ \n██╔═██╗ \n██║  ██╗\n╚═╝  ╚═╝'
        };
        return text.split('').map(char => fonts[char] || `[${char}]`).join('\n');
      }
    },
    
    top: {
      description: 'مانیتورینگ لحظه‌ای سیستم',
      usage: 'top [--refresh]',
      fn: (args) => {
        const processes = [
          { pid: 1001, cpu: '2.3%', mem: '1.2%', name: 'node' },
          { pid: 1002, cpu: '0.5%', mem: '0.8%', name: 'mongod' },
          { pid: 1003, cpu: '1.8%', mem: '3.2%', name: 'react' },
          { pid: 1004, cpu: '0.2%', mem: '0.3%', name: 'nginx' },
        ];
        
        return `
🖥️ SYSTEM MONITOR (Refresh every 2s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PID     CPU%    MEM%    PROCESS
${processes.map(p => `${p.pid}\t${p.cpu}\t${p.mem}\t${p.name}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Press Ctrl+C to exit monitor mode
        `;
      }
    },
    
    nmap: {
      description: 'اسکن شبکه محلی',
      usage: 'nmap [--quick]',
      fn: (args) => {
        const devices = [
          { ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:FF', vendor: 'Router', open: [80,443] },
          { ip: '192.168.1.45', mac: '11:22:33:44:55:66', vendor: 'Dell', open: [22,3000] },
          { ip: '192.168.1.123', mac: 'AA:11:BB:22:CC:33', vendor: 'HP', open: [8080] },
        ];
        
        return `
🔍 NETWORK SCAN RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${devices.map(d => 
          `${d.ip.padEnd(15)} ${d.mac.padEnd(20)} ${d.vendor.padEnd(10)} [${d.open.join(',')}]`
        ).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total devices found: ${devices.length}
        `;
      }
    },
    
    weather: {
      description: 'اطلاعات آب و هوا',
      usage: 'weather [city]',
      fn: (args) => {
        const city = args[0] || 'Tehran';
        const conditions = ['☀️', '⛅', '☁️', '🌧️', '⛈️', '🌨️', '🌫️'];
        return `
🌍 WEATHER REPORT - ${city.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${conditions[Math.floor(Math.random() * conditions.length)]} Condition: ${['Sunny', 'Cloudy', 'Rainy', 'Stormy'][Math.floor(Math.random()*4)]}
🌡️ Temperature: ${Math.floor(Math.random()*35)+5}°C
💧 Humidity: ${Math.floor(Math.random()*60)+30}%
🌪️ Wind: ${Math.floor(Math.random()*30)+5} km/h
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
      }
    },
    
    genpass: {
      description: 'تولید رمز عبور امن',
      usage: 'genpass [--length=16] [--special]',
      fn: (args) => {
        const length = parseInt(args.find(a => a.startsWith('--length='))?.split('=')[1]) || 16;
        const useSpecial = args.includes('--special');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' + 
                      (useSpecial ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '');
        
        let password = '';
        for(let i = 0; i < length; i++) {
          password += chars[Math.floor(Math.random() * chars.length)];
        }
        
        const strength = length >= 16 ? '🟢 VERY STRONG' : length >= 12 ? '🟡 STRONG' : '🔴 WEAK';
        
        return `
🔐 PASSWORD GENERATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Password: ${password}
Length: ${length} characters
Strength: ${strength}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Store this password safely!
        `;
      }
    },
    
    qrcode: {
      description: 'تولید QR Code متنی',
      usage: 'qrcode [text]',
      fn: (args) => {
        const text = args.join(' ') || 'https://fartak.ir';
        return `
📱 QR CODE (Text: ${text.substring(0,20)}${text.length>20?'...':''})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
█████████████████████████████████████████
████ ▄▄▄▄▄ ██▀▄▀▄▄▀▀ ██▀▀▄ ██ ▄▄▄▄▄ ████
████ █   █ █▀▄ ▀▄█▄▄▄▀▀█▄▄▀ █ █   █ ████
████ █▄▄▄█ ██▀█▄ ▄▀▀▄ █ █▀▀█ █ █▄▄▄█ ████
████▄▄▄▄▄▄▄█▄█▄█ █▄█ █▄█▄█▄█▄█▄▄▄▄▄▄▄████
████ ▄▄▄▄▄ █ ▀ ▀▄██▀▀█ █▄▄▀▄▄█ ▄▄▄▄▄ ████
████ █   █ █▄▀▄▀ █▄██▄▀ ▀ ██ █ █   █ ████
████ █▄▄▄█ █▀▄ ▀██▀▄▄▀▀ ▄ ████ █▄▄▄█ ████
████▄▄▄▄▄▄▄█▄█▄▄█▄▄▄▄▄▄█▄▄█▄▄█▄▄▄▄▄▄▄████
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scan with your phone camera
        `;
      }
    },
    
    fact: {
      description: 'نمایش حقایق جالب',
      usage: 'fact [--tech|--science|--history]',
      fn: (args) => {
        const facts = {
          tech: [
            'اولین باگ کامپیوتر یک پروانه واقعی بود که در Harvard Mark II گیر کرده بود! 🦋',
            'روزانه بیش از 300 میلیارد ایمیل ارسال می‌شود 📧',
            'اولین وبسایت جهان هنوز آنلاین است: info.cern.ch 🌐'
          ],
          science: [
            'قلب انسان در طول عمر متوسط 2.5 میلیارد بار می‌تپد ❤️',
            'نور خورشید 8 دقیقه و 20 ثانیه طول می‌کشد تا به زمین برسد ☀️',
            'DNA انسان 50% با DNA موز مشترک است! 🍌'
          ],
          history: [
            'کلیوپاترا از نظر زمانی به iPhone نزدیک‌تر بود تا به ساخت اهرام مصر! 📱',
            'دانشگاه آکسفورد از امپراتوری آزتک قدیمی‌تر است 🏛️',
            'در قرون وسطی، حیوانات هم محاکمه می‌شدند! ⚖️'
          ]
        };
        
        const category = args.find(a => a.startsWith('--'))?.replace('--', '') || 'tech';
        const categoryFacts = facts[category] || facts.tech;
        const fact = categoryFacts[Math.floor(Math.random() * categoryFacts.length)];
        
        return `
💡 RANDOM FACT (${category.toUpperCase()})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fact}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
      }
    },
    
    cowsay: {
      description: 'گاو سخنگو 🐮',
      usage: 'cowsay [text]',
      fn: (args) => {
        const text = args.join(' ') || 'Moo!';
        const bubble = text.length > 30 ? text.match(/.{1,30}/g).join('\n') : text;
        const bubbleLines = bubble.split('\n');
        const maxLen = Math.max(...bubbleLines.map(l => l.length));
        
        const top = ' ' + '_'.repeat(maxLen + 2);
        const bottom = ' ' + '-'.repeat(maxLen + 2);
        const middle = bubbleLines.map(l => `| ${l.padEnd(maxLen)} |`).join('\n');
        
        return `
${top}
${middle}
${bottom}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
        `;
      }
    },
    
    konami: {
      description: '🎮 Easter Egg',
      usage: 'konami',
      fn: () => `
⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️🅱️🅰️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 KONAMI CODE ACTIVATED! 
🏆 Achievement Unlocked: Terminal Master
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `
    },
    
    rickroll: {
      description: '🎵 ...',
      usage: 'rickroll',
      fn: () => `
🎵 Never gonna give you up 🎵
🎵 Never gonna let you down 🎵
🎵 Never gonna run around and desert you 🎵
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
😎 You've been rickrolled!
      `
    },
    
    progress: {
      description: 'نمایش نوار پیشرفت',
      usage: 'progress [--demo]',
      fn: () => {
        const bar = '█'.repeat(20) + '▒'.repeat(10);
        return `
📊 PROGRESS DEMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[${bar}] 66% Complete
[████████████████████] 100% Complete
[████████░░░░░░░░░░░░] 40% Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
      }
    },
    
    tree: {
      description: 'نمایش درختی فایل‌ها',
      usage: 'tree',
      fn: () => {
        return `
📁 fartak-lms/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📄 AdminTerminal.jsx
│   │   ├── 📄 Dashboard.jsx
│   │   └── 📄 Sidebar.jsx
│   ├── 📁 pages/
│   │   ├── 📁 admin/
│   │   ├── 📁 teacher/
│   │   └── 📁 student/
│   └── 📄 App.jsx
├── 📁 public/
├── 📁 backups/
├── 📄 package.json
└── 📄 README.md

7 directories, 5 files
        `;
      }
    },

    // ===== قابلیت‌های ماورایی - بخش دوم =====
    
    snake: {
      description: '🐍 بازی اسنیک در ترمینال',
      usage: 'snake',
      fn: () => {
        const board = Array(10).fill().map(() => Array(20).fill('·'));
        const snake = [[5,10], [5,9], [5,8]];
        const food = [7,15];
        
        snake.forEach(([y,x]) => { if(board[y]) board[y][x] = '█'; });
        if(board[food[0]]) board[food[0]][food[1]] = '●';
        
        return `
🎮 SNAKE GAME (DEMO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────┐
${board.map(row => `│${row.join('')}│`).join('\n')}
└────────────────────┘
Score: 3 | High Score: 42
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Full game available in extended mode
        `;
      }
    },
    
    tetris: {
      description: '🧩 تتریس در ترمینال',
      usage: 'tetris',
      fn: () => {
        const board = Array(15).fill().map(() => Array(10).fill('·'));
        for(let i = 0; i < 3; i++) {
          for(let j = 3; j < 7; j++) {
            if(board[12+i]) board[12+i][j] = '█';
          }
        }
        
        return `
🧩 TETRIS (DEMO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌──────────┐
${board.map(row => `│${row.join('')}│`).join('\n')}
└──────────┘
Level: 1 | Lines: 4 | Score: 1200
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next piece:
 ██
██
        `;
      }
    },
    
    tictactoe: {
      description: '🎲 بازی دوز',
      usage: 'tictactoe [move=x,y]',
      fn: (args) => {
        const board = [
          ['X', 'O', '·'],
          ['·', 'X', '·'],
          ['O', '·', '·']
        ];
        
        return `
🎲 TIC TAC TOE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   0   1   2
0  ${board[0].join(' │ ')}
  ───┼───┼───
1  ${board[1].join(' │ ')}
  ───┼───┼───
2  ${board[2].join(' │ ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Player X turn | Type: tictactoe move=1,2
        `;
      }
    },
    
    stats: {
      description: '📊 آمار کد پروژه',
      usage: 'stats [--detailed]',
      fn: (args) => {
        const stats = {
          totalFiles: 247,
          totalLines: 15680,
          codeLines: 12450,
          commentLines: 2340,
          blankLines: 890,
          languages: {
            'JavaScript': 45,
            'JSX': 38,
            'CSS': 22,
            'JSON': 8
          },
          complexity: 'Medium',
          maintainability: 'B+'
        };
        
        return args.includes('--detailed') ? `
📊 PROJECT STATISTICS (DETAILED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Total Files:        ${stats.totalFiles}
📝 Total Lines:        ${stats.totalLines}
💻 Code Lines:         ${stats.codeLines} (${Math.round(stats.codeLines/stats.totalLines*100)}%)
💬 Comment Lines:      ${stats.commentLines} (${Math.round(stats.commentLines/stats.totalLines*100)}%)
⬜ Blank Lines:        ${stats.blankLines}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 LANGUAGE BREAKDOWN:
${Object.entries(stats.languages).map(([k,v]) => 
          `${k.padEnd(15)} ${'█'.repeat(v/2)} ${v}%`
        ).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Complexity:         ${stats.complexity}
📈 Maintainability:    ${stats.maintainability}
🏆 Code Quality Score: ${Math.floor(Math.random()*30)+70}/100
        ` : `
📊 QUICK STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Files: ${stats.totalFiles} | 📝 Lines: ${stats.totalLines}
💻 Code: ${stats.codeLines} | 💬 Comments: ${stats.commentLines}
Quality: ${'⭐'.repeat(4)} | Use --detailed for more
        `;
      }
    },
    
    sql: {
      description: '🗄️ اجرای کوئری SQL',
      usage: 'sql [query]',
      fn: (args) => {
        const query = args.join(' ').toLowerCase();
        
        if (query.includes('select')) {
          const mockData = [
            { id: 1, name: 'Admin', role: 'admin', created: '2024-01-01' },
            { id: 2, name: 'Teacher1', role: 'teacher', created: '2024-01-15' },
            { id: 3, name: 'Student1', role: 'student', created: '2024-02-01' }
          ];
          
          return `
🗄️ SQL RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID  NAME        ROLE        CREATED
${mockData.map(d => 
            `${d.id}   ${d.name.padEnd(11)} ${d.role.padEnd(11)} ${d.created}`
          ).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3 rows returned | Query time: ${Math.floor(Math.random()*50)+10}ms
          `;
        }
        
        if (query.includes('insert') || query.includes('update') || query.includes('delete')) {
          return `
✅ Query executed successfully!
Affected rows: ${Math.floor(Math.random()*10)+1}
Time: ${Math.floor(Math.random()*100)+20}ms
          `;
        }
        
        return `
❌ Invalid SQL query
Example: SELECT * FROM users
        `;
      }
    },
    
    json: {
      description: '📋 فرمت و اعتبارسنجی JSON',
      usage: 'json [--validate|--format] [data]',
      fn: (args) => {
        const testJSON = {
          name: "Fartak LMS",
          version: "4.0.0",
          features: ["terminal", "dashboard", "courses"],
          settings: { theme: "dark", language: "fa" }
        };
        
        if (args.includes('--validate')) {
          return `
✅ JSON VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ✓ VALID JSON
Structure: Object (4 keys)
Nesting: Max depth 2
Size: ${JSON.stringify(testJSON).length} bytes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `;
        }
        
        if (args.includes('--format')) {
          return `
📋 FORMATTED JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(testJSON, null, 2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `;
        }
        
        return `
📋 JSON UTILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Raw: ${JSON.stringify(testJSON)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use --validate or --format for more options
        `;
      }
    },
    
    curl: {
      description: '🌐 تست درخواست HTTP',
      usage: 'curl [url] [--method=GET|POST]',
      fn: (args) => {
        const url = args.find(a => a.startsWith('http')) || 'https://api.fartak.ir/v1/status';
        const method = args.find(a => a.startsWith('--method='))?.split('=')[1] || 'GET';
        
        const responses = {
          GET: { status: 200, data: { version: '4.0.0', status: 'online', uptime: '15d 4h' } },
          POST: { status: 201, message: 'Resource created', id: Math.floor(Math.random()*1000) }
        };
        
        const response = responses[method] || responses.GET;
        
        return `
🌐 HTTP REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Method:  ${method}
URL:     ${url}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE:
Status:  ${response.status} ${response.status === 200 ? 'OK' : 'Created'}
Time:    ${Math.floor(Math.random()*200)+50}ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(response, null, 2)}
        `;
      }
    },
    
    base64: {
      description: '🔐 رمزنگاری/رمزگشایی Base64',
      usage: 'base64 [--encode|--decode] [text]',
      fn: (args) => {
        const text = args.filter(a => !a.startsWith('--')).join(' ');
        
        if (args.includes('--encode')) {
          const encoded = btoa(text || 'Fartak Terminal');
          return `
🔐 BASE64 ENCODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Input:  ${text || 'Fartak Terminal'}
Output: ${encoded}
Length: ${encoded.length} chars
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `;
        }
        
        if (args.includes('--decode')) {
          try {
            const decoded = atob(text);
            return `
🔓 BASE64 DECODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Input:  ${text}
Output: ${decoded}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `;
          } catch {
            return '❌ Invalid Base64 string';
          }
        }
        
        return 'Usage: base64 --encode "text" or base64 --decode "base64string"';
      }
    },
    
    urlparse: {
      description: '🔗 تحلیل آدرس URL',
      usage: 'urlparse [url]',
      fn: (args) => {
        const url = args[0] || 'https://admin:fartak@lms.fartak.ir:8080/courses?page=1&sort=name#section';
        
        try {
          const parsed = new URL(url);
          return `
🔗 URL PARSER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Protocol:   ${parsed.protocol}
Hostname:   ${parsed.hostname}
Port:       ${parsed.port || 'default'}
Pathname:   ${parsed.pathname}
Search:     ${parsed.search}
Hash:       ${parsed.hash}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARAMETERS:
${Array.from(parsed.searchParams.entries()).map(([k,v]) => 
            `  ${k.padEnd(15)} = ${v}`
          ).join('\n') || '  No parameters'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `;
        } catch {
          return '❌ Invalid URL format';
        }
      }
    },
    
    theme: {
      description: '🎨 تغییر تم ترمینال',
      usage: 'theme [dark|light|matrix|ocean|sunset]',
      fn: (args) => {
        const themes = {
          dark: { bg: '#1e1e2e', text: '#cdd6f4', prompt: '#89b4fa' },
          light: { bg: '#ffffff', text: '#000000', prompt: '#0066cc' },
          matrix: { bg: '#0d0f0d', text: '#00ff41', prompt: '#00ff41' },
          ocean: { bg: '#0a192f', text: '#64ffda', prompt: '#64ffda' },
          sunset: { bg: '#2d1b69', text: '#ffd700', prompt: '#ff6b6b' }
        };
        
        const theme = themes[args[0]] || themes.dark;
        
        return `
🎨 THEME CHANGED TO ${args[0]?.toUpperCase() || 'DARK'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background: ${theme.bg}
Text:       ${theme.text}
Prompt:     ${theme.prompt}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Theme change requires terminal restart
Available themes: ${Object.keys(themes).join(', ')}
        `;
      }
    },
    
    alias: {
      description: '📝 مدیریت نام‌های مستعار',
      usage: 'alias [set|list|remove] [name] [command]',
      fn: (args) => {
        const aliases = {
          ll: 'ls -la',
          cls: 'clear',
          st: 'status',
          backup: 'backup --type=all'
        };
        
        if (args[0] === 'list') {
          return `
📝 DEFINED ALIASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${Object.entries(aliases).map(([k,v]) => 
            `${k.padEnd(15)} → ${v}`
          ).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `;
        }
        
        if (args[0] === 'set' && args[1] && args[2]) {
          aliases[args[1]] = args.slice(2).join(' ');
          return `✅ Alias created: ${args[1]} → ${aliases[args[1]]}`;
        }
        
        return 'Usage: alias [list|set|remove] [name] [command]';
      }
    },
    
    ps: {
      description: '📊 نمایش پردازش‌های فعال',
      usage: 'ps [--all|--detailed]',
      fn: (args) => {
        const processes = [
          { pid: 1001, ppid: 1, cpu: '2.3%', mem: '1.2%', time: '0:45.23', cmd: 'node server.js' },
          { pid: 1002, ppid: 1001, cpu: '0.5%', mem: '0.8%', time: '0:12.45', cmd: 'mongod --auth' },
          { pid: 1003, ppid: 1001, cpu: '1.8%', mem: '3.2%', time: '0:34.12', cmd: 'react-scripts start' },
          { pid: 1004, ppid: 1001, cpu: '0.2%', mem: '0.3%', time: '0:05.67', cmd: 'nginx worker' },
          { pid: 1005, ppid: 1, cpu: '0.0%', mem: '0.1%', time: '0:00.03', cmd: 'bash' }
        ];
        
        return args.includes('--detailed') ? `
📊 PROCESS LIST (DETAILED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PID     PPID    CPU%    MEM%    TIME        COMMAND
${processes.map(p => 
          `${String(p.pid).padEnd(7)} ${String(p.ppid).padEnd(7)} ${p.cpu.padEnd(7)} ${p.mem.padEnd(7)} ${p.time.padEnd(11)} ${p.cmd}`
        ).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${processes.length} processes
        ` : `
📊 ACTIVE PROCESSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PID     CPU%    COMMAND
${processes.map(p => 
          `${String(p.pid).padEnd(7)} ${p.cpu.padEnd(7)} ${p.cmd}`
        ).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
      }
    },
    
    kill: {
      description: '⛔ پایان دادن به پردازش',
      usage: 'kill [PID] [--force]',
      fn: (args) => {
        const pid = parseInt(args[0]);
        if (!pid) return 'Usage: kill [PID]';
        
        const force = args.includes('--force');
        
        return `
⛔ PROCESS TERMINATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PID: ${pid}
Signal: ${force ? 'SIGKILL (-9)' : 'SIGTERM (-15)'}
Status: ${Math.random() > 0.1 ? '✅ Process terminated' : '❌ Permission denied'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
      }
    },
    
    history_cmd: {
      description: '📜 نمایش تاریخچه دستورات',
      usage: 'history [--clear|--size=N]',
      fn: (args) => {
        const cmdHistory = [
          '1  help',
          '2  status',
          '3  ls -la',
          '4  users --detailed',
          '5  backup --type=database',
          '6  clear',
          '7  ping google.com',
          '8  whoami'
        ];
        
        if (args.includes('--clear')) {
          return '✅ History cleared';
        }
        
        const size = parseInt(args.find(a => a.startsWith('--size='))?.split('=')[1]) || 20;
        
        return `
📜 COMMAND HISTORY (Last ${Math.min(size, cmdHistory.length)})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cmdHistory.slice(-size).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
      }
    },
    
    env: {
      description: '🌍 متغیرهای محیطی',
      usage: 'env [--set KEY=VALUE] [--get KEY]',
      fn: (args) => {
        const envVars = {
          'NODE_ENV': 'production',
          'APP_NAME': 'Fartak LMS',
          'APP_VERSION': '4.0.0',
          'API_URL': 'https://api.fartak.ir',
          'DB_HOST': 'localhost',
          'DB_PORT': '27017',
          'REDIS_URL': 'redis://localhost:6379'
        };
        
        if (args.includes('--get')) {
          const key = args[args.indexOf('--get') + 1];
          return key ? `${key}=${envVars[key] || 'undefined'}` : 'Usage: env --get KEY';
        }
        
        return `
🌍 ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${Object.entries(envVars).map(([k,v]) => 
          `${k.padEnd(15)} = ${v}`
        ).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
      }
    },
    
    chart: {
      description: '📈 نمودار ASCII',
      usage: 'chart [--bar|--line] [data]',
      fn: (args) => {
        const data = [45, 78, 32, 89, 56, 91, 23];
        const max = Math.max(...data);
        
        if (args.includes('--bar')) {
          return `
📊 BAR CHART
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.map((v, i) => {
            const bars = '█'.repeat(Math.floor(v / 5));
            return `${i+1} │ ${bars} ${v}`;
          }).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `;
        }
        
        if (args.includes('--line')) {
          return `
📈 LINE CHART
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.map((v, i) => {
            const pos = Math.floor(v / 5);
            const line = '·'.repeat(pos) + '●' + '·'.repeat(20 - pos);
            return `${i+1} │ ${line} ${v}`;
          }).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `;
        }
        
        return 'Usage: chart [--bar|--line]';
      }
    },
    
    fortune: {
      description: '🥠 طالع‌بینی',
      usage: 'fortune',
      fn: () => {
        const fortunes = [
          '🌟 امروز یه باگ خفن پیدا می‌کنی که خودت باعثش بودی!',
          '🎯 کدی که امروز می‌زنی، فردا دیباگ می‌کنی!',
          '💡 یه راه حل ساده برای مشکل پیچیده پیدا می‌کنی',
          '🚀 امروز سرور کرش نمی‌کنه (احتمالاً)',
          '📚 مستندات رو بخون، به دردت می‌خوره!',
          '☕ قهوه امروزت جواب میده',
          '🐛 باگ امروز، فیچر فردا'
        ];
        
        return `
🥠 FORTUNE COOKIE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fortunes[Math.floor(Math.random() * fortunes.length)]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
      }
    },
    
    ip: {
      description: '🌐 ابزارهای IP',
      usage: 'ip [--info|--geo IP|--subnet]',
      fn: (args) => {
        if (args.includes('--info')) {
          return `
🌐 NETWORK INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Internal IP:  192.168.1.100
External IP:  ${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}
Gateway:      192.168.1.1
DNS:          8.8.8.8, 8.8.4.4
MAC Address:  ${Array(6).fill(0).map(() => 
            Math.floor(Math.random()*256).toString(16).padStart(2,'0')
          ).join(':').toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `;
        }
        
        if (args.includes('--geo')) {
          const ip = args[args.indexOf('--geo') + 1] || '8.8.8.8';
          return `
🗺️ IP GEOLOCATION: ${ip}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Country:    United States
City:       Mountain View
Region:     California
ISP:        Google LLC
Timezone:   America/Los_Angeles
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `;
        }
        
        return 'Usage: ip [--info|--geo IP|--subnet]';
      }
    },
    
    banner: {
      description: '🎯 تولید بنر متنی',
      usage: 'banner [text] [--font=block|lean|mini]',
      fn: (args) => {
        const text = args.filter(a => !a.startsWith('--')).join(' ') || 'FARTAK';
        const font = args.find(a => a.startsWith('--font='))?.split('=')[1] || 'block';
        
        const fonts = {
          block: (t) => t.split('').map(c => 
            `█████\n█   █\n█   █\n█████\n█   █\n█   █`).join('\n\n'),
          lean: (t) => t.split('').map(c => 
            `  ___\n / _ \\\n| | | |\n| |_| |\n \\___/`).join('\n\n'),
          mini: (t) => t.split('').map(c => 
            ` _ \n| |\n| |\n|_|`).join('\n\n')
        };
        
        return `
🎯 BANNER (${font} font)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fonts[font]?.(text) || fonts.block(text)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
      }
    }
  };
  
  const welcomeMessage = `
╔══════════════════════════════════════════════════════════╗
║                    🎓 فرتاک ترمینال                      ║
║                    نسخه ۴.۰.۰                            ║
╠══════════════════════════════════════════════════════════╣
║  برای مشاهده لیست دستورات، "help" را تایپ کنید          ║
║  برای پاک کردن صفحه، "clear" را تایپ کنید               ║
║  🎮 Easter Eggs: konami, rickroll, cowsay               ║
║  🎲 Games: snake, tetris, tictactoe                     ║
╚══════════════════════════════════════════════════════════╝

${new Date().toLocaleString('fa-IR')}
admin@fartak:~$ 
`;
  
  const handleCopy = () => {
    const content = terminalRef.current?.getStdout();
    if (content) {
      navigator.clipboard.writeText(content.join('\n'));
      toast.success('📋 محتوای ترمینال کپی شد');
    }
  };
  
  const handleDownload = () => {
    const content = terminalRef.current?.getStdout();
    if (content) {
      const blob = new Blob([content.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terminal_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  
  return (
    <motion.div 
      className={`admin-terminal ${isMaximized ? 'maximized' : ''}`}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30 }}
    >
      <div className="terminal-header">
        <div className="terminal-title">
          <FaTerminal />
          <span>ترمینال فرتاک</span>
        </div>
        <div className="terminal-actions">
          <button onClick={handleCopy} title="کپی محتوا">
            <FaCopy />
          </button>
          <button onClick={handleDownload} title="دانلود لاگ">
            <FaDownload />
          </button>
          <button onClick={() => terminalRef.current?.clearStdout()} title="پاک کردن">
            <FaTrash />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? 'کوچک کردن' : 'بزرگ کردن'}>
            {isMaximized ? <FaCompress /> : <FaExpand />}
          </button>
          <button onClick={onClose} title="بستن">
            <FaTimes />
          </button>
        </div>
      </div>
      
      <div className="terminal-body">
        <Terminal
          ref={terminalRef}
          commands={commands}
          welcomeMessage={welcomeMessage}
          promptLabel="admin@fartak:~$ "
          errorText="دستور یافت نشد. برای راهنما 'help' را تایپ کنید."
          autoFocus
          style={{
            backgroundColor: '#1e1e2e',
            color: '#cdd6f4',
            fontFamily: 'Monaco, "Cascadia Code", monospace',
            fontSize: '14px',
            height: '100%'
          }}
          contentStyle={{
            padding: '15px'
          }}
          inputStyle={{
            backgroundColor: 'transparent',
            color: '#cdd6f4',
            border: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            width: 'calc(100% - 120px)'
          }}
          promptLabelStyle={{
            color: '#89b4fa'
          }}
        />
      </div>
    </motion.div>
  );
};

export default AdminTerminal;