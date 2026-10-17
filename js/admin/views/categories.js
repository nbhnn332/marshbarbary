/**
 * MARSH BARBARY — ADMIN VIEW: CATEGORIES (js/admin/views/categories.js)
 * Taxonomy manager for modest silhouettes with display order & product counts.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

const DEFAULT_CAT_IMAGE = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=85';

window.MB_ADMIN_VIEWS.categories = {
  title: 'Categories & Silhouettes',

  async render(container) {
    const service = window.MB_ADMIN_SERVICE;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Store Categories
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            Curate fashion categories, ordering, editorial descriptions, and storefront display.
          </p>
        </div>
        <div>
          <button id="btn-add-category" class="admin-btn admin-btn-primary admin-btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Category
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width: 50px;">Order</th>
                <th style="width: 70px;">Visual</th>
                <th>Category Name & Slug</th>
                <th>Editorial Description</th>
                <th>Garments</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="categories-tbody">
              <tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--mb-admin-muted);">Loading categories...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit Category Modal Container -->
      <div id="cat-modal-container"></div>
    `;

    async function loadCategories() {
      const list = await service.getCategories();
      // Sort by displayOrder
      list.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));

      const tbody = document.getElementById('categories-tbody');
      tbody.innerHTML = list.map(c => `
        <tr>
          <td style="font-weight: 600; color: var(--mb-admin-muted);">${c.displayOrder || 1}</td>
          <td>
            <img src="${window.MB_IMAGE_SOURCE ? window.MB_IMAGE_SOURCE.resolveDisplayUrl(c.image || DEFAULT_CAT_IMAGE) : (c.image || DEFAULT_CAT_IMAGE)}" alt="" style="width: 48px; height: 60px; object-fit: cover; border-radius: 2px; border: 1px solid var(--mb-admin-border);" onerror="this.src='${DEFAULT_CAT_IMAGE}';">
          </td>
          <td>
            <div style="font-weight: 500; color: var(--mb-admin-text); font-size: 13px;">${c.name}</div>
            <div style="font-size: 11px; color: var(--mb-admin-muted); font-family: monospace;">/${c.slug}</div>
          </td>
          <td style="font-size: 12px; color: var(--mb-admin-text-sub); max-width: 280px;">
            ${c.description || '—'}
          </td>
          <td>
            <span class="admin-badge admin-badge-neutral">${c.productCount || 0} pieces</span>
          </td>
          <td>
            <span class="admin-badge ${c.status === 'active' ? 'admin-badge-success' : 'admin-badge-neutral'}">
              ${c.status || 'active'}
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="admin-btn admin-btn-outline admin-btn-sm btn-edit-cat" data-id="${c.id}" style="padding: 4px 8px; font-size: 11px;">
                Edit
              </button>
              <a href="../shop.html?category=${c.slug}" target="_blank" class="admin-btn admin-btn-outline admin-btn-sm" title="View in Shop" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">
                Shop ↗
              </a>
              <button class="admin-btn admin-btn-danger admin-btn-sm btn-del-cat" data-id="${c.id}" data-name="${c.name}" style="padding: 4px 8px; font-size: 11px;" title="Delete category">
                &times;
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      // Wire edit buttons
      tbody.querySelectorAll('.btn-edit-cat').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const btnEl = e.target.closest('.btn-edit-cat') || e.currentTarget;
          const id = btnEl.getAttribute('data-id');
          const cat = list.find(item => item.id === id);
          if (cat) openCategoryModal(cat);
        });
      });

      // Wire delete buttons
      tbody.querySelectorAll('.btn-del-cat').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const btnEl = e.target.closest('.btn-del-cat') || e.currentTarget;
          const id = btnEl.getAttribute('data-id');
          const name = btnEl.getAttribute('data-name');
          window.MB_ADMIN_SHELL.confirmModal({
            title: `Delete Category: ${name}?`,
            message: `Are you sure you want to remove the "${name}" category? Products under this category will have their category unlinked.`,
            confirmText: 'Delete Category',
            confirmType: 'danger',
            onConfirm: async () => {
              try {
                await service.deleteCategory(id);
                window.MB_ADMIN_SHELL.showToast(`Category "${name}" deleted`, 'success');
                await loadCategories();
              } catch (err) {
                window.MB_ADMIN_SHELL.showToast(err.message || 'Error deleting category', 'error');
              }
            }
          });
        });
      });
    }

    function openCategoryModal(cat = null) {
      const isNew = !cat;
      const modalCont = document.getElementById('cat-modal-container');
      const data = cat || {
        id: '',
        name: '',
        slug: '',
        description: '',
        image: DEFAULT_CAT_IMAGE,
        displayOrder: 1,
        status: 'active'
      };

      modalCont.innerHTML = `
        <div class="admin-modal-backdrop active" id="category-modal-backdrop">
          <div class="admin-modal" style="max-width: 520px;">
            <div class="admin-modal-header">
              <div class="admin-modal-title">${isNew ? 'New Category' : `Edit Category: ${data.name}`}</div>
              <button class="admin-modal-close" id="btn-close-cat-modal">&times;</button>
            </div>
            <form id="category-modal-form">
              <div class="admin-modal-body">
                <div class="admin-form-group">
                  <label class="admin-label" for="cat-m-name">Category Name *</label>
                  <input type="text" id="cat-m-name" class="admin-input" required value="${data.name}" placeholder="e.g. Kaftans">
                </div>

                <div class="admin-grid admin-grid-2">
                  <div class="admin-form-group">
                    <label class="admin-label" for="cat-m-slug">URL Slug *</label>
                    <input type="text" id="cat-m-slug" class="admin-input" required value="${data.slug}" placeholder="kaftans">
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="cat-m-order">Display Sequence</label>
                    <input type="number" id="cat-m-order" class="admin-input" value="${data.displayOrder || 1}" min="1">
                  </div>
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="cat-m-desc">Editorial Description</label>
                  <textarea id="cat-m-desc" class="admin-textarea" rows="2" placeholder="Brief editorial note...">${data.description || ''}</textarea>
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="cat-m-status">Visibility Status</label>
                  <select id="cat-m-status" class="admin-select">
                    <option value="active" ${data.status === 'active' ? 'selected' : ''}>Active (Visible)</option>
                    <option value="hidden" ${data.status === 'hidden' ? 'selected' : ''}>Hidden</option>
                  </select>
                </div>

                <div class="admin-form-group">
                  <div id="cat-img-source-mount"></div>
                </div>
              </div>
              <div class="admin-modal-footer">
                <button type="button" class="admin-btn admin-btn-outline" id="btn-cancel-cat-modal">Cancel</button>
                <button type="submit" class="admin-btn admin-btn-primary">${isNew ? 'Create Category' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      `;

      // Mount Global Image Source Widget in modal
      if (window.MB_IMAGE_SOURCE) {
        window.MB_IMAGE_SOURCE.render('#cat-img-source-mount', {
          id: 'cat-modal-source',
          label: 'Category Silhouette Visual *',
          initialValue: data.image || DEFAULT_CAT_IMAGE,
          compact: true
        });
      }

      // Auto-generate slug from Category Name in real time
      const catNameInput = document.getElementById('cat-m-name');
      const catSlugInput = document.getElementById('cat-m-slug');
      let userManuallyEditedSlug = !isNew && Boolean(data.slug);

      catNameInput?.addEventListener('input', () => {
        if (!userManuallyEditedSlug && catSlugInput) {
          catSlugInput.value = catNameInput.value
            .toLowerCase()
            .trim()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
      });

      catSlugInput?.addEventListener('input', () => {
        userManuallyEditedSlug = true;
      });

      const close = () => { modalCont.innerHTML = ''; };
      document.getElementById('btn-close-cat-modal')?.addEventListener('click', close);
      document.getElementById('btn-cancel-cat-modal')?.addEventListener('click', close);

      document.getElementById('category-modal-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        let catImage = data.image || DEFAULT_CAT_IMAGE;
        if (window.MB_IMAGE_SOURCE) {
          const val = window.MB_IMAGE_SOURCE.getValue('#cat-img-source-mount');
          if (val && val.activeValue) catImage = val.activeValue;
        }

        const nameVal = document.getElementById('cat-m-name').value.trim();
        const rawSlug = document.getElementById('cat-m-slug').value.trim() || nameVal;
        const cleanSlug = rawSlug
          .toLowerCase()
          .replace(/&/g, 'and')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

        const payload = {
          id: data.id || `cat-${Date.now()}`,
          name: nameVal,
          slug: cleanSlug,
          description: document.getElementById('cat-m-desc').value.trim(),
          image: catImage || DEFAULT_CAT_IMAGE,
          displayOrder: parseInt(document.getElementById('cat-m-order').value, 10) || 1,
          status: document.getElementById('cat-m-status').value
        };

        try {
          await service.saveCategory(payload);
          window.MB_ADMIN_SHELL.showToast(`Category "${payload.name}" saved`, 'success');
          close();
          loadCategories();
        } catch (err) {
          window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving category', 'error');
        }
      });
    }

    document.getElementById('btn-add-category')?.addEventListener('click', () => openCategoryModal());

    await loadCategories();
  }
};
