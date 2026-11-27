import crypto from "crypto";
import { pool } from "../config/db.js";
import { Transform } from "node:stream";
import logger from "../config/logger.js";
import { pagination_schema } from "../middlewares/urlvalidation.js";

const RESERVED_CODES = new Set(["links", "docs", "api-docs", "health"]);

export const checkController = {
  getHealth: async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      return res.status(200).json({
        status: "success",
        message: "The server is healthy",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);

      return res.status(503).json({
        status: "failed",
        message: "Database connection failed",
      });
    }
  },
};

export const url_generator = {
  // 1. Generate short URL (POST /links)
  short_url: async (req, res) => {
    try {
      const { target_url, code, expires_at } = req.body;

      if (!target_url) {
        return res.status(400).json({
          status: "failed",
          message: "The target url is missing",
        });
      }

      // Reject reserved vanity codes (case-insensitive)
      if (typeof code === "string" && RESERVED_CODES.has(code.toLowerCase())) {
        return res.status(400).json({
          status: "failed",
          success: false,
          message: "This short code is reserved and cannot be used",
        });
      }

      const short_code = code || crypto.randomBytes(4).toString("hex");

      const querytext = `
        INSERT INTO links (
          target_url,
          short_code,
          click_count,
          expires_at,
          created_at
        )
        VALUES ($1, $2, 0, $3, NOW())
        RETURNING id, target_url, short_code, click_count, expires_at, created_at;
      `;

      const values = [target_url, short_code, expires_at || null];

      const output = await pool.query(querytext, values);
      const record_url = output.rows[0];

      const protocol_host = `${req.protocol}://${req.get("host")}`;
      const generated_url = `${protocol_host}/${record_url.short_code}`;

      return res.status(201).json({
        status: "success",
        message: "The short url was generated successfully",
        data: {
          id: record_url.id,
          target_url: record_url.target_url,
          short_code: record_url.short_code,
          shorten_url: generated_url,
          click_count: record_url.click_count,
          created_at: record_url.created_at,
          expires_at: record_url.expires_at,
        },
      });
    } catch (err) {
      // PostgreSQL unique_violation: duplicate vanity code
      if (err.code === "23505") {
        return res.status(409).json({
          status: "failed",
          success: false,
          message: "The vanity code has already been used",
        });
      }

      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);

      return res.status(500).json({
        status: "failed",
        success: false,
        message: "An internal server error occurred",
      });
    }
  },

  // 2. Atomic Redirection & Telemetry (GET /:short_code)
  url_redirection: async (req, res) => {
    let client;

    try {
      client = await pool.connect();

      const { short_code } = req.params;

      await client.query("BEGIN");

      const selectQuery = `
        SELECT id, target_url, is_active, expires_at
        FROM links
        WHERE short_code = $1;
      `;

      const output = await client.query(selectQuery, [short_code]);

      if (output.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          status: "failed",
          success: false,
          message: "The short url was not found in the database",
        });
      }

      const result = output.rows[0];

      if (!result.is_active) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          status: "failed",
          success: false,
          message: "The short url is not active",
        });
      }

      if (
        result.expires_at &&
        Date.now() >= new Date(result.expires_at).getTime()
      ) {
        await client.query("ROLLBACK");

        return res.status(410).json({
          status: "failed",
          success: false,
          message: "The short url has expired",
        });
      }

      const update_query = `
        UPDATE links
        SET click_count = click_count + 1
        WHERE short_code = $1;
      `;

      await client.query(update_query, [short_code]);

      const logQuery = `
        INSERT INTO click_log (link_id, referrer, user_agent)
        VALUES ($1, $2, $3);
      `;

      await client.query(logQuery, [
        result.id,
        req.get("referrer") || req.get("referer") || null,
        req.get("user-agent") || null,
      ]);

      await client.query("COMMIT");

      return res.redirect(302, result.target_url);
    } catch (err) {
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          logger.error(`Rollback error: ${rollbackError.message}`);
        }
      }

      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);

      return res.status(500).json({
        status: "failed",
        success: false,
        message: "An error occurred during redirection",
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  },
};

