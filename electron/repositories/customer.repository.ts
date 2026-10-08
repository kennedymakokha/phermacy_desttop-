import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export class CustomerRepository {
private readonly db: Database.Database;

constructor(db: Database.Database) {
  this.db = db;
}
  create(input: CreateCustomerInput): CustomerRecord {
    const id = randomUUID();
    const now = new Date().toISOString();

    const name = input.name.trim();

    if (!name) {
      throw new Error("Customer name is required.");
    }

    this.db
      .prepare(`
        INSERT INTO customers (
          id,
          name,
          phone,
          email,
          address,
          created_at,
          updated_at
        )
        VALUES (
          @id,
          @name,
          @phone,
          @email,
          @address,
          @createdAt,
          @updatedAt
        )
      `)
      .run({
        id,
        name,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        createdAt: now,
        updatedAt: now,
      });

    return this.findById(id)!;
  }

  update(
    id: string,
    input: UpdateCustomerInput
  ): CustomerRecord | null {
    const existing = this.findById(id);

    if (!existing) {
      return null;
    }

    const name = input.name?.trim() || existing.name;

    if (!name) {
      throw new Error("Customer name is required.");
    }

    const phone =
      input.phone !== undefined
        ? input.phone?.trim() || null
        : existing.phone;

    const email =
      input.email !== undefined
        ? input.email?.trim() || null
        : existing.email;

    const address =
      input.address !== undefined
        ? input.address?.trim() || null
        : existing.address;

    const updatedAt = new Date().toISOString();

    this.db
      .prepare(`
        UPDATE customers
        SET
          name = @name,
          phone = @phone,
          email = @email,
          address = @address,
          updated_at = @updatedAt
        WHERE id = @id
      `)
      .run({
        id,
        name,
        phone,
        email,
        address,
        updatedAt,
      });

    return this.findById(id);
  }

  findById(id: string): CustomerRecord | null {
    const row = this.db
      .prepare(`
        SELECT *
        FROM customers
        WHERE id = ?
        LIMIT 1
      `)
      .get(id) as CustomerRow | undefined;

    return row ? this.mapCustomer(row) : null;
  }

  findByPhone(phone: string): CustomerRecord | null {
    const normalizedPhone = phone.trim();

    if (!normalizedPhone) {
      return null;
    }

    const row = this.db
      .prepare(`
        SELECT *
        FROM customers
        WHERE phone = ?
        LIMIT 1
      `)
      .get(normalizedPhone) as CustomerRow | undefined;

    return row ? this.mapCustomer(row) : null;
  }

  search(
    searchTerm: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): CustomerRecord[] {
    const term = searchTerm.trim();

    const limit = Math.min(
      Math.max(options?.limit ?? 50, 1),
      500
    );

    const offset = Math.max(options?.offset ?? 0, 0);

    if (!term) {
      return this.list({
        limit,
        offset,
      });
    }

    const rows = this.db
      .prepare(`
        SELECT *
        FROM customers
        WHERE
          name LIKE @search
          OR phone LIKE @search
          OR email LIKE @search
        ORDER BY name COLLATE NOCASE ASC
        LIMIT @limit
        OFFSET @offset
      `)
      .all({
        search: `%${term}%`,
        limit,
        offset,
      }) as CustomerRow[];

    return rows.map((row) => this.mapCustomer(row));
  }

  list(options?: {
    limit?: number;
    offset?: number;
  }): CustomerRecord[] {
    const limit = Math.min(
      Math.max(options?.limit ?? 50, 1),
      500
    );

    const offset = Math.max(options?.offset ?? 0, 0);

    const rows = this.db
      .prepare(`
        SELECT *
        FROM customers
        ORDER BY name COLLATE NOCASE ASC
        LIMIT @limit
        OFFSET @offset
      `)
      .all({
        limit,
        offset,
      }) as CustomerRow[];

    return rows.map((row) => this.mapCustomer(row));
  }

  count(): number {
    const row = this.db
      .prepare(`
        SELECT COUNT(*) AS count
        FROM customers
      `)
      .get() as { count: number };

    return row.count;
  }

  delete(id: string): boolean {
    const result = this.db
      .prepare(`
        DELETE FROM customers
        WHERE id = ?
      `)
      .run(id);

    return result.changes > 0;
  }

  private mapCustomer(row: CustomerRow): CustomerRecord {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}