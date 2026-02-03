
Chart.register(ChartZoom);

let list = document.querySelectorAll(".navigation li");
let currentOrder = null;
let GLOBAL_ORDERS = []
let SHOWING_DELETED = false;
let CURRENT_ADMIN_PAGE = null;


const logged = JSON.parse(localStorage.getItem("loggedAdmin"));

if (!logged) {
  window.location.href = "index.html"; 
}

applyAdminRolePermissions();
loadAdminHeaderAvatar();
const ADMIN_ROLE = logged.role;

CURRENT_ADMIN_PAGE = "dashboard";
renderDashboardPage();

const dashboardLi = document.querySelector('.navigation li[data-page="dashboard"]');
if (dashboardLi) {
  dashboardLi.classList.add("hovered");
}

function activeLink() {
  list.forEach((item) => {
    item.classList.remove("hovered");
  });
  this.classList.add("hovered");
}

list.forEach((item) => item.addEventListener("mouseover", activeLink));

// Menu Toggle
let toggle = document.querySelector(".toggle");
let navigation = document.querySelector(".navigation");
let main = document.querySelector(".main");

toggle.onclick = function () {
  navigation.classList.toggle("active");
  main.classList.toggle("active");
};

function normalizeDateForFilter(orderDate, orderTime) {

  const toEnglish = s => (s || "").replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);

  let d = toEnglish(orderDate || "").trim();
  let t = toEnglish(orderTime || "").trim();

  if (d.includes(",")) {
    const parts = d.split(",");
    d = parts[0].trim();
    t = parts[1] ? parts[1].trim() : "";
  }

  if (!d.includes("/")) return 0;

  if (!t || !t.includes(":")) t = "00:00:00";

  const timeParts = t.split(":");
  const hh = (timeParts[0] || "00").padStart(2, "0");
  const mm = (timeParts[1] || "00").padStart(2, "0");
  const ss = (timeParts[2] || "00").padStart(2, "0");

  const [y, m, day] = d.split("/");
  const dateNum = y.padStart(4, "0") + m.padStart(2, "0") + day.padStart(2, "0");

  return Number(dateNum + hh + mm + ss);
}

function switchToOrdersLayout() {
  document.querySelector(".dashboardCustomers").style.display = "none";
  document.querySelector(".details").style.gridTemplateColumns = "1fr";
}

function switchToDefaultLayout() {
  document.querySelector(".dashboardCustomers").style.display = "block";
  document.querySelector(".details").style.gridTemplateColumns = "2fr 1fr";
}

