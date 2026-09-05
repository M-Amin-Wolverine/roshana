// vite-plugin-ip.js
import os from 'os';

export default function vitePluginIp() {
  return {
    name: 'vite-plugin-ip',
    config(config, env) {
      // گرفتن همه IPها
      const interfaces = os.networkInterfaces();
      const ips = [];
      
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            ips.push(iface.address);
          }
        }
      }
      
      // اونی که با 192.168 شروع میشه و شبیه IP موبایله
      let networkIP = ips.find(ip => ip.startsWith('192.168.169')) || 
                      ips.find(ip => ip.startsWith('192.168.')) || 
                      ips[0];
      
      process.env.VITE_HOST_IP = networkIP;
      
      console.log('\n📡 Found all IPs:', ips.join(', '));
      console.log('🎯 Selected IP for proxy:', networkIP);
      console.log('✅ Proxy will use:', `http://${networkIP}:5000\n`);
      
      return config;
    }
  };
}