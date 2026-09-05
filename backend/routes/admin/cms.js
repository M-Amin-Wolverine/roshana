// ============================================================
// routes/admin/cms.js - CMS API Routes
// ============================================================

const express = require('express');
const router = express.Router();

// ═══════════════════════════════════════════════════════════
// 📰 مدیریت اخبار
// ═══════════════════════════════════════════════════════════
router.get('/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const news = await global.db('news')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    const total = await global.db('news').count('* as total').first();
    
    res.json({ success: true, data: news, total: parseInt(total.total), page, limit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/news', async (req, res) => {
  try {
    const { title, content, excerpt, image, category_id, tags, is_published } = req.body;
    
    const [item] = await global.db('news')
      .insert({
        title,
        slug: generateSlug(title),
        content,
        excerpt,
        featured_image: image,
        category_id,
        tags: JSON.stringify(tags || []),
        status: is_published ? 'published' : 'draft',
        author_id: req.user?.id,
        published_at: is_published ? new Date() : null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, image, category_id, tags, is_published } = req.body;
    
    const updateData = {
      title,
      content,
      excerpt,
      featured_image: image,
      category_id,
      tags: JSON.stringify(tags || []),
      status: is_published ? 'published' : 'draft',
      updated_at: new Date()
    };
    
    if (is_published) {
      updateData.published_at = updateData.published_at || new Date();
    }
    
    const [item] = await global.db('news')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/news/:id', async (req, res) => {
  try {
    await global.db('news').where('id', req.params.id).delete();
    res.json({ success: true, message: 'خبر حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 🖼️ مدیریت اسلایدر
// ═══════════════════════════════════════════════════════════
router.get('/sliders', async (req, res) => {
  try {
    const sliders = await global.db('sliders')
      .select('*')
      .orderBy('order_index', 'asc');
    
    res.json({ success: true, data: sliders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sliders', async (req, res) => {
  try {
    const { title, subtitle, image, link_url, is_active, order_index } = req.body;
    
    const [item] = await global.db('sliders')
      .insert({
        title,
        subtitle,
        image,
        link_url,
        is_active: is_active !== false,
        order_index: order_index || 0,
        created_at: new Date()
      })
      .returning('*');
    
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/sliders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, image, link_url, is_active, order_index } = req.body;
    
    const [item] = await global.db('sliders')
      .where('id', id)
      .update({
        title, subtitle, image, link_url,
        is_active: is_active !== false,
        order_index: order_index || 0,
        updated_at: new Date()
      })
      .returning('*');
    
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/sliders/:id', async (req, res) => {
  try {
    await global.db('sliders').where('id', req.params.id).delete();
    res.json({ success: true, message: 'اسلایدر حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ⚙️ تنظیمات سایت
// ═══════════════════════════════════════════════════════════
router.get('/settings', async (req, res) => {
  try {
    const settings = await global.db('site_settings').select('*');
    
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.setting_key] = s.setting_value;
    });
    
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const updates = req.body;
    
    for (const [key, value] of Object.entries(updates)) {
      await global.db('site_settings')
        .insert({
          setting_key: key,
          setting_value: String(value),
          updated_at: new Date()
        })
        .onConflict('setting_key')
        .merge({
          setting_value: String(value),
          updated_at: new Date()
        });
    }
    
    res.json({ success: true, message: 'تنظیمات ذخیره شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 📋 بلوک‌های محتوایی
// ═══════════════════════════════════════════════════════════
router.get('/content-blocks', async (req, res) => {
  try {
    const blocks = await global.db('content_blocks').select('*');
    
    const blocksObj = {};
    blocks.forEach(b => {
      blocksObj[b.key_name] = {
        content: b.content,
        title: b.title,
        type: b.content_type
      };
    });
    
    res.json({ success: true, data: blocksObj });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/content-blocks/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { content, title, type } = req.body;
    
    await global.db('content_blocks')
      .insert({
        key_name: key,
        content: content,
        title: title || key,
        content_type: type || 'html',
        updated_at: new Date()
      })
      .onConflict('key_name')
      .merge({
        content: content,
        title: title || key,
        content_type: type || 'html',
        updated_at: new Date()
      });
    
    res.json({ success: true, message: 'بلوک ذخیره شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 📄 صفحات استاتیک
// ═══════════════════════════════════════════════════════════
router.get('/pages', async (req, res) => {
  try {
    const pages = await global.db('pages')
      .select('*')
      .orderBy('order_index', 'asc');
    
    res.json({ success: true, data: pages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/pages', async (req, res) => {
  try {
    const { title, slug, content, meta_title, meta_description, status } = req.body;
    
    const [item] = await global.db('pages')
      .insert({
        title,
        slug: slug || generateSlug(title),
        content,
        meta_title,
        meta_description,
        status: status || 'draft',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, content, meta_title, meta_description, status } = req.body;
    
    const [item] = await global.db('pages')
      .where('id', id)
      .update({
        title, slug, content, meta_title, meta_description, status,
        updated_at: new Date()
      })
      .returning('*');
    
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 📊 منوها
// ═══════════════════════════════════════════════════════════
router.get('/menus', async (req, res) => {
  try {
    const menus = await global.db('menus').select('*');
    
    for (const menu of menus) {
      menu.items = await global.db('menu_items')
        .where('menu_id', menu.id)
        .orderBy('order_index', 'asc');
    }
    
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/menus/:menuId/items', async (req, res) => {
  try {
    const { menuId } = req.params;
    const { title, url, parent_id, order_index } = req.body;
    
    const [item] = await global.db('menu_items')
      .insert({
        menu_id: menuId,
        title,
        url,
        parent_id,
        order_index: order_index || 0
      })
      .returning('*');
    
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 🏷️ برچسب‌ها (Tags)
// ═══════════════════════════════════════════════════════════
router.get('/tags', async (req, res) => {
  try {
    const tags = await global.db('tags').select('*').orderBy('name', 'asc');
    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 📁 دسته‌بندی‌ها
// ═══════════════════════════════════════════════════════════
router.get('/categories', async (req, res) => {
  try {
    const categories = await global.db('news_categories')
      .select('*')
      .orderBy('order_index', 'asc');
    
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 🔧 Helper
// ═══════════════════════════════════════════════════════════
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

module.exports = router;