function renderOrdersPage() {

  const container = document.querySelector(".recentOrders, .recentProducts, .recentCustomers, .recentMessages, .recentTickets, .recentSettings, .recentDashboard");

  if (container) {
    container.classList.remove("recentProducts", "recentCustomers", "recentMessages", "recentTickets", "recentSettings", "recentDashboard");
    container.classList.add("recentOrders");
  }

  switchToOrdersLayout();

  const header = document.querySelector(".recentOrders .cardHeader");
  header.innerHTML = `
          <div class="header-right" style="display:flex; align-items:center; gap:10px;">
        <h2 id="orders-title">لیست سفارش‌ها</h2>

        <span id="back-to-orders"
            style="display:none; cursor:pointer; color:#F2BD12; font-weight:bold;">
           → بازگشت
        </span>
    </div>

    <div class="actions-container" style="display:flex; flex-direction:column; gap:10px;">

        <div style="display:flex; align-items:center; gap:25px; justify-content:flex-start; margin-right: 14px;">

            <div class="status-filter-box">
                <label>وضعیت:</label>
                <select id="status-filter" class="filter-input">
                    <option value="all">همه</option>
                    <option value="pending">در انتظار</option>
                    <option value="approved">تأیید شده</option>
                    <option value="canceled">رد شده</option>
                </select>
            </div>

            <button id="print-orders" class="btn print-btn">چاپ</button>
            <button id="show-deleted" class="btn deleted-btn">مشاهده حذف شده‌ها</button>
        </div>

        <div class="filter-box">
            <label>از:</label>
            <input type="text" id="filter-from" class="filter-input">

            <label>تا:</label>
            <input type="text" id="filter-to" class="filter-input">

            <button id="apply-filter" class="filter-btn">فیلتر</button>
            <button id="clear-filter" class="filter-btn danger">حذف</button>
        </div>
    </div>
`;

  persianDate.toLocale('fa');

  $("#filter-from").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    autoClose: true
  });

  $("#filter-to").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    autoClose: true
  });

  const table = document.querySelector(".recentOrders table");

  table.innerHTML = `
        <thead>
            <tr>
                <td>شماره</td>
                <td>کد پیگیری</td>
                <td>نام مشتری</td>
                <td>قیمت کل</td>
                <td>هزینه ارسال</td>
                <td>زمان سفارش</td>
                <td>زمان تحویل</td>
                <td>وضعیت</td>
            </tr>
        </thead>
        <tbody id="orders-body"></tbody>
    `;

  loadOrdersIntoTable();

  document.getElementById("show-deleted").addEventListener("click", async () => {

    document.getElementById("orders-title").style.display = "none";
    document.getElementById("show-deleted").style.display = "none";

    document.getElementById("back-to-orders").style.display = "block";
    SHOWING_DELETED = true;

    const res = await fetch(`${API_BASE}?action=admin_get_deleted_orders`);
    const data = await res.json();

    const deleted = data.orders || [];

    const tbody = document.getElementById("orders-body");
    tbody.innerHTML = "";

    deleted.forEach((order, idx) => {
      tbody.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td>${order.tracking_code}</td>
        <td>${order.customer_name || "—"}</td>
        <td>${order.total_payable?.toLocaleString('fa-IR') || "—"}</td>
        <td>${order.delivery_fee
          ? order.delivery_fee.toLocaleString('fa-IR') + " تومان"
          : "—"
        }</td>
        <td>${order.date || "—"}</td>
        <td>${order.delivery_time || "—"}</td>

        <td>
          ${getStatusLabel(order.status)}
          <span class="restore-link"
                data-id="${order.id}"
                style="
                  color:#007bff;
                  cursor:pointer;
                  margin-right:8px;
                  font-size:13px;
                  text-decoration:underline;">
            بازیابی
          </span>
        </td>
      </tr>
    `;
    });

    document.querySelectorAll(".restore-link").forEach(link => {
      link.addEventListener("click", async () => {

        const id = link.dataset.id;

        await fetch(`${API_BASE}?action=admin_restore_order`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `id=${encodeURIComponent(id)}`
        });

        document.getElementById("show-deleted").click();
      });
    });
  });

  document.getElementById("status-filter").addEventListener("change", () => {
    applyStatusFilter();
  });

  document.getElementById("back-to-orders").addEventListener("click", () => {

    document.getElementById("orders-title").style.display = "block";
    document.getElementById("show-deleted").style.display = "inline-block";

    document.getElementById("back-to-orders").style.display = "none";

    loadOrdersIntoTable();
  });

  document.getElementById("filter-from").addEventListener("input", e => {
    e.target.dataset.english = normalizePersianDate(e.target.value);
  });

  document.getElementById("filter-to").addEventListener("input", e => {
    e.target.dataset.english = normalizePersianDate(e.target.value);
  });

  document.getElementById("apply-filter").onclick = function () {

    const from = document.getElementById("filter-from").value;
    const to = document.getElementById("filter-to").value;

    filterOrdersByDate(from, to);
  };

  document.getElementById("clear-filter").onclick = function () {

    document.getElementById("filter-from").value = "";
    document.getElementById("filter-to").value = "";

    loadOrdersIntoTable();
  };

  document.getElementById("print-orders").addEventListener("click", () => {

    const from = document.getElementById("filter-from").value.trim();
    const to = document.getElementById("filter-to").value.trim();

    let dateText = "";

    if (from && to) {
      dateText = ` از ${from} تا ${to}`;
    } else {
      dateText = new Date().toLocaleDateString("fa-IR");
    }

    const printHeader = document.createElement("div");
    printHeader.id = "custom-print-header";
    printHeader.style.textAlign = "right";
    printHeader.style.marginBottom = "10px";
    printHeader.innerHTML = `
    <h1 style="margin:0 0 5px 0; font-size:20px;">رستوران فودی</h1>
    <h3 style="margin:0; font-size:16px; font-weight:normal;">${dateText}</h3>
    `;

    document.body.prepend(printHeader);

    window.print();

    setTimeout(() => {
      document.getElementById("custom-print-header")?.remove();
    }, 100);

  });
}

function clearProductModalErrors() {
  document.querySelectorAll(".pm-error").forEach(err => err.textContent = "");
}

function renderProductsPage() {
  switchToOrdersLayout();

  const container = document.querySelector(".recentOrders, .recentProducts, .recentCustomers, .recentMessages, .recentTickets, .recentSettings, .recentDashboard");
  container.classList.remove("recentOrders", "recentCustomers", "recentMessages", "recentTickets", "recentSettings", "recentDashboard");
  container.classList.add("recentProducts");

  const header = container.querySelector(".cardHeader");
  header.innerHTML = `
    <h2>لیست محصولات</h2>

    <div style="display:flex; gap:10px; align-items:center;">

        <select id="product-filter" class="filter-select">
    <option value="all">همه محصولات</option>
    <option value="active">فقط فعال‌ها</option>
    <option value="inactive">فقط غیرفعال‌ها</option>
    <option value="disabled">فقط غیرفعال دائمی</option>

    <option value="پر سفارش‌ترین ها">پر سفارش‌ترین‌ ها</option>
    <option value="همبرگر">همبرگر</option>
    <option value="پیتزا">پیتزا</option>
    <option value="سوخاری">سوخاری</option>
    <option value="ساندویچ">ساندویچ</option>

    <option value="پاستا">پاستا</option>

    <option value="غذاهای ایرانی">غذاهای ایرانی</option>

    <option value="سالاد">سالاد</option>

    <option value="نوشیدنی">نوشیدنی</option>
    <option value="متفرقه">متفرقه</option>
    </select>

    <button id="print-products" class="btn print-btn" style="margin-right:10px;">
        چاپ
    </button>

    <button id="add-new-product" class="btn new-product-btn">
            افزودن محصول جدید +
        </button>
    </div>
`;

  const table = container.querySelector("table");
  table.innerHTML = `
        <thead>
            <tr>
                <th>شماره</th>
                <th>نام محصول</th>
                <th>قیمت</th>
                <th>دسته</th>
                <th>وضعیت</th>
                <th>توضیحات</th>
            </tr>
        </thead>
        <tbody id="products-body"></tbody>
    `;

  document.getElementById("add-new-product").addEventListener("click", () => {
    clearProductModalErrors();

    document.getElementById("pm-name").value = "";
    document.getElementById("pm-price").value = "";
    document.getElementById("pm-category").value = "";
    document.getElementById("pm-desc").value = "";
    document.getElementById("product-image").src = "images/default-food.png";

    document.getElementById("product-preview-name").textContent = "";
    document.getElementById("product-preview-price").textContent = "";
    document.getElementById("product-preview-desc").textContent = "—";

    window.currentProductId = null;

    document.querySelector(".pm-update-btn").style.display = "none";
    document.querySelector(".pm-disable-btn").style.display = "none";
    document.querySelector(".pm-enable-btn").style.display = "none";
    document.querySelector(".pm-disable-permanent-btn").style.display = "none";

    document.getElementById("pm-add-btn").style.display = "block";

    document.getElementById("product-modal").style.display = "block";
  });

  fillAdminProductsTable();

  document.getElementById("product-filter").addEventListener("change", applyProductFilter);
  document.getElementById("print-products").addEventListener("click", () => {

    const today = new Date().toLocaleDateString("fa-IR");

    const printHeader = document.createElement("div");
    printHeader.id = "custom-products-header";
    printHeader.style.textAlign = "right";
    printHeader.style.marginBottom = "10px";

    printHeader.innerHTML = `
        <h1 style="margin:0 0 5px 0; font-size:20px;">رستوران فودی</h1>
        <h3 style="margin:0; font-size:16px; font-weight:normal;">${today}</h3>
    `;

    document.body.prepend(printHeader);

    document.body.classList.add("print-products");
    window.print();

    setTimeout(() => {
      printHeader.remove();
      document.body.classList.remove("print-products");
    }, 100);
  });
}

async function loadOrdersIntoTable() {
  const tbody = document.getElementById("orders-body");
  tbody.innerHTML = "";
  const res = await fetch(`${API_BASE}?action=admin_get_orders_table`);
  const data = await res.json();

  if (data.status !== "success") {
    console.warn("خطا در دریافت سفارش‌ها");
    return;
  }

  const allOrders = data.orders;

  allOrders.sort((a, b) => {
    const da = normalizePersianDateTime(a.date, a.time);
    const db = normalizePersianDateTime(b.date, b.time);
    return db.localeCompare(da);
  });

  GLOBAL_ORDERS = allOrders;

  allOrders.forEach((order, idx) => {

    tbody.innerHTML += `
      <tr data-row="${idx}">
        <td>
          <div class="row-control">
            <input type="checkbox" class="row-select" data-id="${order.id}">
            <span class="row-number">${idx + 1}</span>
            <ion-icon name="trash-outline" class="delete-icon" data-id="${order.id}" style="display:none;"></ion-icon>
          </div>
        </td>
        <td class="tracking clickable" data-index="${idx}">${order.tracking_code}</td>
        <td>${order.customer.fullName}</td>
        <td>${Number(order.total_payable).toLocaleString("fa-IR")}</td>
        <td>
          ${order.delivery_fee
        ? Number(order.delivery_fee).toLocaleString("fa-IR") + " تومان"
        : "—"
      }
        </td>
        <td>${order.date}</td>
        <td>${order.delivery_time || "—"}</td>
        <td class="status-cell">
          ${getStatusLabel(order.status)}
          ${order.status === "canceled" && order.reject_reason
        ? `<span class="reason-icon" data-index="${idx}" title="مشاهده دلیل رد">❗️</span>`
        : ""
      }
        </td>
      </tr>
    `;
  });
}

async function deleteOrderById(id) {
  const res = await fetch(`${API_BASE}?action=admin_delete_order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `id=${encodeURIComponent(id)}`
  });

  const data = await res.json();
  console.log("delete result:", data);
}

document.addEventListener("click", async function (e) {
  const target = e.target;

  // ================= Delete Icon =================
  if (target.classList.contains("delete-icon")) {
    e.stopPropagation();

    const selected = Array.from(document.querySelectorAll(".row-select:checked"));

    // حذف تکی
    if (selected.length === 0) {
      const id = target.dataset.id;
      await deleteOrderById(id);
      return;
    }

    // حذف چندتایی
    const ids = selected.map(chk => chk.dataset.id);

    for (const id of ids) {
      await deleteOrderById(id);
    }

    loadOrdersIntoTable();
  }

  if (target.classList.contains("delete-customer-icon")) {
    e.stopPropagation();

    const selected = Array.from(document.querySelectorAll(".row-select:checked[data-id]"));

    // حذف تکی
    if (selected.length === 0) {
      await deleteCustomer(target.dataset.id);
      await fillCustomersTable();
      return;
    }

    // حذف گروهی
    for (const s of selected) {
      await deleteCustomer(s.dataset.id);
    }

    await fillCustomersTable();
    return;
  }

  // ================= Tracking =================
  if (target.classList.contains("clickable")) {
    const index = target.dataset.index;
    openOrderModal(GLOBAL_ORDERS[index], index);
  }

  if (target.classList.contains("reason-icon")) {
    const index = target.dataset.index;
    const order = GLOBAL_ORDERS[index];

    if (order && order.rejectReason) {
      openRejectReasonModal(order.rejectReason);
    }
  }

  // ================= Checkbox for orders =================
  if (e.target.classList.contains("row-select") &&
    e.target.closest(".recentOrders")) {

    const tr = e.target.closest("tr");
    const icon = tr.querySelector(".delete-icon");

    if (e.target.checked) {
      tr.classList.add("selected-row");
      if (icon) icon.style.display = "inline-block";

      if (logged.role === "support" || logged.role === "products") {
        icon.style.pointerEvents = "none";
        icon.style.opacity = "0.4";
      }
    } else {
      tr.classList.remove("selected-row");
      if (icon) icon.style.display = "none";
    }
  }

  // ================= Checkbox for CUSTOMERS =================
  if (e.target.classList.contains("row-select") &&
    e.target.closest(".recentCustomers")) {

    const tr = e.target.closest("tr");
    const icon = tr.querySelector(".delete-customer-icon");

    if (e.target.checked) {
      tr.classList.add("selected-row");
      if (icon) icon.style.display = "inline-block";
    } else {
      tr.classList.remove("selected-row");
      if (icon) icon.style.display = "none";
    }
  }
});

function getStatusLabel(status) {
  if (!status || status === "") {
    return `<span class="status-badge status-pending">در انتظار</span>`;
  }

  if (status === "pending") {
    return `<span class="status-badge status-pending">در انتظار</span>`;
  }

  if (status === "approved") {
    return `<span class="status-badge status-approved">تأیید شده</span>`;
  }

  if (status === "delivered") {
    return `<span class="status-badge status-delivered">تحویل شد</span>`;
  }

  if (status === "canceled") {
    return `<span class="status-badge status-canceled">رد شده</span>`;
  }

  return `<span class="status-badge status-pending">در انتظار</span>`;
}

document.querySelectorAll(".navigation li").forEach(li => {
  li.addEventListener("click", () => {

    const page = li.dataset.page;
    CURRENT_ADMIN_PAGE = li.dataset.page;

    if (page === "logout") {
      document.getElementById("logout-modal").classList.add("active");
      return;  
    }

    if (page === "orders") {
      SHOWING_DELETED = false;
      renderOrdersPage();
      applyAdminRolePermissions();
      loadAdminAvatarToHeader();
    }

    if (page === "dashboard") {
      renderDashboardPage();
      applyAdminRolePermissions();
    }

    if (page === "products") {
      renderProductsPage();
      applyAdminRolePermissions();
    }

    if (page === "customers") {
      renderCustomersPage();
      applyAdminRolePermissions();
    }

    if (page === "messages") {
      renderMessagesPage();
      applyAdminRolePermissions();
    }

    if (page === "tickets") {
      renderTicketsPage();
      applyAdminRolePermissions();
    }

    if (page === "settings") {
      renderSettingsPage();
      applyAdminRolePermissions();
      loadAdminAvatarToHeader();
    }
  });
});

document.getElementById("logout-yes").addEventListener("click", () => {
  document.getElementById("logout-modal").classList.remove("active");
  window.location.href = "index.html";
});

document.getElementById("logout-no").addEventListener("click", () => {
  document.getElementById("logout-modal").classList.remove("active");
});

document.getElementById("admin-search-input").addEventListener("input", e => {
  const keyword = e.target.value.trim().toLowerCase();
  handleAdminSearch(keyword);
});

function openOrderModal(order, index) {
  const modal = document.getElementById("order-modal");
  currentOrder = order;

  // ---------- اطلاعات مشتری ----------
  document.getElementById("om-customer-name").textContent =
    order.customer?.fullName || "—";

  document.getElementById("om-customer-phone").textContent =
    order.customer?.phone || "—";

  // آدرس از user_addresses
  document.getElementById("om-customer-address").textContent =
    order.address_info?.full_address ||
    order.address_info?.address ||
    "—";


  // ---------- دلیل رد ----------
  if (order.status === "canceled" && order.reject_reason) {
    document.getElementById("reject-reason-box").style.display = "block";
    document.getElementById("reject-reason-text").value = order.reject_reason;
  } else {
    document.getElementById("reject-reason-box").style.display = "none";
    document.getElementById("reject-reason-text").value = "";
  }


  // ---------- اقلام سفارش ----------
  const itemsBox = document.getElementById("om-items");
  itemsBox.innerHTML = "";

  order.items.forEach(item => {
    itemsBox.innerHTML += `
      <div class="order-item-row">
        ${item.item_name} × ${item.quantity}
      </div>
    `;
  });


  // ---------- تخفیف ----------
  document.getElementById("om-discount").textContent =
    order.discount_code
      ? `${Number(order.discount_amount).toLocaleString('fa-IR')} تومان`
      : "—";


  // ---------- قیمت کل ----------
  document.getElementById("om-total").textContent =
    Number(order.total_payable).toLocaleString("fa-IR");


  // ---------- زمان تحویل ----------
  document.getElementById("om-delivery-time").value =
    order.delivery_time || "";


  // ---------- دکمه‌ها ----------
  document.getElementById("om-approve").onclick = () =>
    updateOrderStatus(order, "approved");

  document.getElementById("om-reject").onclick = () => {
    document.getElementById("reject-reason-box").style.display = "block";
  };

  // ---------- نمایش مودال ----------
  modal.classList.add("active");
}

document.getElementById("reject-save-btn").onclick = async () => {
  const reason = document.getElementById("reject-reason-text").value.trim();
  const deliveryTime = document.getElementById("om-delivery-time").value.trim();

  await fetch(`${API_BASE}?action=admin_update_order_status`, {
    method: "POST",
    body: new URLSearchParams({
      id: currentOrder.id,
      status: "canceled",
      reject_reason: reason,
      delivery_time: deliveryTime
    })
  });

  closeOrderModal();
  renderOrdersPage();
};

async function updateOrderStatus(order, newStatus) {

  const deliveryTime = document.getElementById("om-delivery-time").value.trim();

  await fetch(`${API_BASE}?action=admin_update_order_status`, {
    method: "POST",
    body: new URLSearchParams({
      id: order.id,
      status: newStatus,
      delivery_time: deliveryTime
    })
  });

  closeOrderModal();
  renderOrdersPage();
}

function closeOrderModal() {
  document.getElementById("order-modal").classList.remove("active");
}

document.getElementById("order-modal-close").addEventListener("click", closeOrderModal);

function openRejectReasonModal(reasonText) {
  document.getElementById("reason-modal-text").textContent =
    reasonText || "دلیلی ثبت نشده";

  document.getElementById("reason-modal").classList.add("active");
}

document.getElementById("reason-modal-close").onclick = function () {
  document.getElementById("reason-modal").classList.remove("active");
};

function persianDateToNumber(pDate) {
  if (!pDate) return 0;

  // تبدیل تمام ارقام فارسی به انگلیسی
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const english = "0123456789";
  pDate = pDate.replace(/[۰-۹]/g, d => english[persian.indexOf(d)]);

  let datePart = pDate.split(",")[0].trim().split(" ")[0].trim();

  let [y, m, d] = datePart.split("/");

  y = y.padStart(4, "0");
  m = m.padStart(2, "0");
  d = d.padStart(2, "0");

  return Number(`${y}${m}${d}`);
}

function filterOrdersByDate(from, to) {
  const tbody = document.getElementById("orders-body");
  tbody.innerHTML = "";

  // نرمال‌سازی ورودی‌های شمسی
  const fromNorm = normalizePersianDateTime(from, "00:00:00");
  const toNorm = normalizePersianDateTime(to, "23:59:59");

  // فیلتر بر اساس تاریخ
  const filtered = GLOBAL_ORDERS.filter(order => {
    const orderNorm = normalizePersianDateTime(
      order.date,
      order.time || "00:00:00"
    );
    return orderNorm >= fromNorm && orderNorm <= toNorm;
  });

  // نمایش ردیف‌های فیلترشده
  filtered.forEach((order, idx) => {
    tbody.innerHTML += `
      <tr data-row="${idx}">
        <td>${idx + 1}</td>

        <td class="tracking clickable" data-index="${GLOBAL_ORDERS.indexOf(order)}">
          ${order.tracking_code}
        </td>

        <td>${order.customer.fullName}</td>

        <td>${order.total_payable.toLocaleString('fa-IR')}</td>

        <td>${order.delivery_fee
        ? order.delivery_fee.toLocaleString('fa-IR') + " تومان"
        : "—"
      }</td>

        <td>${order.date}</td>

        <td>${order.delivery_time || "—"}</td>

        <td>${getStatusLabel(order.status)}</td>
      </tr>
    `;
  });
}

function toEnglishDigits(str) {
  return str.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
}

function extractDatePart(dateStr) {
  // تبدیل اعداد فارسی به انگلیسی
  let clean = toEnglishDigits(dateStr);

  // حذف کلمه‌های اضافی
  clean = clean.replace("ساعت", "").trim();

  // گرفتن فقط قسمت تاریخ
  return clean.split(" ")[0];
}

function shamsiToGregorian(str) {
  const parts = str.split("/");
  const j = new persianDate([+parts[0], +parts[1], +parts[2]]).toGregorian();
  return new Date(j);
}

function parseOrderDate(str) {
  const eng = extractDatePart(str);
  if (eng.startsWith("13") || eng.startsWith("14")) {
    return shamsiToGregorian(eng);
  }
  return new Date(eng.replace(" ", "T"));
}

function normalizePersianDateTime(dateStr, timeStr = "") {
  // جدا کردن بخش تاریخ از "تاریخ, ساعت"
  let datePart = dateStr.split(",")[0].trim();

  let timePart = dateStr.includes(",")
    ? dateStr.split(",")[1].trim()
    : (timeStr || "");

  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const english = "0123456789";

  // تبدیل ارقام فارسی به انگلیسی
  datePart = datePart.replace(/[۰-۹]/g, d => english[persian.indexOf(d)]);
  timePart = timePart.replace(/[۰-۹]/g, d => english[persian.indexOf(d)]);

  let [y, m, d] = datePart.split("/");
  if (m.length === 1) m = "0" + m;
  if (d.length === 1) d = "0" + d;
  if (!timePart) timePart = "00:00:00";

  return `${y}/${m}/${d} ${timePart}`;
}

async function fetchProducts() {
  const res = await fetch(`${API_BASE}?action=admin_get_all_products`);
  const data = await res.json();
  return data.products || [];
}

async function fillAdminProductsTable() {
  const products = await fetchProducts();
  const tbody = document.getElementById("products-body");

  tbody.innerHTML = "";

  products.forEach((p, index) => {
    tbody.innerHTML += `
      <tr data-id="${p.id}">
        <td>${index + 1}</td>
        <td>${p.name}</td>
        <td>${Number(p.price).toLocaleString("fa-IR")} تومان</td>
        <td>${p.category || "—"}</td>
        <td>
          <span class="status-pill ${p.status === "inactive"
        ? "status-inactive"
        : p.status === "disabled"
          ? "status-disabled"
          : "status-active"
      }">
            ${p.status === "inactive"
        ? "غیرفعال"
        : p.status === "disabled"
          ? "غیرفعال دائم"
          : "فعال"
      }
          </span>
        </td>
        <td>${p.description || "—"}</td>
      </tr>
    `;
  });
}

async function applyProductFilter() {
  const filter = document.getElementById("product-filter").value;
  let products = await fetchProducts();

  if (filter === "active") {
    products = products.filter(p => p.status === "active");
  }
  else if (filter === "inactive") {
    products = products.filter(p => p.status === "inactive");
  }
  else if (filter === "disabled") {
    products = products.filter(p => p.status === "disabled");
  }
  else if (filter !== "all") {
    products = products.filter(p => p.category === filter);
  }

  const tbody = document.getElementById("products-body");
  tbody.innerHTML = "";

  products.forEach((p, index) => {
    tbody.innerHTML += `
            <tr data-index="${index}" data-id="${p.id}">
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${(p.price || 0).toLocaleString("fa-IR")} تومان</td>
                <td>${p.category || "—"}</td>

                <td>
                    <span class="status-pill ${p.status === 'inactive'
        ? 'status-inactive'
        : p.status === 'disabled'
          ? 'status-disabled'
          : 'status-active'
      }">
                        ${p.status === 'inactive' ? 'غیرفعال' :
        p.status === 'disabled' ? 'غیرفعال دائم' :
          'فعال'
      }
                    </span>
                </td>

                <td>${p.desc || "—"}</td>
            </tr>
        `;
  });
}

document.addEventListener("click", async e => {
  const row = e.target.closest(".recentProducts tr");
  if (!row || !row.dataset.id) return;

  const id = Number(row.dataset.id);
  const products = await fetchProducts();
  const product = products.find(p => p.id === id);

  window.currentProductId = id;
  openProductModal(product);
});

document.addEventListener("click", async function (e) {
  if (!e.target.closest(".recentProducts")) return;

  const row = e.target.closest("tr");
  if (!row) return;

  const statusCellClicked = e.target.closest("td:nth-child(5)");
  if (!statusCellClicked) return;

  const index = row.rowIndex - 1;
  const products = await fetchProducts();
  const p = products[index];

  openProductModal(p);
});

async function openProductModal(product) {
  document.getElementById("pm-name").value = product.name;
  document.getElementById("pm-price").value = product.price;
  document.getElementById("pm-desc").value = product.description || "";
  document.getElementById("product-image").src =
    product.image || "images/default-food.png";

  //     انتخاب خودکار دسته‌بندی
  const catSelect = document.getElementById("pm-category");
  const dbCat = (product.category || "").trim();

  // توابع کمکی برای یکسان‌سازی رشته‌ها
  const normalize = str =>
    str
      .trim()
      .replace(/\s+/g, "")    
      .replace(/‌/g, "")       
      .replace(/[ي]/g, "ی")      
      .replace(/[ك]/g, "ک");  

  const dbNorm = normalize(dbCat);

  let matchedOption = null;

  [...catSelect.options].forEach(opt => {
    const optNorm = normalize(opt.value);
    if (optNorm === dbNorm) matchedOption = opt;
  });

  if (matchedOption) {
    catSelect.value = matchedOption.value;
  } else {
    catSelect.value = "";
  }

  document.getElementById("product-preview-name").textContent = product.name;
  document.getElementById("product-preview-price").textContent =
    Number(product.price).toLocaleString("fa-IR") + " تومان";
  document.getElementById("product-preview-desc").textContent =
    product.description || "—";

  window.currentProductId = product.id;

  document.getElementById("product-modal").style.display = "block";

  const disableBtn = document.querySelector(".pm-disable-btn");
  const enableBtn = document.querySelector(".pm-enable-btn");

  if (product.status === "inactive") {
    disableBtn.style.display = "none";
    enableBtn.style.display = "inline-block";
  } else {
    disableBtn.style.display = "inline-block";
    enableBtn.style.display = "none";
  }
}

document.querySelector(".pm-update-btn").addEventListener("click", async () => {

  const id = window.currentProductId;

  const name = document.getElementById("pm-name").value.trim();
  const price = Number(document.getElementById("pm-price").value || 0);
  const category = document.getElementById("pm-category").value;
  const desc = document.getElementById("pm-desc").value;

  let image = window.uploadedImagePath || document.getElementById("product-image").src;

  const basePath = location.origin + "/restaurant/";
  if (image.startsWith(basePath)) {
    image = image.replace(basePath, "");
  }

  await fetch(`${API_BASE}?action=admin_update_product`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id,
      name,
      price,
      category,
      desc,
      image
    })
  });

  document.getElementById("product-modal").style.display = "none";

  fillAdminProductsTable();

  window.uploadedImagePath = null;
});

