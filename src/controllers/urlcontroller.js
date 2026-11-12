import crypto from "crypto";
import { pool } from "../config/db.js";
import { Transform } from "node:stream";
import logger from "../config/logger.js";

export const checkController = {
  getHealth: (_req, res) => {
    res.status(200).json({
      status: "success",
      message: "The server is healthy",
      timestamp: new Date().toISOString(),
    });
  },
};

export const url_generator = {
  // 1. Generate short URL (POST /shorten)
  short_url: async (req, res) => {
    try {
      const { target_url, code , expired_at} = req.body;

      if (!target_url) {
        return res.status(400).json({
          status: "failed",
          message: "The target url is missing",
        });
      }

    
     let short_code = code

     if(short_code){
     const query_select= "SELECT id FROM links WHERE short_url = $1"
     const result = await pool.query(query_select, [short_code])
     
     if(result.rows.length > 0){
      return res.status(409).json({
        status: "failed",
        success: false,
        message: 'the vanity code has already been used'
      })
     }

     }else{
      short_code = crypto.randomBytes(4).toString("hex")
     }

      const querytext = `
                INSERT INTO links (target_url, short_code, click_count, created_at) 
                VALUES ($1, $2, 0, NOW()) 
                RETURNING id, target_url, short_code, click_count, created_at;
            `;
      const values = [target_url, short_code];

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
        },
      });
    } catch (err) {
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);
      return res.status(500).json({
        status: "failed",
        success: false,
        message: "An error occurred in your backend",
        error: err.message,
      });
    }
  },

  // 2. Atomic Redirection & Telemetry (GET /:short_code)
  url_redirection: async (req, res) => {
    const client = await pool.connect();

    try {
      const { short_code } = req.params;

      await client.query("BEGIN");
      const selectQuery = `
                SELECT id, target_url, is_active, expired_at 
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
        return res.status(400).json({
          status: "failed",
          success: false,
          message: "The short url is not active",
        });
      }

      if (result.expired_at && new Date() > new Date(result.expired_at)) {
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
      await client.query("ROLLBACK");
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);
      return res.status(500).json({
        status: "failed",
        success: false,
        message: "An error occurred during redirection",
        error: err.message,
      });
    } finally {
      client.release();
    }
  },
};

// Keyset Pagination, CSV Streaming, Deletion, and Metadata
export const getAnalitics = {
  // pagination
  get_clicks: async (req, res) => {
    try {
      const { short_code } = req.params;
      const limit_val = parseInt(req.query.limit, 10) || 50;
      const after_val = parseInt(req.query.after, 10) || 0;

      if (
        isNaN(limit_val) ||
        limit_val < 1 ||
        limit_val > 100 ||
        isNaN(after_val) ||
        after_val < 0
      ) {
        return res.status(400).json({
          status: "failed",
          success: false,
          message:
            "An error occurred during the pagination process the pagin limit must be 1-100 and after must be >= 0",
        });
      }

      const links_query = `SELECT id FROM links WHERE short_code = $1`;
      const links_result = await pool.query(links_query, [short_code]);

      if (links_result.rows.length === 0) {
        return res.status(404).json({
          status: "failed",
          success: false,
          message: "the short code wasn't found ",
        });
      }

      const link_id = links_result.rows[0].id;

      const query_select = `SELECT id, clicked_at, referrer, user_agent FROM click_log WHERE link_id = $1 AND id > $2 ORDER BY id DESC LIMIT $3`;
      const click_result = await pool.query(query_select, [
        link_id,
        after_val,
        limit_val,
      ]);

      const data = click_result.rows;
      const next_cursor = data.length > 0 ? data[data.length - 1].id : null;

      return res.status(200).json({
        status: "success",
        success: true,
        data: data,
        pagination: {
          limit: limit_val,
          after: after_val,
          next_cursor: next_cursor,
          has_more: data.length === limit_val,
        },
      });
    } catch (err) {
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);
      return res.status(500).json({
        status: "failed",
        success: false,
        message: "an error occured while retrieving click log",
      });
    }
  },

  csv_log: async (req, res) => {
    try {
      const { short_code } = req.params;

      const links_query = `SELECT id FROM links WHERE short_code = $1;`;
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

      const csv_transformer = new Transform({
        objectMode: true,
        transform(row, encoding, callback) {
          const clickedAt = new Date(row.clicked_at).toISOString();
          const referrer = row.referrer
            ? `"${row.referrer.replace(/"/g, '""')}"`
            : '""';
          const userAgent = row.user_agent
            ? `"${row.user_agent.replace(/"/g, '""')}"`
            : '""';

          const csv_line = `${row.id},${clickedAt},${referrer},${userAgent}\n`;
          callback(null, csv_line);
        },
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
          csv_transformer.write(row);
        }

        last_id = db_data[db_data.length - 1].id;

        if (db_data.length < batch_size) {
          hasMore_data = false;
        }
      }

      csv_transformer.end();
    } catch (err) {
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);
      return res.status(500).json({
        success: false,
        message: "An error occurred during the exportation process of the csv",
        error: err.message,
      });
    }
  },

  // Deletion endpoint
  deleteUrl: async (req, res) => {
    try {
      const { short_code } = req.params;
      const del_query = `DELETE FROM links WHERE short_code = $1 RETURNING id, short_code, target_url;`;
      const del_code = [short_code];
      const del_result = await pool.query(del_query, del_code);

      if (del_result.rows.length === 0) {
        return res.status(404).json({
          status: "failed",
          message: "The short code is not found",
        });
      }

      return res.status(200).json({
        status: "Passed",
        success: true,
        message:
          "The short code was deleted with related id , short_code and target_url",
      });
    } catch (err) {
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);
      return res.status(500).json({
        status: "failed",
        success: false,
        message: "An error occured during the delection process",
        error: err.message,
      });
    }
  },

  // Metadata endpoint
  metadata_url: async (req, res) => {
    try {
      const { short_code } = req.params;
      const metadata_query = `SELECT id, target_url, short_code, click_count, is_active, created_at, expired_at FROM links WHERE short_code = $1;`;
      const metadata_code = [short_code];
      const metadata_result = await pool.query(metadata_query, metadata_code);

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
          expired_at: metadata_links.expired_at,
        },
      });
    } catch (err) {
      logger.error(`Error: ${err.message}, stacks: ${err.stack}`);
      return res.status(500).json({
        status: "Failed",
        success: false,
        message:
          "An error occured in your backend during the retrieval of the links metadata",
        error: err.message,
      });
    }
  },
};
