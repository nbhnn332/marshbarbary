/**
 * MARSH BARBARY — ADMIN VIEW: ADMIN USERS & ROLES (js/admin/views/admin-users.js)
 * Clean, production-oriented access control management.
 * SUPER_ADMIN has full authority to manage credentials, roles, and granular permissions.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS['admin-users'] = {
  title: 'Admin Users & Roles',

  async render(container) {
    const service = window.MB_ADMIN_SERVICE;
    const auth = window.MB_ADMIN_AUTH;
    const currentUser = auth?.getCurrentUser();
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
    const permissionsList = window.MB_ADMIN_MODELS?.PERMISSION_DEFINITIONS || [];

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Admin Users & Access Control
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            Manage administrative credentials, assign organizational tiers, and configure capability scopes.
          </p>
        </div>
        <div>
          ${isSuperAdmin ? `
            <button id="btn-add-admin" class="admin-btn admin-btn-primary admin-btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Admin
            </button>
          ` : `
            <span class="admin-badge admin-badge-warning" style="padding: 6px 12px; font-size: 11px;">
              Read-Only: Super Admin Required
            </span>
          `}
        </div>
      </div>

      <!-- Security Notice Banner -->
      ${!isSuperAdmin ? `
        <div style="background-color: rgba(164, 93, 67, 0.08); border-left: 3px solid var(--mb-admin-accent); padding: 12px 16px; border-radius: var(--mb-radius-sm); margin-bottom: 20px; font-size: 12px; color: var(--mb-admin-text);">
          <strong>Access Restricted:</strong> You are currently authenticated with <strong>${currentUser?.role || 'STAFF'}</strong> credentials. Modifying administrative personnel, promoting roles, or altering security scopes requires <strong>SUPER_ADMIN</strong> authority.
        </div>
      ` : ''}

      <!-- Admin Directory Table -->
      <div class="admin-card">
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="admin-users-tbody">
              <tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--mb-admin-muted);">Loading admin accounts...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit Admin Modal Mount -->
      <div id="admin-user-modal-mount"></div>
    `;

    async function loadUsers() {
      const users = await service.getAdminUsers();
      const tbody = document.getElementById('admin-users-tbody');

      if (!users || !users.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 32px; color: var(--mb-admin-muted);">No administrative accounts found.</td></tr>`;
        return;
      }

      tbody.innerHTML = users.map(u => {
        const isSelf = u.id === currentUser?.id || u.email === currentUser?.email;
        const isPrimarySuperAdmin = u.email === 'superadmin@marshbarbary.com';
        const roleLabel = u.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : (u.role === 'ADMIN' ? 'STORE ADMIN' : 'STAFF');
        const roleBadgeClass = u.role === 'SUPER_ADMIN' ? 'admin-badge-warning' : (u.role === 'ADMIN' ? 'admin-badge-info' : 'admin-badge-neutral');
        const statusBadgeClass = u.status === 'active' ? 'admin-badge-success' : 'admin-badge-danger';
        const permsCount = Array.isArray(u.permissions) ? u.permissions.length : (u.role === 'SUPER_ADMIN' ? 12 : 8);

        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="admin-user-avatar" style="width: 32px; height: 32px; font-size: 11px;">
                  ${(u.name || 'Admin').split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <div style="font-weight: 500; font-size: 13px; color: var(--mb-admin-text);">
                    ${u.name} ${isSelf ? '<span style="font-size: 10px; color: var(--mb-admin-muted); font-weight: normal;">(You)</span>' : ''}
                  </div>
                  <div style="font-size: 11px; color: var(--mb-admin-muted);">
                    Created: ${u.createdAt || '2026-01-01'}
                  </div>
                </div>
              </div>
            </td>
            <td style="font-size: 13px; color: var(--mb-admin-text); font-family: monospace;">
              ${u.email}
            </td>
            <td>
              <span class="admin-badge ${roleBadgeClass}" style="letter-spacing: 0.06em;">
                ${roleLabel}
              </span>
              <div style="font-size: 10px; color: var(--mb-admin-muted); margin-top: 2px;">
                ${u.role === 'SUPER_ADMIN' ? 'Full Authority' : `${permsCount} capabilities`}
              </div>
            </td>
            <td>
              <span class="admin-badge ${statusBadgeClass}">
                ${u.status === 'active' ? 'Active' : 'Disabled'}
              </span>
            </td>
            <td style="font-size: 12px; color: var(--mb-admin-muted);">
              ${u.lastLogin || 'Never'}
            </td>
            <td style="text-align: right;">
              <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                ${isSuperAdmin ? `
                  <button class="admin-btn admin-btn-secondary admin-btn-sm btn-edit-admin" data-id="${u.id}">
                    Edit
                  </button>
                  ${!isPrimarySuperAdmin ? `
                    <button class="admin-btn ${u.status === 'active' ? 'admin-btn-danger' : 'admin-btn-success'} admin-btn-sm btn-toggle-status" data-id="${u.id}" data-name="${u.name}" data-action="${u.status === 'active' ? 'disable' : 'enable'}">
                      ${u.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  ` : ''}
                ` : `
                  <span style="font-size: 11px; color: var(--mb-admin-muted); font-style: italic;">Locked</span>
                `}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Wire edit buttons
      tbody.querySelectorAll('.btn-edit-admin').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const user = users.find(u => u.id === id);
          if (user) openAdminModal(user);
        });
      });

      // Wire toggle status buttons
      tbody.querySelectorAll('.btn-toggle-status').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const name = e.currentTarget.getAttribute('data-name');
          const action = e.currentTarget.getAttribute('data-action');

          window.MB_ADMIN_SHELL.confirmModal({
            title: `${action === 'disable' ? 'Disable' : 'Enable'} Admin: ${name}?`,
            message: `Are you sure you want to ${action} administrative access for ${name}? ${action === 'disable' ? 'They will no longer be able to log in to the operations portal.' : 'Their account access will be reinstated.'}`,
            confirmText: action === 'disable' ? 'Disable Account' : 'Enable Account',
            confirmType: action === 'disable' ? 'danger' : 'primary',
            onConfirm: async () => {
              try {
                await service.toggleAdminUserStatus(id);
                window.MB_ADMIN_SHELL.showToast(`Admin account ${name} has been ${action}d.`, 'success');
                loadUsers();
              } catch (err) {
                window.MB_ADMIN_SHELL.showToast(err.message || 'Error updating status', 'error');
              }
            }
          });
        });
      });
    }

    function openAdminModal(userData = null) {
      if (!isSuperAdmin) {
        window.MB_ADMIN_SHELL.showToast('Unauthorized: Only Super Admin can modify personnel.', 'error');
        return;
      }

      const isNew = !userData;
      const modalMount = document.getElementById('admin-user-modal-mount');
      const defaultRolePerms = window.MB_ADMIN_MODELS?.DEFAULT_ROLE_PERMISSIONS || {};

      const currentRole = userData?.role || 'ADMIN';
      const initialPerms = userData?.permissions || defaultRolePerms[currentRole] || [];

      modalMount.innerHTML = `
        <div class="admin-modal-backdrop active" id="admin-user-modal-backdrop">
          <div class="admin-modal" style="max-width: 640px; max-height: 90vh; display: flex; flex-direction: column;">
            <div class="admin-modal-header" style="flex-shrink: 0;">
              <div>
                <div class="admin-modal-title">${isNew ? 'Create New Admin User' : `Edit Admin: ${userData.name}`}</div>
                <div style="font-size: 11px; color: var(--mb-admin-muted); margin-top: 2px;">
                  Configure role tier and capability access matrix.
                </div>
              </div>
              <button class="admin-modal-close" id="btn-close-admin-modal">&times;</button>
            </div>

            <form id="admin-user-form" style="overflow-y: auto; flex: 1; padding: 0;">
              <div class="admin-modal-body" style="display: flex; flex-direction: column; gap: 16px;">
                
                <!-- Account Credentials -->
                <div class="admin-grid admin-grid-2">
                  <div class="admin-form-group">
                    <label class="admin-label" for="adm-m-name">Staff Full Name *</label>
                    <input type="text" id="adm-m-name" class="admin-input" required value="${userData?.name || ''}" placeholder="e.g. Kavya Sen">
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="adm-m-email">Work Email Address *</label>
                    <input type="email" id="adm-m-email" class="admin-input" required value="${userData?.email || ''}" placeholder="staff@marshbarbary.com">
                  </div>
                </div>

                <div class="admin-grid admin-grid-3">
                  <div class="admin-form-group">
                    <label class="admin-label" for="adm-m-role">Administrative Role *</label>
                    <select id="adm-m-role" class="admin-select">
                      <option value="SUPER_ADMIN" ${currentRole === 'SUPER_ADMIN' ? 'selected' : ''}>SUPER_ADMIN (Full Platform Authority)</option>
                      <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>ADMIN (Business & Operations Manager)</option>
                      <option value="STAFF" ${currentRole === 'STAFF' ? 'selected' : ''}>STAFF (Orders & Fulfillment Specialist)</option>
                    </select>
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="adm-m-password">
                      ${isNew ? 'Account Password *' : 'Password'}
                      ${!isNew ? '<span style="font-weight: normal; color: var(--mb-admin-muted); font-size: 10.5px;">(leave blank to keep)</span>' : ''}
                    </label>
                    <div style="position: relative;">
                      <input type="password" id="adm-m-password" class="admin-input" ${isNew ? 'required' : ''} placeholder="${isNew ? 'Enter login password' : '••••••••'}" autocomplete="new-password" style="padding-right: 36px;">
                      <button type="button" id="btn-toggle-pwd-visibility" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--mb-admin-muted); padding: 4px; display: flex; align-items: center;" title="Show/Hide Password">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="adm-m-status">Account Status</label>
                    <select id="adm-m-status" class="admin-select">
                      <option value="active" ${userData?.status !== 'disabled' ? 'selected' : ''}>Active</option>
                      <option value="disabled" ${userData?.status === 'disabled' ? 'selected' : ''}>Disabled</option>
                    </select>
                  </div>
                </div>

                <!-- Clean Permission Matrix Section -->
                <div style="border-top: 1px solid var(--mb-admin-border); padding-top: 16px; margin-top: 4px;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
                    <div>
                      <div style="font-weight: 600; font-size: 13px; color: var(--mb-admin-text);">Capability Access Matrix</div>
                      <div style="font-size: 11px; color: var(--mb-admin-muted);">Granular capability authorization assigned to this user</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                      <button type="button" id="btn-preset-all" class="admin-btn admin-btn-tertiary admin-btn-sm" style="font-size: 10px;">Select All</button>
                      <button type="button" id="btn-preset-reset" class="admin-btn admin-btn-tertiary admin-btn-sm" style="font-size: 10px;">Reset to Role Defaults</button>
                    </div>
                  </div>

                  <!-- 2-Column Clean Capability Grid -->
                  <div id="permission-checkboxes-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px;">
                    ${permissionsList.map(p => {
                      const isChecked = initialPerms.includes(p.id) || currentRole === 'SUPER_ADMIN';
                      return `
                        <label style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid var(--mb-admin-border); border-radius: var(--mb-radius-sm); background: var(--mb-admin-bg); cursor: pointer;">
                          <input type="checkbox" class="perm-checkbox" value="${p.id}" ${isChecked ? 'checked' : ''} style="margin-top: 2px; accent-color: var(--mb-admin-accent);">
                          <div>
                            <div style="font-weight: 500; font-size: 12px; color: var(--mb-admin-text);">${p.label}</div>
                            <div style="font-size: 10.5px; color: var(--mb-admin-muted); line-height: 1.3;">${p.description}</div>
                          </div>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>

              </div>
              <div class="admin-modal-footer" style="flex-shrink: 0;">
                <button type="button" class="admin-btn admin-btn-secondary" id="btn-cancel-admin-modal">Cancel</button>
                <button type="submit" class="admin-btn admin-btn-primary">${isNew ? 'Create Admin User' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const close = () => { modalMount.innerHTML = ''; };
      document.getElementById('btn-close-admin-modal')?.addEventListener('click', close);
      document.getElementById('btn-cancel-admin-modal')?.addEventListener('click', close);

      // Password visibility toggle
      const pwdInput = document.getElementById('adm-m-password');
      document.getElementById('btn-toggle-pwd-visibility')?.addEventListener('click', () => {
        if (!pwdInput) return;
        pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
      });

      const roleSelect = document.getElementById('adm-m-role');
      const checkboxes = modalMount.querySelectorAll('.perm-checkbox');

      // Update checkboxes when role changes
      roleSelect?.addEventListener('change', (e) => {
        const selectedRole = e.target.value;
        const defaults = defaultRolePerms[selectedRole] || [];
        checkboxes.forEach(cb => {
          if (selectedRole === 'SUPER_ADMIN') {
            cb.checked = true;
          } else {
            cb.checked = defaults.includes(cb.value);
          }
        });
      });

      // Quick presets
      document.getElementById('btn-preset-all')?.addEventListener('click', () => {
        checkboxes.forEach(cb => { cb.checked = true; });
      });

      document.getElementById('btn-preset-reset')?.addEventListener('click', () => {
        const selectedRole = roleSelect.value;
        const defaults = defaultRolePerms[selectedRole] || [];
        checkboxes.forEach(cb => {
          cb.checked = selectedRole === 'SUPER_ADMIN' ? true : defaults.includes(cb.value);
        });
      });

      // Save form
      document.getElementById('admin-user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectedPerms = [];
        modalMount.querySelectorAll('.perm-checkbox:checked').forEach(cb => {
          selectedPerms.push(cb.value);
        });

        const passVal = document.getElementById('adm-m-password')?.value.trim();

        const payload = {
          id: userData?.id || `adm-${Date.now()}`,
          name: document.getElementById('adm-m-name').value.trim(),
          email: document.getElementById('adm-m-email').value.trim().toLowerCase(),
          role: roleSelect.value,
          status: document.getElementById('adm-m-status').value,
          permissions: roleSelect.value === 'SUPER_ADMIN' ? permissionsList.map(p => p.id) : selectedPerms
        };

        if (passVal) {
          payload.password = passVal;
        } else if (userData?.password) {
          payload.password = userData.password;
        } else if (isNew) {
          payload.password = 'admin123';
        }

        try {
          await service.saveAdminUser(payload);
          window.MB_ADMIN_SHELL.showToast(`Admin user "${payload.name}" saved successfully.`, 'success');
          close();
          loadUsers();
        } catch (err) {
          window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving admin user', 'error');
        }
      });
    }

    document.getElementById('btn-add-admin')?.addEventListener('click', () => openAdminModal());

    await loadUsers();
  }
};