document.querySelector(".pm-disable-btn").addEventListener("click", async () => {
  await fetch(`${API_BASE}?action=admin_change_product_status`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id: window.currentProductId,
      status: "inactive"
    })
  });

  document.getElementById("product-modal").style.display = "none";
  fillAdminProductsTable();
});

document.querySelector(".pm-enable-btn").addEventListener("click", async () => {
  await fetch(`${API_BASE}?action=admin_change_product_status`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id: window.currentProductId,
      status: "active"
    })
  });

  document.getElementById("product-modal").style.display = "none";
  fillAdminProductsTable();
});

document.getElementById("pm-name").oninput = e => {
  document.getElementById("product-preview-name").textContent = e.target.value;
};

document.getElementById("pm-price").oninput = e => {
  document.getElementById("product-preview-price").textContent =
    Number(e.target.value).toLocaleString("fa-IR") + " تومان";
};

document.getElementById("pm-desc").oninput = e => {
  document.getElementById("product-preview-desc").textContent = e.target.value;
};

document.getElementById("product-image-input").onchange = async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE}?action=upload_product_image`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  console.log("UPLOAD RESULT:", data);

  if (data.status === "success") {
    document.getElementById("product-image").src = data.path;

    window.uploadedImagePath = data.path;
  } else {
    alert("خطا در آپلود تصویر");
  }
};

document.getElementById("product-modal-close").onclick = () => {
  document.getElementById("product-modal").style.display = "none";
  clearProductModalErrors();
};

document.getElementById("pm-add-btn").addEventListener("click", async () => {

  const name = document.getElementById("pm-name").value.trim();
  const price = document.getElementById("pm-price").value.trim();
  const category = document.getElementById("pm-category").value.trim();
  const desc = document.getElementById("pm-desc").value.trim();

  const image = window.uploadedImagePath || ""; 

  let hasError = false;

  if (!image) {
    document.getElementById("pm-image-error").textContent = "لطفاً تصویر محصول را انتخاب کنید.";
    hasError = true;
  }

  if (!name) { document.getElementById("pm-name-error").textContent = "نام محصول را وارد کنید."; hasError = true; }
  if (!price || Number(price) <= 0) { document.getElementById("pm-price-error").textContent = "قیمت معتبر وارد کنید."; hasError = true; }
  if (!category) { document.getElementById("pm-category-error").textContent = "یک دسته انتخاب کنید."; hasError = true; }

  if (hasError) return;

  // ارسال اطلاعات محصول جدید به سرور
  const res = await fetch(`${API_BASE}?action=admin_add_product`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      name,
      price,
      category,
      desc,
      image
    })
  });

  const data = await res.json();
  console.log("ADD PRODUCT:", data);

  document.getElementById("product-modal").style.display = "none";
  fillAdminProductsTable();
});

document.querySelector(".pm-disable-permanent-btn").addEventListener("click", async () => {
  await fetch(`${API_BASE}?action=admin_change_product_status`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id: window.currentProductId,
      status: "disabled"
    })
  });

  document.getElementById("product-modal").style.display = "none";
  fillAdminProductsTable();
});

function getUserAddressesByEmail(email) {
  return JSON.parse(localStorage.getItem(`userAddresses_${email}`) || "[]");
}

async function renderCustomersPage() {

  switchToOrdersLayout();

  const container = document.querySelector(".recentProducts, .recentOrders, .recentCustomers, .recentMessages, .recentTickets, .recentSettings, .recentDashboard");

  // تبدیل به صفحه مشتریان
  container.classList.remove("recentProducts", "recentOrders", "recentMessages", "recentTickets", "recentSettings", "recentDashboard");
  container.classList.add("recentCustomers");

  const header = container.querySelector(".cardHeader");
  header.innerHTML = `
   <div style="display:flex; align-items:center; gap:10px;">
        <h2 id="customers-title">لیست مشتریان</h2>

        <span id="back-to-customers"
              style="display:none; cursor:pointer; color:#F2BD12; font-weight:bold;">
           → بازگشت
        </span>
    </div>

    <div style="display:flex; align-items:center; gap:15px;">
        <button id="print-customers" class="btn print-btn">چاپ</button>
        <button id="show-deleted-customers" class="btn deleted-btn">مشاهده حذف شده‌ها</button>
    </div>
  `;

  const table = container.querySelector("table");
  table.innerHTML = `
        <thead>
            <tr>
                <td>شماره</td>
                <td>نام و نام خانوادگی</td>
                <td>ایمیل</td>
                <td>رمز عبور</td>
                <td>شماره تماس</td>
                <td>آدرس</td>
                <td>سفارش‌ها</td>
            </tr>
        </thead>
        <tbody id="customers-body"></tbody>
    `;

  await fillCustomersTable();
  applyAdminRolePermissions();

  document.getElementById("print-customers").addEventListener("click", () => {

    const today = new Date().toLocaleDateString("fa-IR");

    const header = document.createElement("div");
    header.id = "custom-customers-header";
    header.style.textAlign = "right";
    header.style.marginBottom = "10px";
    header.style.position = "absolute";
    header.style.top = "20px";
    header.style.right = "20px";

    header.innerHTML = `
        <h1 style="margin:0 0 5px 0; font-size:20px;">رستوران فودی</h1>
        <h3 style="margin:0; font-size:16px; font-weight:normal;">${today}</h3>
    `;

    document.body.prepend(header);

    document.body.classList.add("print-customers");
    window.print();

    setTimeout(() => {
      header.remove();
      document.body.classList.remove("print-customers");
    }, 100);
  });

  document.getElementById("show-deleted-customers").addEventListener("click", () => {
    showDeletedCustomers();
  });

  document.getElementById("back-to-customers").addEventListener("click", () => {
    document.getElementById("customers-title").style.display = "block";
    document.getElementById("show-deleted-customers").style.display = "inline-block";
    document.getElementById("back-to-customers").style.display = "none";

    fillCustomersTable();
  });
}

async function deleteCustomer(userId) {
  await fetch(`${API_BASE}?action=admin_delete_customer`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `id=${userId}`
  });
}

async function showDeletedCustomers() {

  document.getElementById("customers-title").style.display = "none";
  document.getElementById("show-deleted-customers").style.display = "none";
  document.getElementById("back-to-customers").style.display = "inline-block";

  const tbody = document.getElementById("customers-body");
  tbody.innerHTML = "";

  const res = await fetch(`${API_BASE}?action=admin_get_deleted_customers`);
  const data = await res.json();

  if (data.status !== "success") return;

  const deleted = data.users;

  deleted.forEach((user, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${user.firstname} ${user.lastname}</td>
        <td>${user.email}</td>
        <td>—</td>
        <td>${user.phone || "-"}</td>
        <td>${user.firstAddress}</td>

        <td>
          <span>${user.orderCount} سفارش</span>
          <span class="restore-link"
                data-id="${user.id}"
                style="cursor:pointer; color:#007bff; text-decoration:underline; margin-right:8px;">
              بازیابی
          </span>
        </td>
      </tr>
    `;
  });

  document.querySelectorAll(".restore-link").forEach(link => {
    link.addEventListener("click", async () => {
      const id = link.dataset.id;

      await fetch(`${API_BASE}?action=admin_restore_customer`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id=${id}`
      });

      showDeletedCustomers();
    });
  });
}

async function fillCustomersTable() {
  const tbody = document.getElementById("customers-body");
  tbody.innerHTML = "";

  // دریافت کاربران از دیتابیس
  const res = await fetch(`${API_BASE}?action=admin_get_users`);
  const data = await res.json();

  if (data.status !== "success") return;

  const users = data.users;

  for (let index = 0; index < users.length; index++) {
    const user = users[index];

    // دریافت آدرس‌ها از دیتابیس
    const addrRes = await fetch(`${API_BASE}?action=get_addresses&user_id=${user.id}`);
    const addresses = await addrRes.json();

    const firstAddress = addresses.length > 0 ? addresses[0].location : "-";

    // تعداد سفارش‌ها از دیتابیس
    const orderRes = await fetch(`${API_BASE}?action=admin_get_user_orders&user_id=${user.id}`);
    const orderData = await orderRes.json();
    const orderCount = orderData.orders?.length || 0;

    tbody.innerHTML += `
            <tr>
              <td>
                <div class="row-control">
                    <input type="checkbox" class="row-select" data-id="${user.id}">
                    <span class="row-number">${index + 1}</span>
                    <ion-icon class="delete-customer-icon" data-id="${user.id}" name="trash-outline" style="display:none;"></ion-icon>
                </div>
              </td>
              
              <td>${user.firstname} ${user.lastname}</td>
              <td>${user.email}</td>
              <td>${user.password}</td>
              <td>${user.phone || "-"}</td>

              <td class="customer-address clickable-address"
                  data-id="${user.id}">
                  ${firstAddress}
              </td>

              <td class="customer-orders clickable-orders"
                  data-id="${user.id}">
                  ${orderCount} سفارش
              </td>
            </tr>
        `;
  }
}

async function openAddressModal(userId) {
  const modal = document.getElementById("address-modal");
  const content = document.getElementById("address-modal-content");

  const res = await fetch(`${API_BASE}?action=get_addresses&user_id=${userId}`);
  const addresses = await res.json();

  content.innerHTML = "";

  if (!addresses.length) {
    content.innerHTML = `
         <p>هیچ آدرسی ثبت نشده است.</p>
         `;
  } else {
    addresses.forEach(addr => {
      content.innerHTML += `
                <div class="address-item-box">
                    <h4>عنوان: ${addr.title || "-"}</h4>
                    <p><strong>نشانی: </strong>${addr.location || "-"}</p>
                    <p><strong>آدرس کامل: </strong>${addr.address || "-"}</p>
                </div>
            `;
    });
  }

  modal.classList.add("active");
}

document.addEventListener("click", function (e) {
  const cell = e.target.closest(".clickable-address");
  if (cell) {
    const userId = cell.dataset.id;
    openAddressModal(userId);
  }
});

document.getElementById("address-modal-close").addEventListener("click", () => {
  document.getElementById("address-modal").classList.remove("active");
});

document.getElementById("address-modal").addEventListener("click", (e) => {
  if (e.target.id === "address-modal") {
    e.target.classList.add("hidden");
  }
});

async function openCustomerOrdersModal(userId) {
  const modal = document.getElementById("orders-modal");
  const content = document.getElementById("orders-modal-content");

  const res = await fetch(`${API_BASE}?action=admin_get_user_orders&user_id=${userId}`);
  const data = await res.json();
  const orders = data.orders || [];

  content.innerHTML = "";

  if (!orders.length) {
    content.innerHTML = `
         <p>هیچ سفارشی ثبت نشده است.</p>
         `;
  } else {
    orders.forEach(order => {

      let itemsHTML = "";
      order.items.forEach(it => {
        itemsHTML += `<div>${it.item_name} × ${it.quantity}</div>`;
      });

      content.innerHTML += `
                <div class="order-item-box">
                    <h4>سفارش: ${order.tracking_code}</h4>
                  <p><strong>نام مشتری:</strong> 
                   ${(order.firstname && order.lastname)
          ? order.firstname + " " + order.lastname
          : "-"}
                     </p>
                    <p><strong>اقلام سفارش:</strong><br>${itemsHTML}</p>
        <p><strong>مبلغ کل:</strong>            
                    ${Number(order.total_payable).toLocaleString('fa-IR')} تومان
                     </p>
                    <p><strong>آدرس:</strong> ${order.address?.full_address || "-"}</p>
                    <p><strong>تاریخ:</strong> ${order.date}</p>
                </div>
            `;
    });
  }

  modal.classList.add("active");
}

document.addEventListener("click", function (e) {
  const cell = e.target.closest(".clickable-orders");
  if (cell) {
    const userId = cell.dataset.id;
    openCustomerOrdersModal(userId);
  }
});

document.getElementById("orders-modal-close").addEventListener("click", () => {
  document.getElementById("orders-modal").classList.remove("active");
});

document.getElementById("orders-modal").addEventListener("click", e => {
  if (e.target.id === "orders-modal") {
    e.target.classList.remove("active");
  }
});

function renderMessagesPage() {

  switchToOrdersLayout();

  const container = document.querySelector(".recentOrders, .recentProducts, .recentCustomers, .recentMessages, .recentTickets, .recentSettings, .recentDashboard");
  container.classList.remove("recentOrders", "recentProducts", "recentCustomers", "recentTickets", "recentSettings", "recentDashboard");
  container.classList.add("recentMessages");

  const header = container.querySelector(".cardHeader");

  header.innerHTML = `
    <div class="header-right" style="display:flex; align-items:center; gap:10px;">
        <h2 id="messages-title">نظرات کاربران</h2>

        <span id="back-to-messages"
            style="display:none; cursor:pointer; color:#F2BD12; font-weight:bold;">
           → بازگشت
        </span>
    </div>

    <div class="actions-container" style="display:flex; flex-direction:column; gap:10px;">

        <div style="display:flex; align-items:center; gap:20px; justify-content:flex-start; margin-right:6px;">

            <div class="status-filter-box">
                <label>وضعیت:</label>
                <select id="msg-status-filter" class="filter-input">
                    <option value="all">همه</option>
                    <option value="unread">خوانده نشده</option>
                    <option value="read">خوانده شده</option>
                    <option value="replied">پاسخ داده شده</option>
                </select>
            </div>

            <button id="print-messages" class="btn print-btn">چاپ</button>
            <button id="show-deleted-messages" class="btn deleted-btn">مشاهده حذف شده‌ها</button>
        </div>

        <div class="filter-box">
            <label>از:</label>
            <input type="text" id="filter-msg-from" class="filter-input">

            <label>تا:</label>
            <input type="text" id="filter-msg-to" class="filter-input">

            <button id="filter-msg-apply" class="filter-btn">فیلتر</button>
            <button id="filter-msg-clear" class="filter-btn danger">حذف</button>
        </div>
    </div>
    `;

  $("#filter-msg-from").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    autoClose: true
  });

  $("#filter-msg-to").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    autoClose: true
  });

  const table = container.querySelector("table");
  table.innerHTML = `
        <thead>
        <tr>
            <td>شماره</td>
            <td>نام و نام خانوادگی</td>
            <td>ایمیل</td>
            <td>تاریخ</td>
            <td>متن</td>
            <td>پاسخ</td>
            <td>وضعیت</td>
        </tr>
        </thead>
        <tbody id="messages-body"></tbody>
    `;

  loadMessagesIntoTable().then(() => {
    applyAdminRolePermissions();
  });

  document.getElementById("msg-status-filter").addEventListener("change", applyMessageStatusFilter);

  document.getElementById("print-messages").addEventListener("click", () => {

    const from = document.getElementById("msg-filter-from")?.value.trim();
    const to = document.getElementById("msg-filter-to")?.value.trim();

    let dateText = "";

    if (from && to) {
      dateText = ` از ${from} تا ${to}`;
    } else {
      dateText = new Date().toLocaleDateString("fa-IR");
    }

    const header = document.createElement("div");
    header.id = "custom-messages-header";
    header.style.textAlign = "right";
    header.style.position = "absolute";
    header.style.top = "20px";
    header.style.right = "20px";

    header.innerHTML = `
        <h1 style="margin:0 0 6px 0; font-size:20px;">رستوران فودی</h1>
        <h3 style="margin:0; font-size:16px; font-weight:normal;">${dateText}</h3>
    `;

    document.body.prepend(header);

    document.body.classList.add("print-messages");
    window.print();

    setTimeout(() => {
      header.remove();
      document.body.classList.remove("print-messages");
    }, 100);
  });

  document.getElementById("show-deleted-messages").addEventListener("click", showDeletedMessages);

  document.getElementById("back-to-messages").addEventListener("click", () => {
    document.getElementById("messages-title").style.display = "block";
    document.getElementById("show-deleted-messages").style.display = "inline-block";
    document.getElementById("back-to-messages").style.display = "none";

    loadMessagesIntoTable();
  });

  document.getElementById("filter-msg-apply").onclick = () => {
    filterMessagesByDate(
      document.getElementById("filter-msg-from").value,
      document.getElementById("filter-msg-to").value
    );
  };

  document.getElementById("filter-msg-clear").onclick = () => {
    document.getElementById("filter-msg-from").value = "";
    document.getElementById("filter-msg-to").value = "";
    loadMessagesIntoTable();
  };
}

async function loadMessagesIntoTable() {

  const tbody = document.getElementById("messages-body");
  tbody.innerHTML = "";

  const res = await fetch(`${API_BASE}?action=admin_get_all_messages`);
  const data = await res.json();

  if (data.status !== "success") return;

  const allComments = data.messages;

  allComments.forEach((comment, index) => {

    const shortText =
      comment.text.length > 40 ? comment.text.slice(0, 40) + "..." : comment.text;

    const shortReply =
      comment.reply
        ? (comment.reply.length > 40 ? comment.reply.slice(0, 40) + "..." : comment.reply)
        : "—";

    const datePart = comment.created_at?.split(" ")[0] || "";
    const persianDateStr = datePart
      ? new persianDate(new Date(datePart)).format("YYYY/MM/DD")
      : "—";

    tbody.innerHTML += `
      <tr class="msg-row" data-id="${comment.id}" data-email="${comment.email}">
          <td>
              <div class="row-control">
                  <input type="checkbox" class="row-select" data-id="${comment.id}">
                  <span class="row-number">${index + 1}</span>
                  <ion-icon name="trash-outline" class="delete-msg-icon" data-id="${comment.id}" style="display:none;"></ion-icon>
              </div>
          </td>
          <td>${comment.fullname}</td>
          <td>${comment.email}</td>
          <td>${persianDateStr}</td>  
          <td>${shortText}</td>
          <td>${shortReply}</td>
          <td class="msg-status-cell">
              ${comment.status === "replied"
        ? `<span class="msg-badge msg-replied">پاسخ داده شده</span>`
        : comment.status === "read"
          ? `<span class="msg-badge msg-read">خوانده شده</span>`
          : `<span class="msg-badge msg-unread">خوانده نشده</span>`
      }
          </td>
      </tr>
  `;
  });
}

function applyMessageStatusFilter() {
  const filter = document.getElementById("msg-status-filter").value;
  const tbody = document.getElementById("messages-body");
  tbody.innerHTML = "";

  if (!GLOBAL_MESSAGES) return;

  const normalized = GLOBAL_MESSAGES.map(m => ({
    ...m,
    status:
      m.status === "approved" ? "replied" :
        m.status === "pending" ? "unread" :
          (!m.status || m.status === "") ? "unread" :
            m.status
  }));

  const filtered =
    filter === "all"
      ? normalized
      : normalized.filter(c => c.status === filter);

  // مرتب‌سازی: آخرین پیام‌ها بالا
  filtered.sort((a, b) => b.id - a.id);

  filtered.forEach((comment, index) => {

    const shortText =
      comment.text.length > 40 ? comment.text.slice(0, 40) + "..." : comment.text;

    const shortReply =
      comment.reply
        ? (comment.reply.length > 40 ? comment.reply.slice(0, 40) + "..." : comment.reply)
        : "—";

    const datePart = comment.created_at
      ? new Date(comment.created_at).toLocaleDateString("fa-IR")
      : "—";

    tbody.innerHTML += `
      <tr class="msg-row" data-id="${comment.id}" data-email="${comment.email}">
        <td>
          <div class="row-control">
            <input type="checkbox" class="row-select" data-id="${comment.id}" data-email="${comment.email}">
            <span class="row-number">${index + 1}</span>
            <ion-icon name="trash-outline" class="delete-msg-icon" data-id="${comment.id}" data-email="${comment.email}" style="display:none;"></ion-icon>
          </div>
        </td>
        <td>${comment.fullname}</td>
        <td>${comment.email}</td>
        <td>${datePart}</td>
        <td>${shortText}</td>
        <td>${shortReply}</td>

        <td class="msg-status-cell">
          ${comment.status === "replied"
        ? `<span class="msg-badge msg-replied">پاسخ داده شده</span>`
        : comment.status === "read"
          ? `<span class="msg-badge msg-read">خوانده شده</span>`
          : `<span class="msg-badge msg-unread">خوانده نشده</span>`
      }
        </td>
      </tr>
      `;
  });
}

document.addEventListener("click", async function (e) {

  // ================= حذف پیام =================
  if (e.target.classList.contains("delete-msg-icon")) {
    e.stopPropagation();

    const selected = Array.from(
      document.querySelectorAll(".row-select:checked")
    );

    if (selected.length === 0) {
      await deleteMessage(e.target.dataset.id);
    } else {
      for (const row of selected) {
        await deleteMessage(row.dataset.id);
      }
    }

    loadMessagesIntoTable();
    return;
  }

  // ================= چک‌باکس پیام‌ها =================
  if (
    e.target.classList.contains("row-select") &&
    e.target.closest(".msg-row")   
  ) {
    const tr = e.target.closest("tr");
    const icon = tr.querySelector(".delete-msg-icon");

    if (e.target.checked) {
      tr.classList.add("selected-row");
      if (icon) icon.style.display = "inline-block";
    } else {
      tr.classList.remove("selected-row");
      if (icon) icon.style.display = "none";
    }
  }

});

async function deleteMessage(id) {
  await fetch(`${API_BASE}?action=admin_delete_message`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `id=${id}`
  });
}

async function showDeletedMessages() {
  document.getElementById("messages-title").style.display = "none";
  document.getElementById("show-deleted-messages").style.display = "none";
  document.getElementById("back-to-messages").style.display = "inline-block";

  const tbody = document.getElementById("messages-body");
  tbody.innerHTML = "";

  const res = await fetch(`${API_BASE}?action=admin_get_deleted_messages`);
  const data = await res.json();

  if (data.status !== "success") return;

  data.messages.forEach((msg, index) => {

    // --- تبدیل تاریخ ---
    const datePart = msg.created_at?.split(" ")[0] || "";
    const persianDateStr = datePart
      ? new persianDate(new Date(datePart)).format("YYYY/MM/DD")
      : "—";

    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${msg.fullname}</td>
        <td>${msg.email}</td>
        <td>${persianDateStr}</td>
        <td>${msg.text.slice(0, 40)}...</td>
        <td>${msg.reply || "—"}</td>
        <td>
          ${msg.status === "replied"
        ? `<span class="msg-badge msg-replied">پاسخ داده شده</span>`
        : msg.status === "read"
          ? `<span class="msg-badge msg-read">خوانده شده</span>`
          : `<span class="msg-badge msg-unread">خوانده نشده</span>`
      }

          <span class="restore-link" style="cursor:pointer;color:#007bff" data-id="${msg.id}">
            بازیابی
          </span>
        </td>
      </tr>
  `;
  });

  document.querySelectorAll(".restore-link").forEach(el => {
    el.onclick = async () => {
      await fetch(`${API_BASE}?action=admin_restore_message`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id=${el.dataset.id}`
      });
      showDeletedMessages();
    };
  });
}

async function filterMessagesByDate(from, to) {

  const tbody = document.getElementById("messages-body");
  tbody.innerHTML = "";

  const fromNum = from ? persianDateToNumber(from) : 0;
  const toNum = to ? persianDateToNumber(to) : 999999999999;

  // گرفتن پیام‌ها از دیتابیس
  const res = await fetch(`${API_BASE}?action=admin_get_all_messages`);
  const data = await res.json();
  if (data.status !== "success") return;

  const list = data.messages;

  // فیلتر تاریخ
  const filtered = list.filter(msg => {
    if (!msg.created_at) return false;

    const gregorian = msg.created_at.split(" ")[0]; // YYYY-MM-DD
    const shamsi = new persianDate(new Date(gregorian)).format("YYYY/MM/DD");
    const num = persianDateToNumber(shamsi);

    return num >= fromNum && num <= toNum;
  });

  // مرتب‌سازی آخرین پیام‌ها بالا
  filtered.sort((a, b) => b.id - a.id);

  filtered.forEach((comment, index) => {

    const shortText =
      comment.text?.length > 40 ? comment.text.slice(0, 40) + "..." : comment.text;

    const shortReply =
      comment.reply?.length > 40 ? comment.reply.slice(0, 40) + "..." : (comment.reply || "—");

    const datePart = comment.created_at.split(" ")[0];
    const persianDateStr = new persianDate(new Date(datePart)).format("YYYY/MM/DD");

    tbody.innerHTML += `
      <tr class="msg-row" data-id="${comment.id}" data-email="${comment.email}">
        <td>
          <div class="row-control">
            <input type="checkbox" class="row-select" data-id="${comment.id}">
            <span class="row-number">${index + 1}</span>
            <ion-icon name="trash-outline" 
                      class="delete-msg-icon" 
                      data-id="${comment.id}"
                      style="display:none;">
            </ion-icon>
          </div>
        </td>

        <td>${comment.fullname}</td>
        <td>${comment.email}</td>
        <td>${persianDateStr}</td>
        <td>${shortText}</td>
        <td>${shortReply}</td>

        <td class="msg-status-cell">
          ${comment.status === "replied"
        ? `<span class="msg-badge msg-replied">پاسخ داده شده</span>`
        : comment.status === "read"
          ? `<span class="msg-badge msg-read">خوانده شده</span>`
          : `<span class="msg-badge msg-unread">خوانده نشده</span>`
      }
        </td>
      </tr>
    `;
  });
}

document.addEventListener("click", function (e) {
  const statusCell = e.target.closest(".msg-status-cell");
  if (!statusCell) return;

  const row = statusCell.closest(".msg-row");
  if (!row) return;

  const id = row.dataset.id;
  const email = row.dataset.email;
  openMessageModal(id, email);
});

async function openMessageModal(id) {

  const modal = document.getElementById("message-modal");
  const full = document.getElementById("msg-full-text");
  const replyInput = document.getElementById("msg-reply-input");

  // دریافت پیام از سرور
  const res = await fetch(`${API_BASE}?action=admin_get_all_messages`);
  const data = await res.json();

  const msg = data.messages.find(m => m.id == id);
  if (!msg) return;

  full.textContent = msg.text;
  replyInput.value = msg.reply || "";

  modal.classList.add("active");

  document.getElementById("msg-confirm-btn").onclick = async () => {

    const reply = replyInput.value.trim();

    await fetch(`${API_BASE}?action=admin_reply_message`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `id=${id}&reply=${encodeURIComponent(reply)}`
    });

    modal.classList.remove("active");

    loadMessagesIntoTable();
  };
}

document.getElementById("message-modal-close").onclick = () => {
  document.getElementById("message-modal").classList.remove("active");
};

document.getElementById("message-modal").onclick = (e) => {
  if (e.target.id === "message-modal") {
    e.target.classList.remove("active");
  }
};

function applyStatusFilter() {
  const status = document.getElementById("status-filter").value;

  const tbody = document.getElementById("orders-body");
  tbody.innerHTML = "";

  const list = GLOBAL_ORDERS;

  const filtered = list
    .map((order, realIndex) => ({ order, realIndex }))
    .filter(({ order }) => {
      if (status === "all") return true;
      return order.status === status;
    });

  filtered.forEach(({ order, realIndex }, idx) => {
    tbody.innerHTML += `
      <tr data-row="${realIndex}">
        <td>
          <div class="row-control">
            <input type="checkbox" class="row-select" data-id="${order.id}">
            <span class="row-number">${idx + 1}</span>
            <ion-icon name="trash-outline" class="delete-icon" data-id="${order.id}" style="display:none;"></ion-icon>
          </div>
        </td>

        <td class="tracking clickable" data-index="${realIndex}">
          ${order.tracking_code}
        </td>

        <td>${order.customer.fullName}</td>

        <td>${order.total_payable.toLocaleString('fa-IR')}</td>

        <td>${order.delivery_fee
        ? order.delivery_fee.toLocaleString('fa-IR') + " تومان"
        : "—"
      }</td>

        <td>${order.date}</td>

        <td>${order.delivery_time || "—"}</td>

        <td>${getStatusLabel(order.status)}</td>
      </tr>
    `;
  });
}

function renderTicketsPage() {

  switchToOrdersLayout();

  const container =
    document.querySelector(".recentOrders, .recentProducts, .recentCustomers, .recentMessages, .recentTickets, .recentSettings, .recentDashboard");

  container.classList.remove("recentOrders", "recentProducts", "recentCustomers", "recentMessages", "recentSettings", "recentDashboard");
  container.classList.add("recentTickets");

  const header = container.querySelector(".cardHeader");

  header.innerHTML = `
    <div class="header-right" style="display:flex; align-items:center; gap:10px;">
        <h2 id="tickets-title">پیام‌ها</h2>

        <span id="back-to-tickets"
            style="display:none; cursor:pointer; color:#F2BD12; font-weight:bold;">
           → بازگشت
        </span>
    </div>

    <div class="actions-container" style="display:flex; flex-direction:column; gap:10px;">

        <div style="display:flex; align-items:center; gap:20px; justify-content:flex-start; margin-right:6px;">

            <div class="status-filter-box">
                <label>وضعیت:</label>
                <select id="ticket-status-filter" class="filter-input">
                    <option value="all">همه</option>
                    <option value="unread">خوانده نشده</option>
                    <option value="read">خوانده شده</option>
                    <option value="replied">پاسخ داده شده</option>
                </select>
            </div>

            <button id="print-tickets" class="btn print-btn">چاپ</button>
            <button id="show-deleted-tickets" class="btn deleted-btn">مشاهده حذف شده‌ها</button>
        </div>

        <div class="filter-box">
            <label>از:</label>
            <input type="text" id="filter-ticket-from" class="filter-input">

            <label>تا:</label>
            <input type="text" id="filter-ticket-to" class="filter-input">

            <button id="apply-ticket-date-filter" class="filter-btn">فیلتر</button>
            <button id="clear-ticket-date-filter" class="filter-btn danger">حذف</button>
        </div>
    </div>
    `;

  $("#filter-ticket-from").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    autoClose: true
  });

  $("#filter-ticket-to").persianDatepicker({
    format: "YYYY/MM/DD",
    initialValue: false,
    autoClose: true
  });

  const table = container.querySelector("table");
  table.innerHTML = `
        <thead>
        <tr>
            <td>شماره</td>
            <td>نام و نام خانوادگی</td>
            <td>ایمیل</td>
            <td>تاریخ</td>
            <td>عنوان</td>
            <td>متن</td>
            <td>پاسخ</td>
            <td>وضعیت</td>
        </tr>
        </thead>
        <tbody id="tickets-body"></tbody>
    `;

  loadTicketsIntoTable().then(() => {
    applyAdminRolePermissions();
  });

  document.getElementById("ticket-status-filter").addEventListener("change", applyTicketStatusFilter);

  document.getElementById("print-tickets").addEventListener("click", () => {

    const from = document.getElementById("ticket-filter-from")?.value.trim();
    const to = document.getElementById("ticket-filter-to")?.value.trim();

    let dateText = "";

    if (from && to) {
      dateText = ` از ${from} تا ${to}`;
    } else {
      dateText = new Date().toLocaleDateString("fa-IR");
    }

    const header = document.createElement("div");
    header.id = "custom-tickets-header";
    header.style.textAlign = "right";
    header.style.position = "absolute";
    header.style.top = "20px";
    header.style.right = "20px";

    header.innerHTML = `
        <h1 style="margin:0 0 6px 0; font-size:20px;">رستوران فودی</h1>
        <h3 style="margin:0; font-size:16px; font-weight:normal;">${dateText}</h3>
    `;

    document.body.prepend(header);

    document.body.classList.add("print-tickets");
    window.print();

    setTimeout(() => {
      header.remove();
      document.body.classList.remove("print-tickets");
    }, 100);
  });

  document.getElementById("show-deleted-tickets").addEventListener("click", showDeletedTickets);

  document.getElementById("back-to-tickets").addEventListener("click", () => {
    document.getElementById("tickets-title").style.display = "block";
    document.getElementById("show-deleted-tickets").style.display = "inline-block";
    document.getElementById("back-to-tickets").style.display = "none";

    loadTicketsIntoTable();
  });

  document.getElementById("apply-ticket-date-filter").onclick = () => {
    filterTicketsByDate(
      document.getElementById("filter-ticket-from").value,
      document.getElementById("filter-ticket-to").value
    );
  };

  document.getElementById("clear-ticket-date-filter").onclick = () => {
    document.getElementById("filter-ticket-from").value = "";
    document.getElementById("filter-ticket-to").value = "";
    loadTicketsIntoTable();
  };
}

async function loadTicketsIntoTable() {
  const tbody = document.getElementById("tickets-body");
  tbody.innerHTML = "";

  const res = await fetch(`${API_BASE}?action=admin_get_all_tickets`);
  const data = await res.json();

  if (data.status !== "success") return;

  const list = data.tickets;

  list.forEach((t, index) => {

    const datePart = t.created_at?.split(" ")[0] || "";
    const persianDateStr = datePart
      ? new persianDate(new Date(datePart)).format("YYYY/MM/DD")
      : "—";

    tbody.innerHTML += `
      <tr class="ticket-row" data-id="${t.id}">
        <td>
          <div class="row-control">
            <input type="checkbox" class="row-select" data-id="${t.id}">
            <span class="row-number">${index + 1}</span>
            <ion-icon name="trash-outline" class="delete-ticket-icon" data-id="${t.id}" style="display:none;"></ion-icon>
          </div>
        </td>

        <td>${t.fullname}</td>
        <td>${t.email}</td>
        <td>${persianDateStr}</td>
        <td>${t.title}</td>
        <td>${t.message}</td>
        <td>${t.reply || "—"}</td>

        <td class="ticket-status-cell">
          ${t.status === "replied"
        ? `<span class="msg-badge msg-replied">پاسخ داده شده</span>`
        : t.status === "read"
          ? `<span class="msg-badge msg-read">خوانده شده</span>`
          : `<span class="msg-badge msg-unread">خوانده نشده</span>`
      }
        </td>
      </tr>
    `;
  });
}

async function applyTicketStatusFilter() {

  const filter = document.getElementById("ticket-status-filter").value;
  const tbody = document.getElementById("tickets-body");
  tbody.innerHTML = "";

  const res = await fetch(`${API_BASE}?action=admin_get_all_tickets`);
  const data = await res.json();
  if (data.status !== "success") return;

  let list = data.tickets;

  list = list.map(t => ({
    ...t,
    status:
      t.status === "approved" ? "replied" :
        t.status === "pending" ? "unread" :
          (!t.status || t.status === "") ? "unread" :
            t.status
  }));

  if (filter !== "all") {
    list = list.filter(t => t.status === filter);
  }

  list.forEach((t, index) => {

    const datePart = t.created_at?.split(" ")[0] || "";
    const persianDateStr = datePart
      ? new persianDate(new Date(datePart)).format("YYYY/MM/DD")
      : "—";

    tbody.innerHTML += `
      <tr class="ticket-row" data-id="${t.id}">
        <td>
          <div class="row-control">
            <input type="checkbox" class="row-select" data-id="${t.id}">
            <span class="row-number">${index + 1}</span>
            <ion-icon name="trash-outline" class="delete-ticket-icon" data-id="${t.id}" style="display:none;"></ion-icon>
          </div>
        </td>

        <td>${t.fullname}</td>
        <td>${t.email}</td>
        <td>${persianDateStr}</td>
        <td>${t.title}</td>
        <td>${t.message}</td>
        <td>${t.reply || "—"}</td>

        <td class="ticket-status-cell">
          ${t.status === "replied"
        ? `<span class="msg-badge msg-replied">پاسخ داده شده</span>`
        : t.status === "read"
          ? `<span class="msg-badge msg-read">خوانده شده</span>`
          : `<span class="msg-badge msg-unread">خوانده نشده</span>`
      }
        </td>
      </tr>
    `;
  });
}

async function filterTicketsByDate(from, to) {

  const tbody = document.getElementById("tickets-body");
  tbody.innerHTML = "";

  const fromNum = from ? persianDateToNumber(from) : 0;
  const toNum = to ? persianDateToNumber(to) : 999999999999;

  const res = await fetch(`${API_BASE}?action=admin_get_all_tickets`);
  const data = await res.json();
  if (data.status !== "success") return;

  let list = data.tickets;

  const filtered = list.filter(t => {
    if (!t.created_at) return false;

    const datePart = t.created_at.split(" ")[0];
    const shamsi = new persianDate(new Date(datePart)).format("YYYY/MM/DD");
    const num = persianDateToNumber(shamsi);
    return num >= fromNum && num <= toNum;
  });

  filtered.forEach((t, index) => {
    const datePart = t.created_at.split(" ")[0];
    const persianDateStr = new persianDate(new Date(datePart)).format("YYYY/MM/DD");

    tbody.innerHTML += `
      <tr class="ticket-row" data-id="${t.id}">
        <td>
          <div class="row-control">
            <input type="checkbox" class="row-select" data-id="${t.id}">
            <span class="row-number">${index + 1}</span>
            <ion-icon name="trash-outline" class="delete-ticket-icon" data-id="${t.id}" style="display:none;"></ion-icon>
          </div>
        </td>

        <td>${t.fullname}</td>
        <td>${t.email}</td>
        <td>${persianDateStr}</td>
        <td>${t.title}</td>
        <td>${t.message}</td>
        <td>${t.reply || "—"}</td>
        <td class="ticket-status-cell">
          ${t.status === "replied"
        ? `<span class="msg-badge msg-replied">پاسخ داده شده</span>`
        : t.status === "read"
          ? `<span class="msg-badge msg-read">خوانده شده</span>`
          : `<span class="msg-badge msg-unread">خوانده نشده</span>`
      }
        </td>
      </tr>
    `;
  });
}

document.addEventListener("click", function (e) {

  if (e.target.classList.contains("delete-ticket-icon")) {

    const selected = Array.from(document.querySelectorAll(".row-select:checked"));

    if (selected.length === 0) {
      deleteTicket(e.target.dataset.id, e.target.dataset.email);
      loadTicketsIntoTable();
      return;
    }

    selected.forEach(cb => {
      deleteTicket(cb.dataset.id, cb.dataset.email);
    });

    loadTicketsIntoTable();
  }

  if (e.target.classList.contains("row-select") &&
    e.target.closest(".recentTickets")) {

    const tr = e.target.closest("tr");
    const icon = tr.querySelector(".delete-ticket-icon");

    if (e.target.checked) {
      tr.classList.add("selected-row");
      if (icon) icon.style.display = "inline-block";
    } else {
      tr.classList.remove("selected-row");
      if (icon) icon.style.display = "none";
    }
  }
});

async function deleteTicket(id) {

  await fetch(`${API_BASE}?action=admin_delete_ticket`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `id=${id}`
  });
}

async function showDeletedTickets() {

  document.getElementById("tickets-title").style.display = "none";
  document.getElementById("show-deleted-tickets").style.display = "none";
  document.getElementById("back-to-tickets").style.display = "inline-block";

  const tbody = document.getElementById("tickets-body");
  tbody.innerHTML = "";

  const res = await fetch(`${API_BASE}?action=admin_get_deleted_tickets`);
  const data = await res.json();

  if (data.status !== "success") return;

  const deleted = data.tickets;

  deleted.forEach((t, index) => {

    // --- فقط تاریخ به صورت شمسی ---
    const datePart = t.created_at?.split(" ")[0] || "";
    const persianDateStr = datePart
      ? new persianDate(new Date(datePart)).format("YYYY/MM/DD")
      : "—";

    tbody.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td>${t.fullname}</td>
            <td>${t.email}</td>
            <td>${persianDateStr}</td>
            <td>${t.title}</td>
            <td>${t.message}</td>
            <td>${t.reply || "—"}</td>

            <td class="ticket-status-cell">
                ${t.status === "replied"
        ? `<span class="msg-badge msg-replied">پاسخ داده شده</span>`
        : t.status === "read"
          ? `<span class="msg-badge msg-read">خوانده شده</span>`
          : `<span class="msg-badge msg-unread">خوانده نشده</span>`
      }
            </td>

            <td>
                <span class="restore-link"
                    data-id="${t.id}"
                    style="cursor:pointer; color:#007bff; text-decoration:underline; margin-right:8px;">
                    بازیابی
                </span>
            </td>
        </tr>
    `;
  });

  document.querySelectorAll(".restore-link").forEach(link => {
    link.addEventListener("click", async () => {

      const id = link.dataset.id;

      await fetch(`${API_BASE}?action=admin_restore_ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id=${id}`
      });

      showDeletedTickets();
    });
  });
}

document.addEventListener("click", function (e) {

  const cell = e.target.closest(".ticket-status-cell");
  if (!cell) return;

  const row = cell.closest(".ticket-row");
  if (!row) return;

  const id = row.dataset.id;
  const email = row.dataset.email;

  openTicketModal(id, email);
});

async function loadAdminHeaderAvatar() {
  const headerImg = document.querySelector(".user-avatar");
  if (!headerImg) return;

  const logged = JSON.parse(localStorage.getItem("loggedAdmin") || "{}");
  if (!logged.id) return;

  const res = await fetch(`${API_BASE}?action=admin_get_profile&id=` + logged.id);
  const data = await res.json();

  if (data.status !== "success") return;

  const admin = data.admin;

  if (admin.avatar) {
    headerImg.src = admin.avatar
      ? `images/admins/${admin.avatar}`
      : "images/admin-default.png";
  }
}

async function openTicketModal(id) {

  const modal = document.getElementById("ticket-modal");

  const res = await fetch(`${API_BASE}?action=admin_get_single_ticket&id=` + id);
  const data = await res.json();
  if (data.status !== "success") return;

  const t = data.ticket;

  document.getElementById("ticket-full-title").textContent = t.title;
  document.getElementById("ticket-full-message").textContent = t.message;
  document.getElementById("ticket-reply-input").value = t.reply || "";

  modal.classList.add("active");

  document.getElementById("ticket-confirm-btn").onclick = async () => {

    const reply = document.getElementById("ticket-reply-input").value.trim();

    await fetch(`${API_BASE}?action=admin_reply_ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `id=${id}&reply=${encodeURIComponent(reply)}`
    });

    modal.classList.remove("active");
    loadTicketsIntoTable();
  };
}

document.getElementById("ticket-modal-close").onclick = () => {
  document.getElementById("ticket-modal").classList.remove("active");
};

async function fetchUsersFromDatabase() {
  const res = await fetch(`${API_BASE}?action=admin_get_all_users`);
  const data = await res.json();

  if (data.status !== "success") return [];
  return data.users;
}

async function fetchAdminsFromDatabase() {
  const res = await fetch(`${API_BASE}?action=admin_get_all_admins`);
  const data = await res.json();

  if (data.status !== "success") return [];
  return data.admins;
}

async function renderSettingsPage() {
  document.querySelector(".dashboardCustomers").style.display = "none";
  document.querySelector(".details").style.gridTemplateColumns = "1fr";

  const container = document.querySelector(
    ".recentOrders, .recentProducts, .recentCustomers, .recentMessages, .recentTickets, .recentSettings, .recentDashboard"
  );

  container.classList.remove(
    "recentOrders",
    "recentProducts",
    "recentCustomers",
    "recentMessages",
    "recentTickets",
    "recentDashboard"
  );
  container.classList.add("recentSettings");

  container.innerHTML = `
        <div class="cardHeader">
            <h2>تنظیمات</h2>
        </div>

        <table>
            <tbody id="settings-body"></tbody>
        </table>
    `;

  const tbody = document.getElementById("settings-body");

  let adminProfileHTML = `
        <div class="settings-card admin-settings-card">

    <h2 class="settings-title">پروفایل مدیر</h2>

    <div class="admin-profile-box">

        <!-- آواتار -->
        <div class="admin-avatar">
            <div class="avatar-frame">
                <img id="admin-avatar-img" src="images/admin-default.png">
            </div>

            <span id="change-avatar-btn" class="change-avatar-text">تغییر عکس</span>
            <input type="file" id="admin-avatar-input" accept="image/*" hidden>
        </div>

        <!-- اطلاعات -->
        <div class="admin-info">

            <div class="setting-field">
                <label>شناسه ادمین:</label>
                <input type="text" id="admin-id" value="admin01">
            </div>

            <div class="setting-field">
                <label>نام مدیر:</label>
                <input type="text" id="admin-name" value="مدیر کل">
            </div>

            <div class="setting-field">
                <label>ایمیل:</label>
                <input type="text" id="admin-email" value="admin@example.com">
            </div>

            <div class="setting-field">
                <label>سطح دسترسی:</label>
                <input type="text" id="admin-role" value="Super Admin" disabled>
            </div>

            <!-- تغییر رمز عبور -->
            <div class="change-pass-wrapper">
                <span id="change-pass-toggle" class="change-pass-text">
                    تغییر رمز عبور
                </span>

                <div id="change-pass-fields" class="change-pass-fields hidden">

    <div class="pass-field-wrap">
        <input type="password" id="admin-old-pass" placeholder="رمز فعلی">
        <small id="admin-old-pass-error" class="error-msg"></small>
    </div>

    <div class="pass-field-wrap">
        <input type="password" id="admin-new-pass" placeholder="رمز جدید">
        <small id="admin-new-pass-error" class="error-msg"></small>
    </div>

    <div class="pass-field-wrap">
        <input type="password" id="admin-new-pass-repeat" placeholder="تکرار رمز جدید">
        <small id="admin-new-pass-repeat-error" class="error-msg"></small>
    </div>

</div>
            </div>

            <!-- دکمه ذخیره -->
            <button id="admin-save-btn" class="settings-save-small hidden">
                ذخیره
            </button>

        </div>
    </div>
</div>
    `;

  async function loadAdminInfo() {
    const loggedAdmin = JSON.parse(localStorage.getItem("loggedAdmin") || "{}");
    if (!loggedAdmin || !loggedAdmin.id) return;

    // گرفتن اطلاعات کامل ادمین از دیتابیس
    const res = await fetch(`${API_BASE}?action=admin_get_admin&id=` + loggedAdmin.id);
    const data = await res.json();

    if (data.status !== "success") return;

    const admin = data.admin;

    // --- آواتار ---
    if (admin.avatar) {
      document.getElementById("admin-avatar-img").src =
        admin.avatar ? `images/admins/${admin.avatar}` : "images/admin-default.png";
    }

    // --- فیلدهای پروفایل ----
    document.getElementById("admin-id").value = admin.username;      // ✔️ شناسه مدیر
    document.getElementById("admin-name").value = admin.firstname + " " + admin.lastname;   // ✔️ نام کامل
    document.getElementById("admin-email").value = admin.email;      // ✔️ ایمیل
    document.getElementById("admin-role").value = getRoleLabel(admin.role);  // ✔️ نقش فارسی
  }

  let users = await fetchUsersFromDatabase();

  let usersHTML = `
        <div class="settings-card">
            <h2 class="settings-title">سطح دسترسی کاربران</h2>
            <div class="dashboardCustomersList">
    `;

  users.forEach(u => {
    usersHTML += `
            <div class="customerRow">

    <div class="user-block">
        <div class="imgBx smallAvatar">
            <img src="images/profile.png">
        </div>

        <div class="customer-info">
            <h4>${u.firstname} ${u.lastname}</h4>
            <span class="email">${u.email}</span>
        </div>
    </div>

    <span class="role-badge ${u.role || 'user'}" data-uid="${u.email}">
        ${getRoleLabel(u.role)}
    </span>

</div>
        `;
  });

  usersHTML += `
            </div>
        </div>
    `;

  tbody.innerHTML = `
        <tr>
            <td style="width:60%; padding-left:15px; vertical-align:top;">

    ${adminProfileHTML}

   <div class="settings-card discount-settings-card">

    <h2 class="settings-title">کد تخفیف</h2>

    <div class="discount-row">

        <div class="setting-field small-field">
            <label>درصد تخفیف</label>
            <input type="number" id="discount-percent" placeholder="10">
        </div>

        <div class="setting-field small-field">
            <label>کد تخفیف</label>
            <input type="text" id="discount-code" placeholder="OFF2025">
            <button id="discount-save-btn" class="discount-save-small">ثبت</button>
        </div>

    </div>

    <span id="discount-history-toggle" class="discount-history-link small-link">
        مشاهده کدهای تخفیف گذشته
    </span>

    <div id="discount-history-box" class="discount-history-box hidden">
        <p class="empty-history">تا الان هیچ کدی ثبت نشده.</p>
        <div id="discount-history-list"></div>

        <div id="discount-status-actions" class="hidden">
            <button id="discount-set-active" class="status-active-btn">فعال</button>
            <button id="discount-set-inactive" class="status-inactive-btn">غیرفعال</button>
        </div>
    </div>

    <!-- عنوان هزینه ارسال -->
    <h2 class="settings-title" style="margin-top:25px;">هزینه ارسال</h2>

    <div class="shipping-box">

        <div class="setting-field small-field">
            <label>هزینه ارسال (تومان)</label>
            <input type="number" id="shipping-fee-input" placeholder="60000">
        </div>

        <button id="shipping-save-btn" class="shipping-save-small hidden">اعمال</button>

        <span id="shipping-save-msg" class="shipping-save-msg hidden">
            ذخیره شد ✔️
        </span>

    </div>

</div>

</td>
            <td style="width:40%; padding-right:15px; vertical-align:top;">
                ${usersHTML}
            </td>
        </tr>
    `;

  const loggedAdmin = JSON.parse(localStorage.getItem("loggedAdmin") || "{}");

  if (loggedAdmin.role === "orders") {

    const res = await fetch(`${API_BASE}?action=admin_get_profile&id=${loggedAdmin.id}`);
    const data = await res.json();

    if (data.status !== "success") return;

    const profile = data.admin;

    document.getElementById("admin-avatar-img").src = profile.avatar || "images/profile.png";
    document.getElementById("admin-id").value = profile.username;
    document.getElementById("admin-name").value = profile.firstname + " " + profile.lastname;
    document.getElementById("admin-email").value = profile.email;
    document.getElementById("admin-role").value = "ادمین سفارشات";
    document.getElementById("change-avatar-btn").style.pointerEvents = "auto";
    document.getElementById("change-avatar-btn").style.opacity = "1";

    document.getElementById("change-pass-toggle").style.pointerEvents = "auto";
    document.getElementById("change-pass-toggle").style.opacity = "1";

    document.getElementById("admin-id").disabled = false;
    document.getElementById("admin-name").disabled = false;
    document.getElementById("admin-email").disabled = false;

    document.getElementById("discount-percent").disabled = true;
    document.getElementById("discount-code").disabled = true;
    document.getElementById("discount-save-btn").style.pointerEvents = "none";
    document.getElementById("discount-save-btn").style.opacity = "0.4";

    document.getElementById("shipping-fee-input").disabled = true;
    document.getElementById("shipping-save-btn").style.pointerEvents = "none";
    document.getElementById("shipping-save-btn").style.opacity = "0.4";

    document.querySelectorAll(".role-badge").forEach(badge => {
      badge.style.pointerEvents = "none";
      badge.style.opacity = "0.5";
    });
  }

  if (loggedAdmin.role === "products") {

    const res = await fetch(`${API_BASE}?action=admin_get_profile&id=${loggedAdmin.id}`);
    const data = await res.json();

    if (data.status !== "success") return;

    const profile = data.admin;

    document.getElementById("admin-avatar-img").src = profile.avatar || "images/profile.png";
    document.getElementById("admin-id").value = profile.username;
    document.getElementById("admin-name").value = profile.firstname + " " + profile.lastname;
    document.getElementById("admin-email").value = profile.email;
    document.getElementById("admin-role").value = "ادمین محصولات";

    ["admin-id", "admin-name", "admin-email"].forEach(id => {
      const el = document.getElementById(id);
      el.removeAttribute("disabled");
      el.style.opacity = "1";
    });

    document.getElementById("change-avatar-btn").style.pointerEvents = "auto";
    document.getElementById("change-avatar-btn").style.opacity = "1";

    document.getElementById("change-pass-toggle").style.pointerEvents = "auto";
    document.getElementById("change-pass-toggle").style.opacity = "1";

    document.getElementById("discount-percent").disabled = true;
    document.getElementById("discount-code").disabled = true;
    document.getElementById("discount-save-btn").style.pointerEvents = "none";
    document.getElementById("discount-save-btn").style.opacity = "0.4";

    document.getElementById("shipping-fee-input").disabled = true;
    document.getElementById("shipping-save-btn").style.pointerEvents = "none";
    document.getElementById("shipping-save-btn").style.opacity = "0.4";

    document.querySelectorAll(".role-badge").forEach(badge => {
      badge.style.pointerEvents = "none";
      badge.style.opacity = "0.5";
    });
  }

  if (loggedAdmin.role === "support") {

    const res = await fetch(`${API_BASE}?action=admin_get_profile&id=${loggedAdmin.id}`);
    const data = await res.json();

    if (data.status !== "success") return;

    const profile = data.admin;
    document.getElementById("admin-avatar-img").src = profile.avatar || "images/profile.png";
    document.getElementById("admin-id").value = profile.username;
    document.getElementById("admin-name").value = profile.firstname + " " + profile.lastname;
    document.getElementById("admin-email").value = profile.email;
    document.getElementById("admin-role").value = "ادمین پشتیبانی";

    ["admin-id", "admin-name", "admin-email"].forEach(id => {
      const el = document.getElementById(id);
      el.removeAttribute("disabled");
      el.style.opacity = "1";
    });

    document.getElementById("change-avatar-btn").style.pointerEvents = "auto";
    document.getElementById("change-avatar-btn").style.opacity = "1";

    document.getElementById("change-pass-toggle").style.pointerEvents = "auto";
    document.getElementById("change-pass-toggle").style.opacity = "1";

    document.getElementById("discount-percent").disabled = true;
    document.getElementById("discount-code").disabled = true;
    document.getElementById("discount-save-btn").style.pointerEvents = "none";
    document.getElementById("discount-save-btn").style.opacity = "0.4";

    document.getElementById("shipping-fee-input").disabled = true;
    document.getElementById("shipping-save-btn").style.pointerEvents = "none";
    document.getElementById("shipping-save-btn").style.opacity = "0.4";

    document.querySelectorAll(".discount-history-item").forEach(item => {
      item.style.pointerEvents = "none";
      item.style.opacity = "0.5";
    });

    document.querySelectorAll(".role-badge").forEach(badge => {
      badge.style.pointerEvents = "none";
      badge.style.opacity = "0.5";
    });
  }

  // ===== مدیریت هزینه ارسال =====
  const shippingInput = document.getElementById("shipping-fee-input");
  const shippingSaveBtn = document.getElementById("shipping-save-btn");
  const shippingMsg = document.getElementById("shipping-save-msg");

  fetch(`${API_BASE}?action=admin_get_shipping_fee`)
    .then(res => res.json())
    .then(data => {
      if (data.status === "success" && data.fee !== null) {
        shippingInput.value = data.fee;
      }
    });

  shippingInput.addEventListener("input", () => {
    shippingSaveBtn.classList.remove("hidden");
    shippingMsg.classList.add("hidden");
  });

  // ذخیره هزینه ارسال
  shippingSaveBtn.addEventListener("click", async () => {

    const fee = Number(shippingInput.value);

    if (!fee || fee < 0) {
      alert("لطفاً مبلغ معتبر وارد کنید.");
      return;
    }

    const res = await fetch(`${API_BASE}?action=admin_update_shipping_fee`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `fee=${fee}`
    });

    const data = await res.json();
    if (data.status === "success") {

      shippingMsg.classList.remove("hidden");
      shippingSaveBtn.classList.add("hidden");

      setTimeout(() => shippingMsg.classList.add("hidden"), 1500);
    }
  });


  const discountPercentInput = document.getElementById("discount-percent");
  const discountCodeInput = document.getElementById("discount-code");
  const discountSaveBtn = document.getElementById("discount-save-btn");
  const discountHistoryToggle = document.getElementById("discount-history-toggle");
  const discountHistoryBox = document.getElementById("discount-history-box");
  const discountHistoryList = document.getElementById("discount-history-list");
  const emptyHistoryP = discountHistoryBox
    ? discountHistoryBox.querySelector(".empty-history")
    : null;

  async function renderDiscountHistory() {

    if (!discountHistoryList || !discountHistoryBox) return;

    const codes = await loadDiscountCodes();

    discountHistoryList.innerHTML = "";

    if (!codes.length) {
      if (emptyHistoryP) emptyHistoryP.style.display = "block";
      return;
    }

    if (emptyHistoryP) emptyHistoryP.style.display = "none";

    codes.sort((a, b) => (b.created_at ? new Date(b.created_at) : 0) - (a.created_at ? new Date(a.created_at) : 0));

    codes.forEach(c => {
      const row = document.createElement("div");
      row.className = "discount-history-item";

      const statusText = (c.status === "inactive") ? "غیرفعال" : "فعال";

      row.innerHTML = `
      <div class="discount-history-row">
          <span class="discount-history-code">${c.code}</span>
          <span class="discount-history-percent">${c.percent}%</span>
          <span class="discount-history-status">${statusText}</span>
      </div>
    `;

      discountHistoryList.appendChild(row);
    });

    bindDiscountHistoryEvents();
  }

  let selectedDiscountCode = null;

  function bindDiscountHistoryEvents() {

    const items = document.querySelectorAll(".discount-history-item");
    const actionsBox = document.getElementById("discount-status-actions");
    const btnActive = document.getElementById("discount-set-active");
    const btnInactive = document.getElementById("discount-set-inactive");

    items.forEach(item => {

      item.addEventListener("click", async () => {

        items.forEach(i => i.classList.remove("selected"));
        item.classList.add("selected");

        selectedDiscountCode = item.querySelector(".discount-history-code").textContent.trim();

        actionsBox.classList.remove("hidden");

        const codes = await loadDiscountCodes();
        const found = codes.find(c => c.code === selectedDiscountCode);

        if (found && found.status === "active") {
          btnActive.style.opacity = "1";
          btnInactive.style.opacity = "0.5";
        } else {
          btnActive.style.opacity = "0.5";
          btnInactive.style.opacity = "1";
        }
      });

    });

    btnActive.onclick = async () => {
      if (!selectedDiscountCode) return;

      await fetch(`${API_BASE}?action=admin_set_discount_status`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `code=${encodeURIComponent(selectedDiscountCode)}&status=active`
      });

      btnActive.style.opacity = "1";
      btnInactive.style.opacity = "0.5";

      await renderDiscountHistory();
    };

    btnInactive.onclick = async () => {
      if (!selectedDiscountCode) return;

      await fetch(`${API_BASE}?action=admin_set_discount_status`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `code=${encodeURIComponent(selectedDiscountCode)}&status=inactive`
      });

      btnActive.style.opacity = "0.5";
      btnInactive.style.opacity = "1";

      await renderDiscountHistory();
    };

  }

  if (discountHistoryToggle && discountHistoryBox) {
    discountHistoryToggle.addEventListener("click", () => {
      discountHistoryBox.classList.toggle("hidden");
      if (!discountHistoryBox.classList.contains("hidden")) {
        renderDiscountHistory();
      }
    });
  }

  if (discountSaveBtn && discountPercentInput && discountCodeInput) {
    discountSaveBtn.addEventListener("click", async () => {

      const percent = parseInt(discountPercentInput.value.trim(), 10);
      const codeRaw = discountCodeInput.value.trim();

      if (!percent || percent < 1 || percent > 100) {
        alert("درصد تخفیف باید بین ۱ تا ۱۰۰ باشد.");
        return;
      }

      if (!codeRaw) {
        alert("لطفاً کد تخفیف وارد کنید.");
        return;
      }

      const code = codeRaw.toUpperCase();

      await fetch(`${API_BASE}?action=admin_save_discount_code`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:
          `code=${encodeURIComponent(code)}` +
          `&percent=${percent}` +
          `&status=active`
      });

      alert("کد با موفقیت ثبت شد.");

      discountPercentInput.value = "";
      discountCodeInput.value = "";

      renderDiscountHistory();
    });
  }

  if (loggedAdmin.role === "super") {
    loadAdminInfo();
  }

  activateAdminSettingsLogic();

  async function openRoleModalForUser() {

    const email = this.dataset.uid;

    const res = await fetch(`${API_BASE}?action=admin_get_user_role&email=${email}`);
    const data = await res.json();

    if (data.status !== "success") return;

    const user = data.user;
    const admin = data.admin;

    document.getElementById("role-modal").classList.add("active");
    document.getElementById("role-fullname").value = `${user.firstname} ${user.lastname}`;
    document.getElementById("role-email").value = user.email;
    document.getElementById("role-select").value = user.role || "user";

    document.getElementById("role-username").value = admin?.username || "";
    document.getElementById("role-password").value = admin?.password || "";
  }

  if (loggedAdmin.role === "super") {
    document.querySelectorAll(".role-badge").forEach(badge => {
      badge.addEventListener("click", openRoleModalForUser);
    });
  }

  document.querySelector(".close-role-modal").onclick = () => {
    document.getElementById("role-modal").classList.remove("active");
  };

  // ذخیره نقش
  document.getElementById("role-save-btn").onclick = async () => {

    const role = document.getElementById("role-select").value;
    const username = document.getElementById("role-username").value.trim();
    const password = document.getElementById("role-password").value.trim();
    const email = document.getElementById("role-email").value.trim();

    if (role !== "user") {
      if (!username) {
        alert("شناسه ورود الزامی است");
        return;
      }
      if (!password) {
        alert("رمز عبور الزامی است");
        return;
      }
    }

    await fetch(`${API_BASE}?action=admin_update_user_role`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    document.getElementById("role-modal").classList.remove("active");

    renderSettingsPage(); 
  };
}

async function activateAdminSettingsLogic() {

  const avatarInput = document.getElementById("admin-avatar-input");
  const changeAvatarBtn = document.getElementById("change-avatar-btn");
  const avatarImg = document.getElementById("admin-avatar-img");
  const changePassToggle = document.getElementById("change-pass-toggle");
  const passFields = document.getElementById("change-pass-fields");
  const saveBtn = document.getElementById("admin-save-btn");

  const loggedAdmin = JSON.parse(localStorage.getItem("loggedAdmin") || "{}");
  if (!loggedAdmin.id) return;

  //          تغییر آواتار
  changeAvatarBtn.onclick = () => avatarInput.click();

  avatarInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("id", loggedAdmin.id);

    const res = await fetch(`${API_BASE}?action=admin_upload_avatar`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.status === "success") {
      const imgUrl = data.url; 

      document.getElementById("admin-avatar-img").src = imgUrl;

      const header = document.querySelector(".user-avatar");
      if (header) header.src = imgUrl;
    }
  };

  changePassToggle.onclick = () => {
    passFields.classList.toggle("hidden");
  };

  document.querySelectorAll("#admin-id, #admin-name, #admin-email")
    .forEach(input => input.addEventListener("input", showSaveBtn));

  document.querySelectorAll("#admin-old-pass, #admin-new-pass, #admin-new-pass-repeat")
    .forEach(input => input.addEventListener("input", showSaveBtn));

  function showSaveBtn() {
    saveBtn.classList.remove("hidden");
  }

  saveBtn.onclick = async () => {

    const username = document.getElementById("admin-id").value.trim();
    const fullname = document.getElementById("admin-name").value.trim();
    const email = document.getElementById("admin-email").value.trim();

    const oldPass = document.getElementById("admin-old-pass").value.trim();
    const newPass = document.getElementById("admin-new-pass").value.trim();
    const repeatPass = document.getElementById("admin-new-pass-repeat").value.trim();

    const eOld = document.getElementById("admin-old-pass-error");
    const eNew = document.getElementById("admin-new-pass-error");
    const eRepeat = document.getElementById("admin-new-pass-repeat-error");

    [eOld, eNew, eRepeat].forEach(el => el.classList.remove("active"));

    //   تغییر رمز عبور
    if (oldPass || newPass || repeatPass) {

      if (newPass.length < 4) {
        eNew.textContent = "رمز جدید باید حداقل ۴ کاراکتر باشد.";
        eNew.classList.add("active");
        return;
      }

      if (newPass !== repeatPass) {
        eRepeat.textContent = "تکرار رمز صحیح نیست.";
        eRepeat.classList.add("active");
        return;
      }

      const passRes = await fetch(`${API_BASE}?action=admin_change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id=${loggedAdmin.id}&old=${encodeURIComponent(oldPass)}&new=${encodeURIComponent(newPass)}`
      });

      const passData = await passRes.json();

      if (passData.status === "error") {
        eOld.textContent = "رمز فعلی اشتباه است.";
        eOld.classList.add("active");
        return;
      }
    }

    //   ذخیره اطلاعات پروفایل
    await fetch(`${API_BASE}?action=admin_update_info`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:
        `id=${loggedAdmin.id}` +
        `&username=${encodeURIComponent(username)}` +
        `&name=${encodeURIComponent(fullname)}` +
        `&email=${encodeURIComponent(email)}`
    });

    saveBtn.textContent = "ذخیره شد ✔️";
    setTimeout(() => {
      saveBtn.textContent = "ذخیره";
      saveBtn.classList.add("hidden");
    }, 1500);
  };

  ["admin-old-pass", "admin-new-pass", "admin-new-pass-repeat"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      document.getElementById(id + "-error").classList.remove("active");
    });
  });

}

function renderDashboardCustomersBox(container) {
  const users = JSON.parse(localStorage.getItem("userDataList") || "[]");

  let html = "";

  users.forEach(u => {
    html += `
            <div class="customerRow">
    <div class="imgBx smallAvatar">
        <img src="images/profile.png">
    </div>

    <div class="customer-info">
        <h4>${u.firstname} ${u.lastname}</h4>
        <span class="email">${u.email}</span>
    </div>

    <span class="role-badge ${u.role || 'user'}" data-uid="${u.email}">
        ${getRoleLabel(u.role)}
    </span>
</div>
        `;
  });

  container.innerHTML = html;
}

function renderDashboardRecentUsersCard() {

  const users = JSON.parse(localStorage.getItem("userDataList") || "[]");

  const recent = users.reverse();

  const card = document.createElement("div");
  card.className = "settings-card"; 

  card.innerHTML = `
    <h2 class="settings-title">کاربران جدید</h2>
    <div class="dashboardCustomersList" style="margin-top:15px;">
      ${recent.map(u => `
          <div class="customerRow">

            <div class="user-block">
                <div class="imgBx smallAvatar">
                    <img src="images/profile.png">
                </div>

                <div class="customer-info">
                    <h4>${u.firstname} ${u.lastname}</h4>
                    <span class="email">${u.email}</span>
                </div>
            </div>

          </div>
      `).join("")}
    </div>
  `;

  return card;
}

function getRoleLabel(role) {
  switch (role) {
    case "super": return "مدیر اصلی";
    case "orders": return "ادمین سفارشات";
    case "products": return "ادمین محصولات";
    case "support": return "ادمین پشتیبانی";
    default: return "کاربر عادی";
  }
}

function applyAdminRolePermissions() {
  const logged = JSON.parse(localStorage.getItem("loggedAdmin") || "{}");
  const role = logged.role; // super, orders, products, support

  const ordersSection = document.querySelector(".recentOrders");
  const productsSection = document.querySelector(".recentProducts");
  const customersSection = document.querySelector(".recentCustomers");
  const messagesSection = document.querySelector(".recentMessages");
  const ticketsSection = document.querySelector(".recentTickets");

  const addProductBtn = document.querySelector(".new-product-btn");
  const productActionButtons = document.querySelectorAll(".pm-update-btn, .pm-disable-btn, .pm-enable-btn, .pm-disable-permanent-btn");

  const deleteOrderIcon = document.querySelectorAll(".delete-icon");
  const deleteProductIcon = document.querySelectorAll(".delete-icon-product");
  const deleteCustomerIcon = document.querySelectorAll(".delete-customer-icon");

  const messageActionButtons = document.querySelectorAll(".msg-badge");
  const ticketActionButtons = document.querySelectorAll(".ticket-action");

  if (role === "super") {
    return; 
  }

  if (role === "orders") {
    document.querySelectorAll(
      "#add-new-product, .new-product-btn, .pm-update-btn, .pm-disable-btn, .pm-enable-btn, .pm-disable-permanent-btn, #pm-add-btn"
    ).forEach(btn => {
      btn.style.pointerEvents = "none";
      btn.style.opacity = ".4";
    });

    document.addEventListener("click", e => {
      if (e.target.closest(".recentProducts tr")) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    document.addEventListener("click", e => {
      if (logged.role === "orders") {
        if (e.target.closest(".delete-customer-icon")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    });

    document.querySelectorAll(".delete-customer-icon").forEach(icon => {
      icon.style.pointerEvents = "none";
      icon.style.opacity = "0.4";
    });

    document.addEventListener("click", e => {
      if (e.target.closest(".clickable-address")) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    document.addEventListener("click", e => {
      if (e.target.closest(".clickable-orders")) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    document.querySelectorAll(".clickable-address, .clickable-orders").forEach(el => {
      el.style.pointerEvents = "none";
      el.style.opacity = ".5";
    });

    document.querySelectorAll(".delete-msg-icon").forEach(icon => {
      icon.style.pointerEvents = "none";
      icon.style.opacity = ".4";
    });

    document.addEventListener("click", e => {
      if (e.target.closest(".msg-status-cell")) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    document.querySelectorAll(".msg-status-cell").forEach(el => {
      el.style.pointerEvents = "none";
      el.style.opacity = ".5";
    });

    document.querySelectorAll(".delete-ticket-icon").forEach(icon => {
      icon.style.pointerEvents = "none";
      icon.style.opacity = ".4";
    });

    document.addEventListener("click", e => {
      if (e.target.closest(".ticket-status-cell")) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    document.querySelectorAll(".ticket-status-cell").forEach(el => {
      el.style.pointerEvents = "none";
      el.style.opacity = ".5";
    });

    return;
  }

  if (role === "products") {

    document.querySelectorAll(".tracking, .tracking-clickable, .clickable").forEach(el => {
      el.style.pointerEvents = "none";
      el.style.opacity = "0.6";
    });

    document.querySelectorAll(".delete-icon").forEach(icon => {
      icon.style.pointerEvents = "none";
      icon.style.opacity = "0.4";
    });

    document.querySelectorAll(".delete-customer-icon").forEach(icon => {
      icon.style.pointerEvents = "none";
      icon.style.opacity = "0.4";
    });

    document.querySelectorAll(".delete-msg-icon").forEach(icon => {
      icon.style.pointerEvents = "none";
      icon.style.opacity = "0.4";
    });

    document.querySelectorAll(".msg-status-cell").forEach(cell => {
      cell.style.pointerEvents = "none";
      cell.style.opacity = "0.5";
    });

    document.querySelectorAll(".delete-ticket-icon").forEach(icon => {
      icon.style.pointerEvents = "none";
      icon.style.opacity = "0.4";
    });

    document.querySelectorAll(".ticket-status-cell").forEach(cell => {
      cell.style.pointerEvents = "none";
      cell.style.opacity = "0.5";
    });

    document.querySelectorAll(".role-badge").forEach(b => {
      b.style.pointerEvents = "none";
      b.style.opacity = "0.5";
    });

    ["#discount-percent", "#discount-code"].forEach(sel => {
      let el = document.querySelector(sel);
      if (el) el.disabled = true;
    });

    const saveDiscountBtn = document.getElementById("discount-save-btn");
    if (saveDiscountBtn) {
      saveDiscountBtn.style.pointerEvents = "none";
      saveDiscountBtn.style.opacity = "0.5";
    }

    document.querySelectorAll(".discount-history-item").forEach(item => {
      item.style.pointerEvents = "none";
      item.style.opacity = "0.5";
    });

    if (document.getElementById("discount-set-active"))
      document.getElementById("discount-set-active").style.pointerEvents = "none";

    if (document.getElementById("discount-set-inactive"))
      document.getElementById("discount-set-inactive").style.pointerEvents = "none";

    const shipInput = document.getElementById("shipping-fee-input");
    const shipBtn = document.getElementById("shipping-save-btn");

    if (shipInput) shipInput.disabled = true;
    if (shipBtn) {
      shipBtn.style.pointerEvents = "none";
      shipBtn.style.opacity = "0.5";
    }

    document.addEventListener("click", (e) => {
      if (
        e.target.closest(".tracking") ||
        e.target.closest(".tracking-clickable") ||
        e.target.closest(".clickable")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    document.querySelectorAll(".tracking, .tracking-clickable, .clickable")
      .forEach(el => {
        el.style.pointerEvents = "none";
        el.style.opacity = "0.5";
      });

    document.addEventListener("click", (e) => {
      if (
        e.target.closest(".clickable-address") ||
        e.target.closest(".clickable-orders")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    document.querySelectorAll(".clickable-address, .clickable-orders")
      .forEach(el => {
        el.style.pointerEvents = "none";
        el.style.opacity = "0.5";
      });

    return;
  }

  if (role === "support") {
    document.querySelectorAll(".tracking, .tracking-clickable, .clickable").forEach(el => {
      el.style.pointerEvents = "none";
      el.style.opacity = "0.5";
    });

    document.querySelectorAll(".delete-icon").forEach(icon => {
      icon.style.pointerEvents = "none";
      icon.style.opacity = "0.4";
    });

    function blockOrderModal(e) {
      if (e.target.closest(".tracking") || e.target.closest(".clickable")) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    document.addEventListener("click", blockOrderModal, true);

    document.querySelectorAll(".status-pill").forEach(el => {
      el.style.pointerEvents = "none";
      el.style.opacity = "0.5";
    });

    document.addEventListener("click", e => {
      if (e.target.closest(".status-pill")) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    document.addEventListener("click", e => {
      if (e.target.closest(".clickable-address")) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    document.addEventListener("click", e => {
      if (e.target.closest(".clickable-orders")) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    document.querySelectorAll(".clickable-address, .clickable-orders").forEach(el => {
      el.style.pointerEvents = "none";
      el.style.opacity = "0.5";
    });

    const newBtn = document.getElementById("new-product-btn") || document.getElementById("add-new-product");
    if (newBtn) {
      newBtn.style.pointerEvents = "none";
      newBtn.style.opacity = "0.4";
    }

    document.querySelectorAll(".pm-buttons, .product-enable-btn, .product-disable-btn").forEach(el => {
      el.style.pointerEvents = "none";
      el.style.opacity = "0.5";
    });

    document.querySelectorAll(".delete-customer-icon").forEach(icon => {
      icon.style.pointerEvents = "none";
      icon.style.opacity = "0.4";
    });

    ["#discount-percent", "#discount-code", "#shipping-fee-input"].forEach(sel => {
      let el = document.querySelector(sel);
      if (el) el.disabled = true;
    });

    document.querySelectorAll(".role-badge").forEach(badge => {
      badge.style.pointerEvents = "none";
      badge.style.opacity = "0.5";
    });

    const discSave = document.getElementById("discount-save-btn");
    if (discSave) {
      discSave.style.pointerEvents = "none";
      discSave.style.opacity = "0.4";
    }

    const shipBtn = document.getElementById("shipping-save-btn");
    if (shipBtn) {
      shipBtn.style.pointerEvents = "none";
      shipBtn.style.opacity = "0.4";
    }

    document.querySelectorAll(".discount-history-item").forEach(el => {
      el.style.pointerEvents = "none";
      el.style.opacity = "0.5";
    });

    const act = document.getElementById("discount-set-active");
    const inact = document.getElementById("discount-set-inactive");
    if (act) act.style.pointerEvents = "none";
    if (inact) inact.style.pointerEvents = "none";

    return;
  }
}

// ========== تخفیف‌ها (سمت مدیر) ==========

async function loadDiscountCodes() {
  const res = await fetch(`${API_BASE}?action=admin_get_discount_codes`);
  const data = await res.json();
  return data.status === "success" ? data.codes : [];
}

async function saveDiscountCodes(list) {
  for (const item of list) {
    await fetch(`${API_BASE}?action=admin_save_discount_code`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:
        `code=${encodeURIComponent(item.code)}` +
        `&percent=${item.value}` +
        `&status=${item.active ? "active" : "inactive"}`
    });
  }
}

function handleAdminSearch(keyword) {
  if (!CURRENT_ADMIN_PAGE) return;

  switch (CURRENT_ADMIN_PAGE) {
    case "orders":
      searchTableRows(".recentOrders table tbody tr", keyword);
      break;

    case "products":
      searchTableRows(".recentProducts table tbody tr", keyword);
      break;

    case "customers":
      searchTableRows(".recentCustomers table tbody tr", keyword);
      break;

    case "messages":
      searchTableRows(".recentMessages table tbody tr", keyword);
      break;

    case "tickets":
      searchTableRows(".recentTickets table tbody tr", keyword);
      break;

    default:
      break;
  }
}

function searchTableRows(selector, keyword) {
  const rows = document.querySelectorAll(selector);

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(keyword) ? "" : "none";
  });
}

async function renderDashboardPage() {
  switchToDefaultLayout();

  const leftBox = document.querySelector(".dashboardCustomers");
  if (leftBox) {
    leftBox.innerHTML = `
            <div class="settings-card">
                <h2 class="settings-title">مشتریان اخیر</h2>
                <div class="dashboardCustomersList dashboardCustomersList--dashboard" style="margin-top:10px;"></div>
            </div>
        `;
    const listEl = leftBox.querySelector(".dashboardCustomersList--dashboard");
    await renderRecentDashboardCustomers(listEl);
  }

  const container = document.querySelector(
    ".recentOrders, .recentProducts, .recentCustomers, .recentMessages, .recentTickets, .recentSettings, .recentDashboard"
  );

  container.classList.remove(
    "recentOrders", "recentProducts", "recentCustomers",
    "recentMessages", "recentTickets", "recentSettings"
  );
  container.classList.add("recentDashboard");

  container.innerHTML = `
        <div class="cardHeader">
            <h2>گزارش فروش امروز</h2>
        </div>

        <table>
            <tbody id="dashboard-body"></tbody>
        </table>
    `;

  const tbody = document.getElementById("dashboard-body");

  tbody.innerHTML = `
        <tr><td>
            <div class="dashboard-section">

                <div class="today-stats-card">
                    <div class="stat-box">
                        <p class="stat-number" id="todayOrders">0</p>
                        <p class="stat-label">تعداد سفارش‌های امروز</p>
                    </div>

                    <div class="divider"></div>

                    <div class="stat-box">
                        <p class="stat-number" id="todaySales">0</p>
                        <p class="stat-label">مبلغ فروش امروز</p>
                    </div>
                </div>

                <div class="chart-card">
                    <h3 class="chart-title">تعداد سفارش‌های هفته</h3>
                    <canvas id="weeklyChart"></canvas>
                </div>

            </div>
        </td></tr>
    `;

  // محاسبه آمار امروز
  const today = await getTodayOrders();
  document.getElementById("todayOrders").textContent =
    today.count.toLocaleString('fa-IR');
  document.getElementById("todaySales").textContent =
    today.sales.toLocaleString('fa-IR');

  // رسم نمودار هفته
  const stats = await getDailyStats(60); // مثلا ۶۰ روز اخیر

  const ctx = document.getElementById('weeklyChart');

  // مشخص کردن اینکه در شروع فقط ۷ روز آخر دیده شوند
  const visibleDays = 7;
  const totalDays = stats.labels.length;
  const xMin = Math.max(0, totalDays - visibleDays);
  const xMax = totalDays - 1;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: stats.labels,
      datasets: [{
        data: stats.data,
        backgroundColor: '#00c853',
        borderRadius: 6
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x'
          },
          pan: {
            enabled: true,
            mode: 'x'
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          min: xMin,     
          max: xMax       
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            stepSize: 1,
            callback: v => Number.isInteger(v) ? v : ""
          }
        }
      }
    }
  });
}


function loadDashboardCustomerList() {
  const users = JSON.parse(localStorage.getItem("userDataList") || "[]");
  const tbody = document.getElementById("dashboard-customer-list-body");

  tbody.innerHTML = "";

  users.reverse().forEach(u => {
    tbody.innerHTML += `
            <tr>
                <td>${u.firstname} ${u.lastname}</td>
                <td>${u.email}</td>
                <td>${u.registerDate || "-"}</td>
            </tr>
        `;
  });
}

async function renderRecentDashboardCustomers(listBox) {
  if (!listBox) return;

  const res = await fetch(`${API_BASE}?action=admin_get_users`);
  const data = await res.json();

  if (data.status !== "success") {
    console.warn("خطا در دریافت لیست کاربران");
    return;
  }

  const users = data.users; 
  listBox.innerHTML = "";
  users.forEach(u => {
    listBox.innerHTML += `
      <div class="customerRow" 
           style="display:flex; align-items:center; justify-content:flex-start; padding:10px 5px; border-bottom:1px solid #eee;">

        <div class="imgBx smallAvatar">
          <img src="images/profile.png">
        </div>

        <div class="customer-info" style="display:flex; flex-direction:column; margin-right:10px;">
          <h4 style="font-size:15px; margin:0;">
            ${u.firstname} ${u.lastname}
          </h4>
          <span class="email" style="font-size:13px; opacity:0.7;">
            ${u.email}
          </span>
        </div>

      </div>
    `;
  });

  const rows = listBox.querySelectorAll(".customerRow");
  if (rows.length > 0) {
    rows[rows.length - 1].style.borderBottom = "none";
  }
}

async function getAllOrders() {
  const res = await fetch(`${API_BASE}?action=admin_get_all_orders`);
  const data = await res.json();

  if (data.status !== "success") {
    console.warn("خطا در دریافت سفارش‌ها");
    return [];
  }

  return data.orders;
}

function getOrderYMD(order) {
  if (!order.date) return null;
  const norm = normalizePersianDateTime(order.date, order.time || "00:00:00");
  return norm.split(" ")[0]; 
}

async function getTodayOrders() {
  const all = await getAllOrders();

  const todayRaw = new Date().toLocaleDateString("fa-IR");
  const todayNormalized = normalizePersianDateTime(todayRaw, "00:00:00").split(" ")[0];

  let count = 0;
  let sales = 0;

  all.forEach(o => {
    if (!o.date) return;

    const orderNormalized = normalizePersianDateTime(o.date, o.time || "00:00:00").split(" ")[0];

    if (orderNormalized === todayNormalized) {
      count++;

      const payable = Number(o.total_payable || o.totalPayable || 0);
      if (!isNaN(payable)) sales += payable;
    }
  });

  return { count, sales };
}

async function getDailyStats(days = 60) {
  const all = await getAllOrders();

  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const p = new persianDate().subtract('days', i);
    const ymd = normalizePersianDateTime(p.format("YYYY/MM/DD"), "00:00:00").split(" ")[0];

    buckets.push({
      ymd,
      label: p.format("MM/DD"),
      count: 0
    });
  }

  all.forEach(o => {
    if (!o.date) return;

    const orderDate = normalizePersianDateTime(o.date, o.time || "00:00:00").split(" ")[0];
    const bucket = buckets.find(b => b.ymd === orderDate);

    if (bucket) bucket.count++;
  });

  return {
    labels: buckets.map(b => b.label),
    data: buckets.map(b => b.count)
  };
}