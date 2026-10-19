/**
 * MARSH BARBARY — ADMIN VIEW: INSTAGRAM FEED MANAGEMENT (js/admin/views/instagram-feed.js)
 * Standalone Content section under 'CONTENT' in the Admin Portal.
 * Allows adding, editing, reordering, deleting, and enabling/disabling Instagram post cards
 * displayed on the customer About page slider.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS['instagram-feed'] = {
  title: 'Instagram Feed Management',

  async render(container) {
    const service = window.MB_ADMIN_SERVICE;
    let posts = await service.getInstagramFeed();

    function renderView() {
      container.innerHTML = `
        <div class="admin-view-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
          <div>
            <h1 class="admin-page-title" style="font-family: var(--mb-font-serif, serif); font-size: 26px; font-weight: 500; color: var(--mb-admin-dark, #1A1A1A); margin: 0 0 6px 0;">
              Instagram Feed &amp; Slider
            </h1>
            <p style="font-size: 13px; color: var(--mb-admin-muted, #767676); margin: 0;">
              Manage the photos, captions, and links displayed in the About page Instagram auto-slider for 
              <a href="https://www.instagram.com/marshbarbary/" target="_blank" rel="noopener noreferrer" style="color: var(--mb-admin-accent, #C46238); text-decoration: none; font-weight: 600;">
                @marshbarbary &rarr;
              </a>
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" id="btn-reset-ig" class="admin-btn admin-btn-outline" style="font-size: 12px; padding: 8px 14px; border: 1px solid var(--mb-admin-border, #E5E5E5); background: #FFF; border-radius: 4px; cursor: pointer;">
              Reset to Official Posts
            </button>
            <button type="button" id="btn-add-ig" class="admin-btn admin-btn-primary" style="font-size: 12px; padding: 8px 16px; background: var(--mb-admin-dark, #1A1A1A); color: #FFF; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add New Post
            </button>
          </div>
        </div>

        <!-- Info Banner -->
        <div style="background: #FDF9F6; border: 1px solid #F3E5DC; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #EBD9CE; display: flex; align-items: center; justify-content: center; color: #C46238;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="#FDF9F6"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#FDF9F6" stroke-width="2"/>
              </svg>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: #1A1A1A;">Official Profile Synced: @marshbarbary</div>
              <div style="font-size: 12px; color: #767676;">Showing ${posts.filter(p => p.active !== false).length} active posts in the About page slider. Drag or use arrows to change position.</div>
            </div>
          </div>
          <a href="../about.html" target="_blank" class="admin-btn" style="font-size: 11px; padding: 6px 12px; background: #FFF; border: 1px solid #E5E5E5; border-radius: 4px; text-decoration: none; color: #1A1A1A;">
            View About Page Slider &rarr;
          </a>
        </div>

        <!-- Posts Grid -->
        <div id="ig-posts-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
          ${posts.map((post, idx) => `
            <div class="admin-card" data-id="${post.id}" style="background: #FFF; border: 1px solid var(--mb-admin-border, #E5E5E5); border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; transition: box-shadow 0.2s ease;">
              <!-- Thumbnail & Status Header -->
              <div style="position: relative; aspect-ratio: 1 / 1; background: #F5F5F5; overflow: hidden;">
                <img src="${post.img && !post.img.includes('assets/images/') && !post.img.includes('unsplash.com') ? post.img : (window.MB_FALLBACK_SVG || '')}" 
                     alt="Post preview" 
                     style="width: 100%; height: 100%; object-fit: cover; opacity: ${post.active === false ? 0.4 : 1};"
                     onerror="this.src=window.MB_FALLBACK_SVG || '';" />
                
                <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.65); color: #FFF; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; backdrop-filter: blur(2px);">
                  #${idx + 1}
                </div>

                <div style="position: absolute; top: 10px; right: 10px;">
                  <button type="button" class="btn-toggle-active" data-id="${post.id}" title="${post.active === false ? 'Enable post' : 'Hide from slider'}" style="background: ${post.active === false ? '#999' : '#10B981'}; color: #FFF; border: none; font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 12px; cursor: pointer;">
                    ${post.active === false ? 'Hidden' : 'Active'}
                  </button>
                </div>

                <a href="${post.url || 'https://www.instagram.com/marshbarbary/'}" target="_blank" rel="noopener noreferrer" style="position: absolute; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9); color: #1A1A1A; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);" title="Open original post on Instagram">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>

              <!-- Body Details -->
              <div style="padding: 16px; flex: 1; display: flex; flex-direction: column;">
                <div style="font-size: 11px; color: var(--mb-admin-muted, #767676); margin-bottom: 6px; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${post.url || ''}">
                  ${post.url ? post.url.replace('https://www.instagram.com/', '') : '@marshbarbary'}
                </div>
                
                <p style="font-size: 13px; line-height: 1.5; color: #1A1A1A; margin: 0 0 14px 0; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;" title="${post.caption || ''}">
                  ${post.caption || '<em>No caption</em>'}
                </p>

                <!-- Actions Bottom Bar -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--mb-admin-border, #E5E5E5); padding-top: 12px; margin-top: auto;">
                  <div style="display: flex; gap: 4px;">
                    <button type="button" class="btn-move-left admin-btn" data-id="${post.id}" ${idx === 0 ? 'disabled' : ''} style="padding: 4px 8px; font-size: 11px; border: 1px solid #E5E5E5; background: #FFF; border-radius: 3px; cursor: pointer;" title="Move left">
                      &larr;
                    </button>
                    <button type="button" class="btn-move-right admin-btn" data-id="${post.id}" ${idx === posts.length - 1 ? 'disabled' : ''} style="padding: 4px 8px; font-size: 11px; border: 1px solid #E5E5E5; background: #FFF; border-radius: 3px; cursor: pointer;" title="Move right">
                      &rarr;
                    </button>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn-edit-post admin-btn" data-id="${post.id}" style="padding: 4px 10px; font-size: 11px; border: 1px solid #E5E5E5; background: #FFF; border-radius: 3px; cursor: pointer; color: #1A1A1A;">
                      Edit
                    </button>
                    <button type="button" class="btn-delete-post admin-btn" data-id="${post.id}" style="padding: 4px 10px; font-size: 11px; border: 1px solid #FED7D7; background: #FFF5F5; color: #E53E3E; border-radius: 3px; cursor: pointer;">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Post Edit / Create Modal Container -->
        <div id="ig-modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center; padding: 20px;">
          <div style="background: #FFF; width: 100%; max-width: 520px; border-radius: 8px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h3 id="ig-modal-title" style="margin: 0; font-family: var(--mb-font-serif, serif); font-size: 20px; color: #1A1A1A;">Add Instagram Post</h3>
              <button type="button" id="ig-modal-close" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #767676;">&times;</button>
            </div>
            
            <form id="ig-post-form">
              <input type="hidden" id="ig-form-id" />
              
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Image URL *</label>
                <input type="text" id="ig-form-img" required placeholder="https://... or data:image/..." style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;" />
                <span style="font-size: 11px; color: #767676; display: block; margin-top: 4px;">Paste an external image CDN URL or direct link</span>
              </div>

              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Instagram Post Link *</label>
                <input type="url" id="ig-form-url" required placeholder="https://www.instagram.com/marshbarbary/p/..." style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;" />
              </div>

              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Caption</label>
                <textarea id="ig-form-caption" rows="3" placeholder="Enter post caption or styling notes..." style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;"></textarea>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Likes Count</label>
                  <input type="text" id="ig-form-likes" placeholder="e.g. 420" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;" />
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Status</label>
                  <select id="ig-form-active" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box; background: #FFF;">
                    <option value="true">Active in Slider</option>
                    <option value="false">Hidden / Draft</option>
                  </select>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" id="ig-modal-cancel" style="padding: 8px 16px; font-size: 12px; border: 1px solid #E5E5E5; background: #FFF; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button type="submit" style="padding: 8px 20px; font-size: 12px; background: #1A1A1A; color: #FFF; border: none; border-radius: 4px; cursor: pointer;">Save Post</button>
              </div>
            </form>
          </div>
        </div>
      `;

      attachEvents();
    }

    function attachEvents() {
      // Toggle Active
      container.querySelectorAll('.btn-toggle-active').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          const post = posts.find(p => p.id === id);
          if (post) {
            post.active = post.active === false ? true : false;
            await service.saveInstagramFeed(posts);
            window.MB_ADMIN_SHELL?.showToast(`Post #${id} visibility updated`, 'success');
            renderView();
          }
        });
      });

      // Move Left
      container.querySelectorAll('.btn-move-left').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          const idx = posts.findIndex(p => p.id === id);
          if (idx > 0) {
            const temp = posts[idx];
            posts[idx] = posts[idx - 1];
            posts[idx - 1] = temp;
            await service.saveInstagramFeed(posts);
            renderView();
          }
        });
      });

      // Move Right
      container.querySelectorAll('.btn-move-right').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          const idx = posts.findIndex(p => p.id === id);
          if (idx < posts.length - 1) {
            const temp = posts[idx];
            posts[idx] = posts[idx + 1];
            posts[idx + 1] = temp;
            await service.saveInstagramFeed(posts);
            renderView();
          }
        });
      });

      // Delete Post
      container.querySelectorAll('.btn-delete-post').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm('Are you sure you want to remove this Instagram post from the slider?')) {
            posts = posts.filter(p => p.id !== id);
            await service.saveInstagramFeed(posts);
            window.MB_ADMIN_SHELL?.showToast('Post removed successfully', 'info');
            renderView();
          }
        });
      });

      // Modal management
      const modal = container.querySelector('#ig-modal-overlay');
      const form = container.querySelector('#ig-post-form');
      const modalTitle = container.querySelector('#ig-modal-title');
      const closeBtn = container.querySelector('#ig-modal-close');
      const cancelBtn = container.querySelector('#ig-modal-cancel');

      function openModal(post = null) {
        if (!modal) return;
        modal.style.display = 'flex';
        if (post) {
          modalTitle.textContent = 'Edit Instagram Post';
          form.querySelector('#ig-form-id').value = post.id;
          form.querySelector('#ig-form-img').value = post.img || '';
          form.querySelector('#ig-form-url').value = post.url || '';
          form.querySelector('#ig-form-caption').value = post.caption || '';
          form.querySelector('#ig-form-likes').value = post.likes || '';
          form.querySelector('#ig-form-active').value = post.active === false ? 'false' : 'true';
        } else {
          modalTitle.textContent = 'Add Instagram Post';
          form.reset();
          form.querySelector('#ig-form-id').value = '';
          form.querySelector('#ig-form-url').value = 'https://www.instagram.com/marshbarbary/';
          form.querySelector('#ig-form-active').value = 'true';
        }
      }

      function closeModal() {
        if (modal) modal.style.display = 'none';
      }

      container.querySelector('#btn-add-ig')?.addEventListener('click', () => openModal());
      closeBtn?.addEventListener('click', closeModal);
      cancelBtn?.addEventListener('click', closeModal);

      container.querySelectorAll('.btn-edit-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const post = posts.find(p => p.id === id);
          if (post) openModal(post);
        });
      });

      // Form Submit
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = form.querySelector('#ig-form-id').value;
        const img = form.querySelector('#ig-form-img').value.trim();
        const url = form.querySelector('#ig-form-url').value.trim();
        const caption = form.querySelector('#ig-form-caption').value.trim();
        const likes = form.querySelector('#ig-form-likes').value.trim() || '350';
        const active = form.querySelector('#ig-form-active').value === 'true';

        if (id) {
          // Edit existing
          const post = posts.find(p => p.id === id);
          if (post) {
            post.img = img;
            post.url = url;
            post.caption = caption;
            post.likes = likes;
            post.active = active;
          }
          window.MB_ADMIN_SHELL?.showToast('Instagram post updated', 'success');
        } else {
          // Add new
          const newId = 'ig-' + Date.now();
          posts.unshift({
            id: newId,
            img,
            url,
            caption,
            likes,
            active
          });
          window.MB_ADMIN_SHELL?.showToast('New Instagram post added to slider', 'success');
        }

        await service.saveInstagramFeed(posts);
        closeModal();
        renderView();
      });

      // Reset to default
      container.querySelector('#btn-reset-ig')?.addEventListener('click', async () => {
        if (confirm('Reset to the 8 official curated posts from @marshbarbary?')) {
          posts = JSON.parse(JSON.stringify(window.MB_ADMIN_MODELS?.seedInstagramFeed || []));
          await service.saveInstagramFeed(posts);
          window.MB_ADMIN_SHELL?.showToast('Reset to official @marshbarbary posts', 'info');
          renderView();
        }
      });
    }

    renderView();
  }
};
