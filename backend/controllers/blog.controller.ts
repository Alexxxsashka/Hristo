import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const getPosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    let queryStr = 'SELECT * FROM blog_posts';
    const params: any[] = [];

    if (category) {
      queryStr += ' WHERE category = $1';
      params.push(category);
    }

    queryStr += ` ORDER BY date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, (Number(page) - 1) * Number(limit));

    const result = await pool.query(queryStr, params);
    const mapped = result.rows.map(p => ({
      ...p,
      image: p.image_url,
      readTime: p.read_time
    }));
    
    const countRes = await pool.query('SELECT COUNT(*) FROM blog_posts' + (category ? ' WHERE category = $1' : ''), category ? [category] : []);
    const total = parseInt(countRes.rows[0].count);

    res.json({
      success: true,
      data: mapped,
      pagination: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Blog fetch error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const getPostBySlug = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM blog_posts WHERE slug = $1', [req.params.slug]);
    if (result.rows.length > 0) {
      const post = result.rows[0];
      res.json({ success: true, data: { ...post, image: post.image_url } });
    } else {
      res.status(404).json({ success: false, error: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, title, excerpt, content, author, date, image, category, tags, slug, readTime } = req.body;
    const postId = id || `post-${Date.now()}`;
    await pool.query(
      `INSERT INTO blog_posts (id, title, excerpt, content, author, date, image_url, category, tags, slug, read_time) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [postId, title, excerpt, content, author, date, image, category, JSON.stringify(tags || []), slug, readTime]
    );
    res.status(201).json({ success: true, data: { id: postId } });
  } catch (error) {
    console.error('Blog creation error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, excerpt, content, author, date, image, category, tags, slug, readTime } = req.body;
    await pool.query(
      `UPDATE blog_posts SET title = $1, excerpt = $2, content = $3, author = $4, date = $5, 
       image_url = $6, category = $7, tags = $8, slug = $9, read_time = $10 WHERE id = $11`,
      [title, excerpt, content, author, date, image, category, JSON.stringify(tags || []), slug, readTime, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM blog_posts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};
