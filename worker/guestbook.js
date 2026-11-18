// Durable Object (SQLite) : les mots laissés par les invités d'une carte de groupe. Une instance par page.
import { DurableObject } from 'cloudflare:workers';

export class Guestbook extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS msgs (id TEXT PRIMARY KEY, name TEXT NOT NULL, text TEXT NOT NULL, created TEXT NOT NULL)');
  }

  // Ajoute un mot (refusé au-delà de `max`) ; tout est effacé à l'expiration de la page.
  add(msg, max, expiresAtMs) {
    const [{ c }] = this.sql.exec('SELECT COUNT(*) AS c FROM msgs').toArray();
    if (c >= max) return { ok: false, full: true };
    this.sql.exec('INSERT INTO msgs (id, name, text, created) VALUES (?, ?, ?, ?)', msg.id, msg.name, msg.text, msg.created);
    if (expiresAtMs) this.ctx.storage.setAlarm(expiresAtMs);
    return { ok: true, count: c + 1 };
  }

  list() {
    return this.sql.exec('SELECT id, name, text, created FROM msgs ORDER BY created').toArray();
  }

  count() {
    return this.sql.exec('SELECT COUNT(*) AS c FROM msgs').toArray()[0].c;
  }

  remove(id) {
    this.sql.exec('DELETE FROM msgs WHERE id = ?', id);
    return { ok: true };
  }

  async purge() {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
    return { ok: true };
  }

  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}
