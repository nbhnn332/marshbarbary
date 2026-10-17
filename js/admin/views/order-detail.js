/**
 * MARSH BARBARY — ADMIN VIEW: ORDER DETAIL (js/admin/views/order-detail.js)
 * Clean, simplified order detail view with:
 * 1. Prominent top summary strip (Order ID, Customer, Order Status, Payment Status, Total)
 * 2. Step action buttons (Process Order, Mark Shipped, Mark Delivered, Cancel Order, Print Bill)
 * 3. Simplified organized fulfillment, items, customer, and payment cards
 * 4. Dedicated universal printable bill / tax invoice (#admin-print-bill-container)
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS['order-detail'] = {
  title: 'Order Details',

  async render(container, params = {}) {
    const service = window.MB_ADMIN_SERVICE;
    const orderNumber = params.id;
    const order = await service.getOrderById(orderNumber);

    if (!order) {
      container.innerHTML = `
        <div class="admin-card" style="padding: 48px; text-align: center;">
          <div style="font-family: var(--admin-font-serif, 'Cormorant Garamond', serif); font-size: 22px; color: var(--admin-text-primary); margin-bottom: 8px;">Order Not Found</div>
          <div style="color: var(--admin-text-muted); margin-bottom: 16px;">We could not locate order reference: ${orderNumber}</div>
          <a href="#/orders" class="admin-btn admin-btn-outline admin-btn-sm">Return to Orders</a>
        </div>
      `;
      return;
    }

    // Determine next step action based on current status
    let nextStepLabel = '';
    let nextStepAction = '';
    let canCancel = order.status !== 'CANCELLED' && order.status !== 'DELIVERED';

    if (order.status === 'UNSHIPPED' || order.status === 'PENDING') {
      nextStepLabel = 'Process Order';
      nextStepAction = 'PROCESSING';
    } else if (order.status === 'PROCESSING') {
      nextStepLabel = 'Mark as Shipped';
      nextStepAction = 'SHIPPED';
    } else if (order.status === 'SHIPPED') {
      nextStepLabel = 'Mark as Delivered';
      nextStepAction = 'DELIVERED';
    }

    const subtotal = order.subtotal || order.total || 0;
    const shipping = order.shippingCost === 0 ? 'Complimentary' : `₹${order.shippingCost || 0}`;
    const discount = order.discount || 0;
    const total = order.total || 0;
    const taxAmount = Math.round(total * 0.12 / 1.12);

    container.innerHTML = `
      <div id="admin-view-inner">
        <!-- Breadcrumb & Top Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div>
            <a href="#/orders" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--admin-text-muted); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              ← Back to Orders
            </a>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${nextStepLabel ? `
              <button id="btn-next-step" class="admin-btn admin-btn-primary admin-btn-sm" data-next-status="${nextStepAction}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                ${nextStepLabel}
              </button>
            ` : (order.status === 'DELIVERED' ? `
              <span class="admin-badge admin-badge-success" style="padding: 6px 12px;">Order Completed</span>
            ` : '')}

            <button id="btn-print-bill" class="admin-btn admin-btn-secondary admin-btn-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print Bill
            </button>

            ${canCancel ? `
              <button id="btn-cancel-order" class="admin-btn admin-btn-danger admin-btn-sm">
                Cancel Order
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 1. INSTANT SUMMARY STRIP -->
        <div class="admin-card" style="padding: 16px 20px; margin-bottom: 20px; background-color: var(--admin-bg-surface); border: 1px solid var(--admin-border-subtle); border-radius: var(--admin-radius-md);">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; align-items: center;">
            <div>
              <div style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--admin-text-muted); margin-bottom: 4px;">Order ID</div>
              <div style="font-family: var(--admin-font-serif, 'Cormorant Garamond', serif); font-size: 20px; font-weight: 600; color: var(--admin-text-primary);">
                #${order.orderNumber}
              </div>
            </div>

            <div>
              <div style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--admin-text-muted); margin-bottom: 4px;">Customer</div>
              <div style="font-size: 13.5px; font-weight: 600; color: var(--admin-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${order.customer.name}
              </div>
            </div>

            <div>
              <div style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--admin-text-muted); margin-bottom: 4px;">Order Status</div>
              <div>
                <span class="admin-badge ${
                  order.status === 'DELIVERED' ? 'admin-badge-success' :
                  order.status === 'SHIPPED' ? 'admin-badge-info' :
                  order.status === 'PROCESSING' ? 'admin-badge-warning' :
                  order.status === 'CANCELLED' ? 'admin-badge-danger' : 'admin-badge-neutral'
                }">
                  ${order.status}
                </span>
              </div>
            </div>

            <div>
              <div style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--admin-text-muted); margin-bottom: 4px;">Payment Status</div>
              <div>
                <span class="admin-badge ${order.paymentStatus === 'PAID' ? 'admin-badge-success' : 'admin-badge-warning'}">
                  ${order.paymentStatus}
                </span>
              </div>
            </div>

            <div style="text-align: right;">
              <div style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--admin-text-muted); margin-bottom: 4px;">Order Total</div>
              <div style="font-family: var(--admin-font-serif, 'Cormorant Garamond', serif); font-size: 22px; font-weight: 600; color: var(--admin-text-primary);">
                ₹${total.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        <!-- 2. ORGANIZED SECTIONS (2 Column Grid) -->
        <div class="admin-grid admin-grid-3">
          <!-- Left 2 Cols: Items & Fulfillment -->
          <div style="grid-column: span 2; display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Items in Order Card -->
            <div class="admin-card">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 14px; color: var(--admin-text-primary); display: flex; justify-content: space-between; align-items: center;">
                <span>Garments in Order (${(order.items || []).length})</span>
                <span style="font-size: 12px; font-weight: normal; color: var(--admin-text-muted);">Placed on ${order.date}</span>
              </div>

              <div class="admin-table-container">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th style="width: 48px;">Visual</th>
                      <th>Garment & Spec</th>
                      <th>Unit Price</th>
                      <th style="text-align: center;">Qty</th>
                      <th style="text-align: right;">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(order.items || []).map(item => `
                      <tr>
                        <td>
                          <img src="${window.MB_IMAGE_SOURCE ? window.MB_IMAGE_SOURCE.resolveDisplayUrl(item.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85') : (item.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85')}" alt="" style="width: 42px; height: 54px; object-fit: cover; border-radius: 2px; border: 1px solid var(--admin-border-subtle); background: #fdfdfd;" onerror="this.src='https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85';">
                        </td>
                        <td>
                          <div style="font-weight: 500; color: var(--admin-text-primary);">${item.title}</div>
                          <div style="font-size: 11px; color: var(--admin-text-muted);">
                            SKU: <strong>${item.sku || 'MB-DR-01'}</strong> | Size: <strong>${item.size || 'M'}</strong> | Color: <strong>${item.color || 'Natural'}</strong>
                          </div>
                        </td>
                        <td>₹${(item.price || 0).toLocaleString('en-IN')}</td>
                        <td style="text-align: center; font-weight: 500;">${item.quantity || 1}</td>
                        <td style="text-align: right; font-weight: 600;">
                          ₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Calculation Breakdown -->
              <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--admin-border-subtle); display: flex; justify-content: flex-end;">
                <div style="width: 280px; display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                  <div style="display: flex; justify-content: space-between; color: var(--admin-text-secondary);">
                    <span>Subtotal:</span>
                    <span>₹${subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: var(--admin-text-secondary);">
                    <span>Shipping & Handling:</span>
                    <span>${shipping}</span>
                  </div>
                  ${discount ? `
                    <div style="display: flex; justify-content: space-between; color: var(--admin-status-danger-text, #9C382A);">
                      <span>Applied Discount:</span>
                      <span>-₹${discount.toLocaleString('en-IN')}</span>
                    </div>
                  ` : ''}
                  <div style="display: flex; justify-content: space-between; color: var(--admin-text-muted); font-size: 11.5px;">
                    <span>Taxes (12% Apparel GST Included):</span>
                    <span>₹${taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 600; color: var(--admin-text-primary); padding-top: 8px; border-top: 1px dashed var(--admin-border-subtle);">
                    <span>Grand Total:</span>
                    <span>₹${total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fulfillment Workflow & Tracking Form -->
            <div class="admin-card">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 14px; color: var(--admin-text-primary);">
                Fulfillment Management & Tracking
              </div>

              <form id="fulfillment-form">
                <div class="admin-grid admin-grid-3">
                  <div class="admin-form-group">
                    <label class="admin-label" for="ful-status">Order Status</label>
                    <select id="ful-status" class="admin-select">
                      <option value="UNSHIPPED" ${order.status === 'UNSHIPPED' ? 'selected' : ''}>Unshipped (Pending)</option>
                      <option value="PROCESSING" ${order.status === 'PROCESSING' ? 'selected' : ''}>Processing (Packaging)</option>
                      <option value="SHIPPED" ${order.status === 'SHIPPED' ? 'selected' : ''}>Shipped (In Transit)</option>
                      <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
                      <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                    </select>
                  </div>

                  <div class="admin-form-group">
                    <label class="admin-label" for="ful-carrier">Logistics Carrier</label>
                    <input type="text" id="ful-carrier" class="admin-input" placeholder="e.g. Blue Dart, Delhivery" value="${order.trackingCarrier || 'Blue Dart Express'}">
                  </div>

                  <div class="admin-form-group">
                    <label class="admin-label" for="ful-tracking">AWB / Tracking Number</label>
                    <input type="text" id="ful-tracking" class="admin-input" placeholder="e.g. BD982138947IN" value="${order.trackingNumber || ''}">
                  </div>
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="ful-note">Internal Status Update Note</label>
                  <input type="text" id="ful-note" class="admin-input" placeholder="e.g. Dispatched via premium surface courier">
                </div>

                <button type="submit" class="admin-btn admin-btn-primary admin-btn-sm">
                  Save Fulfillment Update
                </button>
              </form>
            </div>

            <!-- Timeline Card -->
            <div class="admin-card">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 14px; color: var(--admin-text-primary);">
                Fulfillment Activity Timeline
              </div>

              <div style="display: flex; flex-direction: column; gap: 14px; padding-left: 6px;">
                ${(order.timeline || [
                  { time: order.date, status: 'ORDER_PLACED', note: 'Customer successfully placed order through online checkout.' }
                ]).map((t) => `
                  <div style="display: flex; gap: 12px; position: relative;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--admin-accent-terracotta, #B47154); margin-top: 5px; flex-shrink: 0;"></div>
                    <div style="flex: 1;">
                      <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <span style="font-weight: 600; font-size: 12px; color: var(--admin-text-primary);">${t.status}</span>
                        <span style="font-size: 11px; color: var(--admin-text-muted);">${t.time}</span>
                      </div>
                      <div style="font-size: 12px; color: var(--admin-text-secondary); margin-top: 2px;">${t.note}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>

          <!-- Right 1 Col: Customer, Shipping, Payment, Notes -->
          <div style="display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Customer Profile -->
            <div class="admin-card">
              <div style="font-weight: 600; font-size: 13.5px; margin-bottom: 12px; color: var(--admin-text-primary);">
                Customer Information
              </div>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div class="admin-user-avatar" style="width: 36px; height: 36px; font-size: 13px;">
                  ${order.customer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 13px; color: var(--admin-text-primary);">${order.customer.name}</div>
                  <div style="font-size: 11px; color: var(--admin-text-muted);">${order.customer.email}</div>
                </div>
              </div>
              <div style="font-size: 12px; color: var(--admin-text-secondary); line-height: 1.6;">
                <div><strong>Phone:</strong> ${order.customer.phone || '+91 98765 43210'}</div>
                <div><strong>Account:</strong> Registered Client</div>
              </div>
            </div>

            <!-- Shipping Destination -->
            <div class="admin-card">
              <div style="font-weight: 600; font-size: 13.5px; margin-bottom: 12px; color: var(--admin-text-primary);">
                Shipping Destination
              </div>
              <div style="font-size: 12px; color: var(--admin-text-secondary); line-height: 1.6;">
                <div style="font-weight: 600; color: var(--admin-text-primary);">${order.shippingAddress?.fullName || order.customer.name}</div>
                <div>${order.shippingAddress?.addressLine1 || '14 Atelier Lane, Fort'}</div>
                ${order.shippingAddress?.addressLine2 ? `<div>${order.shippingAddress.addressLine2}</div>` : ''}
                <div>${order.shippingAddress?.city || 'Mumbai'}, ${order.shippingAddress?.state || 'Maharashtra'} - ${order.shippingAddress?.pincode || '400001'}</div>
                <div>${order.shippingAddress?.country || 'India'}</div>
              </div>
            </div>

            <!-- Payment Information -->
            <div class="admin-card">
              <div style="font-weight: 600; font-size: 13.5px; margin-bottom: 12px; color: var(--admin-text-primary);">
                Payment Details
              </div>
              <div style="font-size: 12px; color: var(--admin-text-secondary); line-height: 1.6;">
                <div><strong>Payment Method:</strong> ${order.paymentMethod || 'Razorpay Gateway'}</div>
                <div><strong>Reference ID:</strong> <span style="font-family: monospace; font-size: 11.5px;">${order.paymentId || 'pay_MB982138402'}</span></div>
                <div><strong>Payment Status:</strong> <span class="admin-badge ${order.paymentStatus === 'PAID' ? 'admin-badge-success' : 'admin-badge-warning'}">${order.paymentStatus}</span></div>
                <div><strong>Amount Captured:</strong> ₹${total.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <!-- Internal Staff Note -->
            <div class="admin-card">
              <div style="font-weight: 600; font-size: 13.5px; margin-bottom: 12px; color: var(--admin-text-primary);">
                Add Staff Note
              </div>
              <form id="note-form">
                <div class="admin-form-group">
                  <textarea id="internal-note-input" class="admin-textarea" rows="2" placeholder="e.g. VIP client requested bespoke packaging..."></textarea>
                </div>
                <button type="submit" class="admin-btn admin-btn-outline admin-btn-sm" style="width: 100%; justify-content: center;">
                  Save Note
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>

      <!-- 3. UNIVERSAL PRACTICAL PRINTABLE BILL / INVOICE -->
      <!-- Strictly styled for A4, A5, and thermal receipt billing printers via @media print -->
      <div id="admin-print-bill-container">
        <div class="print-bill-sheet">
          
          <!-- Bill Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 2px solid #222222; padding-bottom: 12px;">
            <div style="display: flex; gap: 14px; align-items: center;">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 40'%3E%3Ctext x='50%25' y='28' text-anchor='middle' font-family='Cinzel, serif' font-size='22' font-weight='600' letter-spacing='0.22em' fill='%2326201D'%3EMARSH BARBARY%3C/text%3E%3C/svg%3E" alt="MARSH BARBARY" style="height: 38px; width: auto; max-width: 180px; object-fit: contain;">
              <div style="border-left: 1px solid #D5D0C8; padding-left: 14px;">
                <div style="font-size: 13pt; font-weight: 700; letter-spacing: 0.12em; font-family: 'Cormorant Garamond', Georgia, serif; text-transform: uppercase;">
                  MARSH BARBARY
                </div>
                <div style="font-size: 8pt; color: #555555; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 1px;">
                  Sustainable Luxury &amp; Modest Atelier
                </div>
                <div style="font-size: 7.5pt; color: #555555; margin-top: 3px; line-height: 1.35;">
                  14 Atelier Lane, Kala Ghoda, Fort, Mumbai, MH 400001<br>
                  GSTIN: <strong>27AABCM8821K1ZM</strong> | CIN: U74999MH2024PTC189201<br>
                  Email: concierge@marshbarbary.com | Web: www.marshbarbary.com
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 14pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">
                TAX INVOICE
              </div>
              <div style="font-size: 9.5pt; font-weight: 600; margin-top: 4px;">
                Order #${order.orderNumber}
              </div>
              <div style="font-size: 8.5pt; color: #555555; margin-top: 2px;">
                Invoice Date: ${order.date}
              </div>
              <div style="font-size: 8.5pt; color: #555555; margin-top: 2px;">
                Time: 14:30:18 IST
              </div>
            </div>
          </div>

          <!-- Customer & Shipping Block -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px; font-size: 8.5pt; line-height: 1.5;">
            <div>
              <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; border-bottom: 1px solid #D5D0C8; padding-bottom: 2px;">
                Billed To (Client):
              </div>
              <div style="font-weight: 600;">${order.customer.name}</div>
              <div>Email: ${order.customer.email}</div>
              <div>Phone: ${order.customer.phone || '+91 98765 43210'}</div>
            </div>
            <div>
              <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; border-bottom: 1px solid #D5D0C8; padding-bottom: 2px;">
                Ship To (Delivery Address):
              </div>
              <div style="font-weight: 600;">${order.shippingAddress?.fullName || order.customer.name}</div>
              <div>${order.shippingAddress?.addressLine1 || '14 Atelier Lane, Fort'}</div>
              ${order.shippingAddress?.addressLine2 ? `<div>${order.shippingAddress.addressLine2}</div>` : ''}
              <div>${order.shippingAddress?.city || 'Mumbai'}, ${order.shippingAddress?.state || 'Maharashtra'} - ${order.shippingAddress?.pincode || '400001'}</div>
              <div>Country: India</div>
            </div>
          </div>

          <!-- Payment Details Strip -->
          <div style="background-color: #F8F7F4; border: 1px solid #E2DFD8; padding: 6px 10px; margin-bottom: 12px; font-size: 8.5pt; display: flex; justify-content: space-between;">
            <div><strong>Payment Mode:</strong> ${order.paymentMethod || 'Razorpay Gateway (UPI/Cards)'}</div>
            <div><strong>Transaction Ref:</strong> ${order.paymentId || 'pay_MB982138402'}</div>
            <div><strong>Status:</strong> ${order.paymentStatus} (Captured)</div>
          </div>

          <!-- Itemized Table -->
          <table class="print-bill-table" style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 8.5pt;">
            <thead>
              <tr style="background: #F8F7F4; border-top: 1.5px solid #222222; border-bottom: 1.5px solid #222222;">
                <th style="padding: 6px 8px; text-align: left; width: 30px;">#</th>
                <th style="padding: 6px 8px; text-align: left;">Garment Description</th>
                <th style="padding: 6px 8px; text-align: left; width: 90px;">SKU</th>
                <th style="padding: 6px 8px; text-align: center; width: 70px;">Size / Color</th>
                <th style="padding: 6px 8px; text-align: center; width: 45px;">Qty</th>
                <th style="padding: 6px 8px; text-align: right; width: 85px;">Unit Price (₹)</th>
                <th style="padding: 6px 8px; text-align: right; width: 95px;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item, idx) => `
                <tr style="border-bottom: 1px solid #D5D0C8;">
                  <td style="padding: 6px 8px; vertical-align: top;">${idx + 1}</td>
                  <td style="padding: 6px 8px; vertical-align: top;">
                    <strong>${item.title}</strong>
                  </td>
                  <td style="padding: 6px 8px; vertical-align: top; font-family: monospace;">${item.sku || 'MB-DR-01'}</td>
                  <td style="padding: 6px 8px; text-align: center; vertical-align: top;">${item.size || 'M'} / ${item.color || 'Natural'}</td>
                  <td style="padding: 6px 8px; text-align: center; vertical-align: top;">${item.quantity || 1}</td>
                  <td style="padding: 6px 8px; text-align: right; vertical-align: top;">₹${(item.price || 0).toLocaleString('en-IN')}</td>
                  <td style="padding: 6px 8px; text-align: right; vertical-align: top; font-weight: 600;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Financial Calculation Box -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
            <div style="width: 280px; font-size: 8.5pt; line-height: 1.6;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2DFD8; padding: 3px 0;">
                <span>Subtotal (Items):</span>
                <span>₹${subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2DFD8; padding: 3px 0;">
                <span>Shipping & Delivery:</span>
                <span>${shipping}</span>
              </div>
              ${discount ? `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2DFD8; padding: 3px 0; color: #9C382A;">
                  <span>Promotional Discount:</span>
                  <span>-₹${discount.toLocaleString('en-IN')}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2DFD8; padding: 3px 0; color: #555555;">
                <span>Integrated GST (12%):</span>
                <span>₹${taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 11pt; font-weight: 700; border-top: 1.5px solid #222222; border-bottom: 2px solid #222222; margin-top: 4px;">
                <span>Grand Total Paid:</span>
                <span>₹${total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <!-- Invoice Footer & Policy -->
          <div style="border-top: 1px solid #D5D0C8; padding-top: 10px; font-size: 7.5pt; color: #555555; text-align: center; line-height: 1.5;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #222222;">
              Thank you for curating your wardrobe with MARSH BARBARY.
            </p>
            <p style="margin: 0 0 4px 0;">
              Returns & exchanges are accepted within 7 days of delivery in pristine, unworn condition with all atelier seals intact.
            </p>
            <p style="margin: 0;">
              This is a computer-generated tax invoice and requires no physical signature. Questions? Contact concierge@marshbarbary.com.
            </p>
          </div>

        </div>
      </div>
    `;

    // Event Handlers:

    // 1. Primary Step Action (Process / Ship / Deliver)
    container.querySelector('#btn-next-step')?.addEventListener('click', async (e) => {
      const nextStatus = e.currentTarget.dataset.nextStatus;
      if (!nextStatus) return;

      try {
        await service.updateOrderStatus(order.orderNumber, nextStatus, {
          note: `Order transitioned to ${nextStatus} via one-click status flow.`
        });
        window.MB_ADMIN_SHELL.showToast(`Order #${order.orderNumber} updated to ${nextStatus}`, 'success');
        window.MB_ADMIN_VIEWS['order-detail'].render(container, params);
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast(err.message || 'Error updating order status', 'error');
      }
    });

    // 2. Secondary Action: Print Bill
    container.querySelector('#btn-print-bill')?.addEventListener('click', () => {
      window.print();
    });

    // 3. Danger Action: Cancel Order
    container.querySelector('#btn-cancel-order')?.addEventListener('click', async () => {
      const confirmCancel = window.confirm(`Are you sure you want to cancel Order #${order.orderNumber}? This action cannot be undone.`);
      if (!confirmCancel) return;

      try {
        await service.updateOrderStatus(order.orderNumber, 'CANCELLED', {
          note: 'Order cancelled by administrative staff.'
        });
        window.MB_ADMIN_SHELL.showToast(`Order #${order.orderNumber} has been cancelled`, 'warning');
        window.MB_ADMIN_VIEWS['order-detail'].render(container, params);
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast(err.message || 'Error cancelling order', 'error');
      }
    });

    // 4. Fulfillment Form Submit
    container.querySelector('#fulfillment-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newStatus = document.getElementById('ful-status').value;
      const carrier = document.getElementById('ful-carrier').value.trim();
      const trackingNumber = document.getElementById('ful-tracking').value.trim();
      const note = document.getElementById('ful-note').value.trim();

      try {
        await service.updateOrderStatus(order.orderNumber, newStatus, {
          carrier,
          trackingNumber,
          note: note || `Fulfillment status changed to ${newStatus}`
        });
        window.MB_ADMIN_SHELL.showToast(`Order #${order.orderNumber} fulfillment updated`, 'success');
        window.MB_ADMIN_VIEWS['order-detail'].render(container, params);
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving fulfillment', 'error');
      }
    });

    // 5. Staff Note Submit
    container.querySelector('#note-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const noteText = document.getElementById('internal-note-input').value.trim();
      if (!noteText) return;

      try {
        await service.addOrderNote(order.orderNumber, noteText);
        window.MB_ADMIN_SHELL.showToast('Note logged to activity timeline', 'success');
        window.MB_ADMIN_VIEWS['order-detail'].render(container, params);
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving note', 'error');
      }
    });
  }
};