// Keyset Pagination, CSV Streaming, Deletion, and Metadata
export const getAnalitics = {
  get_clicks: async (req, res) => {
    try {
      const { short_code } = req.params;

      // Strict pagination input validation
     
const pagination_result = pagination_schema.safeParse(req.query);

if (!pagination_result.success) {
  return res.status(400).json({
    status: "failed",
    success: false,
    message: "Pagination limit must be 1-100 and after must be >= 0",
  });
}

const limit_val = pagination_result.data.limit ?? 50;
const after_val = pagination_result.data.after ?? null;


      const links_query = `
        SELECT id
        FROM links
        WHERE short_code = $1;
      `;

      const links_result = await pool.query(links_query, [short_code]);

      if (links_result.rows.length === 0) {
        return res.status(404).json({
          status: "failed",
          success: false,
          message: "The short code wasn't found",
        });
      }

      const link_id = links_result.rows[0].id;

      let query_select = `
        SELECT id, clicked_at, referrer, user_agent
        FROM click_log
        WHERE link_id = $1
      `;

      const params_query = [link_id];

      if (after_val !== null) {
        query_select += ` AND id < $2`;
        params_query.push(after_val);
      }

      query_select += ` ORDER BY id DESC LIMIT $${params_query.length + 1}`;

      // Fetch one extra row to determine whether another page exists
      params_query.push(limit_val + 1);

      const click_result = await pool.query(query_select, params_query);

      const has_more = click_result.rows.length > limit_val;

      const data = click_result.rows.slice(0, limit_val);

      const next_cursor = has_more ? data[data.length - 1].id : null;

      return res.status(200).json({
        status: "success",
        success: true,
        data,
        pagination: {
          limit: limit_val,
          after: after_val,
          next_cursor,
          has_more,
        },
      });
    } catch (err) {
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);

      return res.status(500).json({
        status: "failed",
        success: false,
        message: "An error occurred while retrieving click logs",
      });
    }
  },

  // 3. CSV Export with Formula Injection Protection
  csv_log: async (req, res) => {
    try {
      const { short_code } = req.params;

      const links_query = `
        SELECT id
        FROM links
        WHERE short_code = $1;
      `;

      const links_result = await pool.query(links_query, [short_code]);

      if (links_result.rows.length === 0) {
        return res.status(404).json({
          status: "failed",
          message: "The short code is not found",
        });
      }

      const linkID = links_result.rows[0].id;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="clicks_${short_code}.csv"`,
      );

      res.write("id,clicked_at,referrer,user_agent\n");

      const sanitizeCell = (val) => {
        if (val === null || val === undefined) {
          return '""';
        }

        let stringVal = String(val);

        if (/^[=+\-@\t\r]/.test(stringVal)) {
          stringVal = `'${stringVal}`;
        }

        return `"${stringVal.replace(/"/g, '""')}"`;
      };

      const csv_transformer = new Transform({
        objectMode: true,

        transform(row, encoding, callback) {
          try {
            const clickedAt = new Date(row.clicked_at).toISOString();
            const referrer = sanitizeCell(row.referrer);
            const userAgent = sanitizeCell(row.user_agent);

            const csv_line = `${row.id},${clickedAt},${referrer},${userAgent}\n`;

            callback(null, csv_line);
          } catch (err) {
            callback(err);
          }
        },
      });

      csv_transformer.on("error", (err) => {
        logger.error(`CSV stream error: ${err.message}`);

        if (!res.headersSent) {
          res.status(500).json({
            status: "failed",
            message: "An error occurred during CSV export",
          });
        } else {
          res.destroy(err);
        }
      });

      csv_transformer.pipe(res);

      let last_id = 0;
      let hasMore_data = true;
      const batch_size = 5000;

      while (hasMore_data) {
        const query_select = `
          SELECT id, clicked_at, referrer, user_agent
          FROM click_log
          WHERE link_id = $1 AND id > $2
          ORDER BY id ASC
          LIMIT $3;
        `;

        const data = [linkID, last_id, batch_size];

        const output = await pool.query(query_select, data);
        const db_data = output.rows;

        if (db_data.length === 0) {
          hasMore_data = false;
          break;
        }

        for (const row of db_data) {
          if (!csv_transformer.write(row)) {
            await new Promise((resolve) =>
              csv_transformer.once("drain", resolve),
            );
          }
        }

        last_id = db_data[db_data.length - 1].id;

        if (db_data.length < batch_size) {
          hasMore_data = false;
        }
      }

      csv_transformer.end();
    } catch (err) {
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "An error occurred during CSV export",
        });
      }

      return res.destroy(err);
    }
  },

  // 4. Delete URL
  deleteUrl: async (req, res) => {
    try {
      const { short_code } = req.params;

      const del_query = `
        DELETE FROM links
        WHERE short_code = $1
        RETURNING id;
      `;

      const del_result = await pool.query(del_query, [short_code]);

      if (del_result.rows.length === 0) {
        return res.status(404).json({
          status: "failed",
          message: "The short code is not found",
        });
      }

      return res.status(204).send();
    } catch (err) {
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);

      return res.status(500).json({
        status: "failed",
        success: false,
        message: "An error occurred during deletion",
      });
    }
  },

  // 5. Retrieve URL Metadata
  metadata_url: async (req, res) => {
    try {
      const { short_code } = req.params;

      const metadata_query = `
        SELECT
          id,
          target_url,
          short_code,
          click_count,
          is_active,
          created_at,
          expires_at
        FROM links
        WHERE short_code = $1;
      `;

      const metadata_result = await pool.query(metadata_query, [short_code]);

      if (metadata_result.rows.length === 0) {
        return res.status(404).json({
          status: "failed",
          message: "The short code is not found",
        });
      }

      const metadata_links = metadata_result.rows[0];

      return res.status(200).json({
        status: "success",
        success: true,
        message: "Metadata retrieved successfully",
        data: {
          id: metadata_links.id,
          target_url: metadata_links.target_url,
          short_code: metadata_links.short_code,
          click_count: metadata_links.click_count,
          is_active: metadata_links.is_active,
          created_at: metadata_links.created_at,
          expires_at: metadata_links.expires_at,
        },
      });
    } catch (err) {
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);

      return res.status(500).json({
        status: "failed",
        success: false,
        message: "An error occurred while retrieving metadata",
      });
    }
  },
};
