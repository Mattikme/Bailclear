// Durable Object (SQLite) : compteurs agrégés par jour. Une seule instance (« main »), écritures sérialisées.
import { DurableObject } from 'cloudflare:workers';

const KEEP_DAYS = 400; // ≈ 13 mois
const MAX_PATHS = 60;

export class Stats extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS hits (day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k))');
  }

  add(day, keys) {
    for (const k of keys) {
      if (k.startsWith('p:')) {
        const known = this.sql.exec('SELECT 1 FROM hits WHERE k = ? LIMIT 1', k).toArray().length > 0;
        if (!known) {
          const [{ c }] = this.sql.exec("SELECT COUNT(DISTINCT k) AS c FROM hits WHERE k LIKE 'p:%'").toArray();
          if (c >= MAX_PATHS) continue;
        }
      }
      this.sql.exec('INSERT INTO hits (day, k, n) VALUES (?, ?, 1) ON CONFLICT(day, k) DO UPDATE SET n = n + 1', day, k);
    }
    const old = new Date(new Date(`${day}T12:00:00Z`).getTime() - KEEP_DAYS * 86400000).toISOString().slice(0, 10);
    this.sql.exec('DELETE FROM hits WHERE day < ?', old);
  }

  summary(day, month) {
    const sumOf = (rows) => Object.fromEntries(rows.map((r) => [r.k, r.n]));
    const today = sumOf(this.sql.exec("SELECT k, n FROM hits WHERE day = ? AND k NOT LIKE 'p:%'", day).toArray());
    const monthly = sumOf(this.sql.exec("SELECT k, SUM(n) AS n FROM hits WHERE day LIKE ? AND k NOT LIKE 'p:%' GROUP BY k", `${month}-%`).toArray());
    const from = new Date(new Date(`${day}T12:00:00Z`).getTime() - 29 * 86400000).toISOString().slice(0, 10);
    const series = {};
    for (const r of this.sql.exec("SELECT day, k, n FROM hits WHERE day >= ? AND k NOT LIKE 'p:%' ORDER BY day DESC", from).toArray()) {
      (series[r.day] ||= {})[r.k] = r.n;
    }
    const top = this.sql.exec("SELECT substr(k, 3) AS path, SUM(n) AS n FROM hits WHERE day LIKE ? AND k LIKE 'p:%' GROUP BY k ORDER BY n DESC LIMIT 10", `${month}-%`).toArray();
    const total = sumOf(this.sql.exec("SELECT k, SUM(n) AS n FROM hits WHERE k NOT LIKE 'p:%' GROUP BY k").toArray());
    return { day, month, today, monthly, total, series, top };
  }
}
