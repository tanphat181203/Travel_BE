export const generateInvoiceTemplate = (
  invoice,
  booking,
  tour,
  user,
  seller
) => {
  const details =
    typeof invoice.details === 'string'
      ? JSON.parse(invoice.details)
      : invoice.details || {};

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    const dateFormatted = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return `${timeString} ${dateFormatted}`;
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) {
      return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Hóa đơn - ${invoice.invoice_id}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');

        :root {
          --primary-color: #1e3a8a;
          --secondary-color: #3b82f6;
          --accent-color: #f59e0b;
          --light-color: #f1f5f9;
          --dark-color: #0f172a;
          --text-color: #334155;
          --border-color: #e2e8f0;
          --success-color: #10b981;
          --danger-color: #ef4444;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Montserrat', 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          color: var(--text-color);
          font-size: 14px;
          line-height: 1.6;
          background-color: #fff;
        }

        /* Container */
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background-color: #fff;
          position: relative;
        }

        /* Background Elements */
        .bg-element {
          position: absolute;
          z-index: -1;
        }

        .bg-element-1 {
          top: 0;
          right: 0;
          width: 200px;
          height: 200px;
          background-color: var(--light-color);
          opacity: 0.5;
          border-bottom-left-radius: 100%;
        }

        .bg-element-2 {
          bottom: 0;
          left: 0;
          width: 150px;
          height: 150px;
          background-color: var(--light-color);
          opacity: 0.5;
          border-top-right-radius: 100%;
        }

        /* Invoice Header */
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          position: relative;
        }

        .invoice-header::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
        }

        /* Company Info */
        .company-info {
          flex: 1;
        }

        .company-logo {
          margin-bottom: 5px;
        }

        .company-logo img {
          max-width: 150px;
          max-height: 60px;
          object-fit: contain;
        }

        .company-info h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 10px;
        }

        .company-info p {
          margin: 4px 0;
          color: var(--text-color);
          font-size: 13px;
        }

        /* Invoice Details */
        .invoice-info {
          text-align: right;
          min-width: 220px;
          padding: 20px;
          background-color: var(--light-color);
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .invoice-info h2 {
          font-size: 22px;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .invoice-info p {
          margin: 8px 0;
          font-size: 13px;
        }

        .invoice-info strong {
          font-weight: 600;
          color: var(--dark-color);
        }

        .status {
          display: inline-block;
          padding: 6px 12px;
          background-color: var(--success-color);
          color: white;
          border-radius: 20px;
          font-weight: 500;
          font-size: 12px;
          margin-top: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Customer and Tour Info */
        .customer-info {
          display: flex;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 40px;
        }

        .billing-info, .tour-info {
          flex: 1;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          background-color: #fff;
          border: 1px solid var(--border-color);
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--secondary-color);
          position: relative;
        }

        .section-title::before {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 50px;
          height: 2px;
          background-color: var(--accent-color);
        }

        .billing-info p, .tour-info p {
          margin: 8px 0;
          display: flex;
          justify-content: space-between;
          text-align: justify;
        }

        .billing-info strong, .tour-info strong {
          font-weight: 600;
          color: var(--dark-color);
          min-width: 120px;
          display: inline-block;
        }

        .billing-info span, .tour-info span {
          flex: 1;
          text-align: right;
        }

        /* Table Styles */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          overflow: hidden;
        }

        th, td {
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        th {
          background-color: var(--primary-color);
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
        }

        tr:nth-child(even) {
          background-color: var(--light-color);
        }

        tr:last-child td {
          border-bottom: none;
        }

        .text-right {
          text-align: right;
        }

        .total-row {
          background-color: var(--dark-color) !important;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        /* Payment Information */
        .payment-info {
          margin-bottom: 40px;
          padding: 20px;
          border-radius: 8px;
          background-color: var(--light-color);
          border-left: 4px solid var(--secondary-color);
        }

        .payment-info p {
          margin: 10px 0;
          display: flex;
          align-items: center;
        }

        .payment-info strong {
          min-width: 200px;
          font-weight: 600;
          color: var(--dark-color);
        }

        /* Print Optimization */
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .invoice-container {
            padding: 20px;
            box-shadow: none;
          }

          .bg-element {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Background Elements -->
        <div class="bg-element bg-element-1"></div>
        <div class="bg-element bg-element-2"></div>

        <!-- Invoice Header -->
        <div class="invoice-header">
          <div class="company-info">
            ${
              seller.avatar_url
                ? `<div class="company-logo"><img src="${seller.avatar_url}" alt="${seller.name} Logo" /></div>`
                : ''
            }
            <h1>${seller.name || 'TRAVEL TOUR'}</h1>
            <p>${seller.address || 'Việt Nam'}</p>
            <p>Email: ${seller.email}</p>
            <p>Điện thoại: ${seller.phone_number || 'N/A'}</p>
          </div>

          <div class="invoice-info">
            <h2>Hóa Đơn</h2>
            <p><strong>Mã hóa đơn:</strong> #${invoice.invoice_id}</p>
            <p><strong>Ngày phát hành:</strong> ${formatDate(
              invoice.date_issued
            )}</p>
            <div class="status">Đã thanh toán</div>
          </div>
        </div>

        <!-- Customer and Tour Info -->
        <div class="customer-info">
          <div class="billing-info">
            <div class="section-title">Thông Tin Khách Hàng</div>
            <p><strong>Họ và tên:</strong> <span>${user.name}</span></p>
            <p><strong>Email:</strong> <span>${user.email}</span></p>
            <p><strong>Điện thoại:</strong> <span>${
              user.phone_number || 'N/A'
            }</span></p>
            <p><strong>Địa chỉ:</strong> <span>${
              user.address || 'N/A'
            }</span></p>
          </div>

          <div class="tour-info">
            <div class="section-title">Thông Tin Tour</div>
            <p><strong>Tên Tour:</strong></p>
            <p style="padding: 0px; margin: 0px;">${tour.title}</p>
            <p><strong>Ngày khởi hành:</strong> <span>${formatDate(
              booking.start_date
            ).slice(6)}</span></p>
            <p><strong>Điểm khởi hành:</strong> <span>${
              tour.departure_location
            }</span></p>
            <p><strong>Thời gian:</strong> <span>${tour.duration}</span></p>
          </div>
        </div>

        <!-- Booking Details -->
        <div class="section-title">Chi Tiết Đặt Tour</div>
        <table>
          <thead>
            <tr>
              <th>Mô tả</th>
              <th>Số lượng</th>
              <th>Đơn giá</th>
              <th class="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${
              booking.num_adults > 0
                ? `
            <tr>
              <td>Người lớn</td>
              <td>${booking.num_adults}</td>
              <td>${formatCurrency(parseFloat(booking.price_adult))}</td>
              <td class="text-right">${formatCurrency(
                booking.num_adults * parseFloat(booking.price_adult)
              )}</td>
            </tr>
            `
                : ''
            }
            ${
              booking.num_children_120_140 > 0
                ? `
            <tr>
              <td>Trẻ em (120-140cm)</td>
              <td>${booking.num_children_120_140}</td>
              <td>${formatCurrency(
                parseFloat(booking.price_child_120_140)
              )}</td>
              <td class="text-right">${formatCurrency(
                booking.num_children_120_140 *
                  parseFloat(booking.price_child_120_140)
              )}</td>
            </tr>
            `
                : ''
            }
            ${
              booking.num_children_100_120 > 0
                ? `
            <tr>
              <td>Trẻ em (100-120cm)</td>
              <td>${booking.num_children_100_120}</td>
              <td>${formatCurrency(
                parseFloat(booking.price_child_100_120)
              )}</td>
              <td class="text-right">${formatCurrency(
                booking.num_children_100_120 *
                  parseFloat(booking.price_child_100_120)
              )}</td>
            </tr>
            `
                : ''
            }
            ${
              details.original_price &&
              details.discount &&
              parseFloat(details.discount) > 0
                ? `
            <tr>
              <td colspan="3" class="text-right">Tạm tính:</td>
              <td class="text-right">${formatCurrency(
                parseFloat(details.original_price)
              )}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-right">Giảm giá:</td>
              <td class="text-right">- ${formatCurrency(
                parseFloat(details.discount)
              )}</td>
            </tr>
            `
                : ''
            }
            <tr class="total-row">
              <td colspan="3" class="text-right">Tổng cộng:</td>
              <td class="text-right">${formatCurrency(
                parseFloat(invoice.amount_due)
              )}</td>
            </tr>
          </tbody>
        </table>

        ${
          details.promotion_id &&
          details.discount &&
          parseFloat(details.discount) > 0
            ? `
        <!-- Promotion Information -->
        <div class="payment-info" style="border-left: 4px solid var(--accent-color); margin-bottom: 20px;">
          <div class="section-title">Thông Tin Khuyến Mãi</div>
          <p><strong>Mã khuyến mãi:</strong> #${details.promotion_id}</p>
          <p><strong>Giảm giá:</strong> ${formatCurrency(
            parseFloat(details.discount)
          )}</p>
        </div>
        `
            : ''
        }

        <!-- Payment Information -->
        <div class="payment-info">
          <div class="section-title">Thông Tin Thanh Toán</div>
          <p>
            <strong>Phương thức thanh toán:</strong>
            ${
              details.payment_method === 'vnpay'
                ? 'VNPay'
                : details.payment_method === 'stripe'
                ? 'Stripe'
                : 'Thanh toán trực tiếp'
            }
          </p>
          ${
            details.transaction_id
              ? `<p><strong>Mã giao dịch:</strong> ${details.transaction_id}</p>`
              : ''
          }
          <p><strong>Ngày thanh toán:</strong> ${formatDate(
            details.payment_date
          )}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
