/* =========================================================
   SINCRONIZZAZIONE — Proiezione ⇄ Tablet (via internet)
   - MQTT su WebSocket sicuro (wss): proiezione e tablet si
     collegano entrambi a un "ripetitore" pubblico su internet,
     quindi funziona da QUALSIASI rete (Wi-Fi diverse, 4G/5G,
     reti di scuole/uffici). Due ripetitori in parallelo per
     sicurezza: se uno cade, lavora l'altro.
   - battito (ping/pong ogni 2 s): la proiezione sa se il tablet
     è collegato; il tablet si ricollega da solo.
   - BroadcastChannel: schede dello stesso PC (per provare).
   ========================================================= */
(function () {
  const PING_MS = 2000;
  const BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt'
  ];

  function create({ role, session, onMessage, onStatus }) {
    const seen = new Set();
    const base = 'qmark-installazione/' + session;
    const inTopic = base + (role === 'display' ? '/to-display' : '/to-controller');
    const outTopic = base + (role === 'display' ? '/to-controller' : '/to-display');
    const clients = [];
    const status = () => {
      const n = clients.filter(c => c.connected).length;
      onStatus && onStatus(n);
    };

    function receive(msg) {
      if (!msg || !msg.id || seen.has(msg.id) || msg.from === role) return;
      seen.add(msg.id);
      if (seen.size > 800) seen.delete(seen.values().next().value);
      if (msg.t === 'ping' && role === 'display') send({ t: 'pong' });
      onMessage(msg);
    }

    let bc = null;
    try { bc = new BroadcastChannel(base); bc.onmessage = e => receive(e.data); } catch (e) { }

    function send(payload) {
      const msg = Object.assign({ id: Math.random().toString(36).slice(2) + Date.now().toString(36), from: role }, payload);
      seen.add(msg.id);
      if (bc) try { bc.postMessage(msg); } catch (e) { }
      const data = JSON.stringify(msg);
      clients.forEach(c => { if (c.connected) c.publish(outTopic, data, { qos: 0 }); });
    }

    function startMqtt() {
      if (typeof window.mqtt === 'undefined') { console.warn('[?] libreria MQTT non caricata (manca internet?)'); return; }
      BROKERS.forEach(url => {
        let c;
        try {
          c = window.mqtt.connect(url, {
            clientId: 'qmark_' + role + '_' + Math.random().toString(16).slice(2, 10),
            keepalive: 15, reconnectPeriod: 2000, connectTimeout: 8000, clean: true
          });
        } catch (e) { console.warn('[?] ripetitore non raggiungibile', url, e); return; }
        c.on('connect', () => {
          console.log('[?] collegato al ripetitore', url);
          c.subscribe(inTopic, { qos: 0 }, () => { if (role === 'controller') send({ t: 'hello' }); });
          status();
        });
        c.on('message', (topic, payload) => { try { receive(JSON.parse(payload.toString())); } catch (e) { } });
        c.on('close', status);
        c.on('offline', status);
        c.on('error', err => console.warn('[?] errore ripetitore', url, err && err.message));
        clients.push(c);
      });
    }

    function wake() {
      clients.forEach(c => { if (!c.connected && !c.reconnecting) { try { c.reconnect(); } catch (e) { } } });
      if (role === 'controller') send({ t: 'ping' });
    }

    startMqtt();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake(); });
    window.addEventListener('online', wake);
    if (role === 'controller') {
      setInterval(() => send({ t: 'ping' }), PING_MS);
      send({ t: 'hello' });
    }

    return { send };
  }
  window.Sync = { create };
})();
