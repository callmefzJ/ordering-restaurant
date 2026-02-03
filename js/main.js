var swiper = new Swiper(".commentSwiper", {
    loop: true,
    navigation: {
        nextEl: "#next",
        prevEl: "#prev",
    },
});

let globalMenuSwiper = null;
let isUserSignedIn = !!localStorage.getItem("userData");
let listCarts = [];
let popularProducts = [];
let map;
let marker;
let addressFormMode = 'add';
let editingAddressId = null;
let pendingDeleteAddressId = null;
let lastOrderSubtotal = 0;
let currentDiscountAmount = 0;
let orderSubmitAttached = false;

let DELIVERY_FEE = 60000; // مقدار پیش‌فرض

// بارگذاری از دیتابیس
fetch("api.php?action=admin_get_shipping_fee")
    .then(res => res.json())
    .then(data => {
        if (data.status === "success" && data.fee !== null) {
            DELIVERY_FEE = Number(data.fee);
            localStorage.setItem("shipping_fee", DELIVERY_FEE);
        }
    })
    .catch(err => console.error("خطا در دریافت هزینه ارسال:", err));

function clearAuthForms() {
    const loginForm = document.getElementById('login-form-default');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.reset();
        // حذف دستی مقادیر در صورت نگه داشتن توسط مرورگر
        loginForm.querySelectorAll('input').forEach(input => input.value = '');
    }

    if (signupForm) {
        signupForm.reset();
        signupForm.querySelectorAll('input').forEach(input => input.value = '');
    }
}

function normalize(text) {
    if (!text) return "";

    return text
        .toString()
        .trim()
        .toLowerCase()
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\s+/g, " ");
}

document.addEventListener('DOMContentLoaded', () => {
    const cartIcon = document.querySelector('.cart-icon');
    const cartTab = document.querySelector('.cart-tab');
    const closeBtn = document.querySelector('.close-btn');
    const navbar = document.querySelector('.navbar');
    const cardList = document.querySelector('.card-list');
    const cartList = document.querySelector('.cart-list');
    const cartTotal = document.querySelector('.cart-total');
    const cartValue = document.querySelector('.cart-value');
    const hamburger = document.querySelector('.hamburger');
    const mobileMenue = document.querySelector('.mobile-menu');
    const signInBtn = document.querySelector('.btn');
    const initialView = document.getElementById('initial-view');
    const signupView = document.getElementById('signup-view');
    const adminView = document.getElementById('admin-view');
    const showSignupBtn = document.getElementById('show-signup-btn');
    const showAdminLoginBtn = document.getElementById('show-admin-login-btn');
    const backToInitialBtns = document.querySelectorAll('.back-to-initial'); // برای دکمه‌های بازگشت
    const loginFormDefault = document.getElementById('login-form-default');
    const signupForm = document.getElementById('signup-form');
    const adminLoginForm = document.getElementById('admin-login-form');
    const modalOverlay = document.querySelector('.modal-overlay');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const checkoutBtn = document.querySelector('.btn-container .btn:last-child');
    const checkoutMessage = document.querySelector('.checkout-message');
    const desktopSignInBtn = document.querySelector('.desktop-action .btn');
    const mobileSignInBtn = document.querySelector('.mobile-menu .btn');
    const checkoutModalOverlay = document.querySelector('.checkout-modal-overlay');
    const backToCartBtn = document.querySelector('.back-to-cart-btn');
    const orderSummaryList = document.getElementById('order-summary-list');
    const orderSuccessMessage = document.querySelector('.order-success-message')
    const bars = document.querySelector('.bars');
    const myOrdersOverlay = document.querySelector('.my-orders-overlay');
    const myOrdersCloseBtn = document.querySelector('.my-orders-content .my-orders-close-btn');
    const orderItemsList = document.getElementById('order_items_list');
    const orderTotalPrice = document.getElementById('order_total_price');
    const orderUserName = document.getElementById('order-user-name');
    const orderUserContact = document.getElementById('order-user-contact');
    const orderUserAddress = document.getElementById('order-user-address');
    const orderDate = document.getElementById('order_date');
    const orderTrackingCode = document.getElementById('order_tracking_code');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const orderDetailsContainer = document.getElementById('order-details-container');
    const addAddressLink = document.getElementById('add-address-link');
    const changeAddressLink = document.getElementById('change-address-link');
    const addNewAddressLink = document.getElementById('add-new-address-link');
    const addressMapPage = document.getElementById('address-map-page');
    const closeMapBtn = document.getElementById('close-map');
    const addressForm = document.getElementById('address-form');
    const saveAddressBtn = document.getElementById('save-address-btn');
    const userAddressList = document.getElementById('user-address-list');
    const addressDisplay = document.getElementById('address-display');
    const addAddressWrapper = document.getElementById('add-address-wrapper');
    const mapContainer = document.getElementById('map');
    const mapAddressInput = document.getElementById('address-location');
    const addressDetailsInput = document.getElementById('address-details');
    const addressTitleInput = document.getElementById('address-title');
    const addressPhoneInput = document.getElementById('address-phone');
    const confirmDeleteModal = document.getElementById('confirm-delete-modal');
    const confirmDeleteClose = document.getElementById('confirm-delete-close');
    const confirmDeleteCancel = document.getElementById('confirm-delete-cancel');
    const confirmDeleteOk = document.getElementById('confirm-delete-ok');
    const orderSubtotalEl = document.getElementById('order-subtotal');
    const orderDeliveryEl = document.getElementById('order-delivery');
    const orderPayableEl = document.getElementById('order-payable');
    const discountInput = document.getElementById('discount-code-input');
    const discountMsgEl = document.getElementById('discount-message');
    const submitOrderBtn = document.getElementById('submit-order-btn');
    const orderConfirmationModal = document.getElementById('order-confirmation-modal');
    const confirmationTrackingSpan = document.getElementById('confirmation-tracking-code');
    const confirmationOkBtn = document.getElementById('confirmation-ok-btn');
    const userPhoneProfileInput = document.getElementById('userPhoneProfile');
    const profileAddressList = document.getElementById('profile-address-list');
    const profileAddressDisplay = document.getElementById('profile-address-display');
    const profileAddAddressWrapper = document.getElementById('profile-add-address-wrapper');
    const profileAddAddressLink = document.getElementById('profile-add-address');
    const profileAddNewAddressLink = document.getElementById('profile-add-new-address');
    const supportModal = document.getElementById('support-modal');
    const supportModalClose = document.getElementById('support-modal-close');
    const supportForm = document.getElementById('support-form');
    const supportFileInput = document.getElementById('support-file');
    const supportFileTrigger = document.getElementById('support-file-trigger');
    const supportFileName = document.querySelector('.support-file-name');
    const supportSubmitBtn = document.getElementById('support-submit-btn');
    const supportAuthModal = document.getElementById('support-auth-modal');
    const supportAuthConfirm = document.getElementById('support-auth-confirm');
    const supportAuthCancel = document.getElementById('support-auth-cancel');
    const supportTicketsEmpty = document.getElementById('support-tickets-empty');
    const supportClearHistoryBtn = document.getElementById('support-clear-history');
    const openSupportHistoryBtn = document.getElementById('open-support-history');
    const supportHistoryModal = document.getElementById('support-history-modal');
    const supportHistoryList = document.getElementById('support-history-list');
    const supportHistoryClose = document.getElementById('support-history-close');
    const supportHistoryEmpty = document.getElementById('support-history-empty');
    const supportSuccessModal = document.getElementById('support-success-modal');
    const supportSuccessOk = document.getElementById('support-success-ok');
    const viewSupportTickets = document.getElementById('open-support-history');
    const supportTicketsModal = document.getElementById('support-tickets-modal');
    const closeSupportTickets = document.getElementById('close-support-tickets');
    const supportTicketsList = document.getElementById('support-tickets-list');
    const deleteSelectedTicketsBtn = document.getElementById('delete-selected-tickets');
    const reviewText = document.getElementById("review-text");
    const submitReviewBtn = document.getElementById("submit-review");
    const reviewError = document.getElementById("review-error");
    const reviewSuccessOk = document.getElementById("review-success-ok");
    const reviewSuccessModal = document.getElementById("review-success-modal");
    const reviewLoginError = document.getElementById("review-login-error");
    const reviewTextError = document.getElementById("review-text-error");
    const resetView = document.getElementById('reset-view');
  

    function loginUser() {
        isUserSignedIn = true;
        updateNavbar();
    }

    function logoutUser() {
        isUserSignedIn = false;
        updateNavbar();
    }

    function renderMenuDropdown(categories) {
        const dropdown = document.querySelector('#navbar-links .menu-dropdown .dropdown-content');
        if (!dropdown) return;

        dropdown.innerHTML = "";

        const MAIN_CATEGORIES = {
            "🔥 پر سفارش‌ترین ها": ["پر سفارش‌ترین ها"],
            "🍟 فست فود": ["همبرگر", "پیتزا", "سوخاری", "ساندویچ"],
            "🍝 پاستا": ["پاستا"],
            "🍛 غذاهای ایرانی": ["غذاهای ایرانی"],
            "🥗 سالاد": ["سالاد"],
            "🥤 نوشیدنی": ["نوشیدنی"],
            "🍰 متفرقه": ["متفرقه"]
        };

        Object.keys(MAIN_CATEGORIES).forEach(mainCat => {

            const subCats = MAIN_CATEGORIES[mainCat];

            if (subCats.length === 1) {
                const catName = subCats[0];
                const items = categories[catName] || [];
                const activeItems = items.filter(p =>
                    p.status !== "inactive" && p.status !== "disabled"
                );

                if (activeItems.length === 0) return;

                dropdown.innerHTML += `
                <li class="submenu-toggle">
                    ${mainCat}
                    <ul class="submenu">
                        ${activeItems.map(p => `
                            <li data-card="${p.id}">${p.name}</li>
                        `).join("")}
                    </ul>
                </li>
            `;
            }

            else {
                let html = `
                <li class="submenu-toggle">
                    ${mainCat}
                    <ul class="submenu">
                        ${subCats.map(sub => {

                    const items = categories[sub] || [];
                    const activeItems = items.filter(p =>
                        p.status !== "inactive" && p.status !== "disabled"
                    );

                    if (activeItems.length === 0) return ""; 

                    return `
                                <li class="submenu-toggle">
                                    ${sub}
                                    <ul class="submenu">
                                        ${activeItems.map(p => `
                                            <li data-card="${p.id}">${p.name}</li>
                                        `).join("")}
                                    </ul>
                                </li>
                            `;
                }).join("")}
                    </ul>
                </li>
            `;

                dropdown.innerHTML += html;
            }
        });
    }

    // تابع بروزرسانی منوی بالا
    function updateNavbar() {
        const navbarLinks = document.getElementById('navbar-links');
        if (!navbarLinks) return;

        let html = `
        <li class="menu-dropdown">
            <a href="#menu-section"><i class="fa-solid fa-utensils"></i> منو</a>
            <ul class="dropdown-content"></ul>
        </li>
        <li><a href="#" id="open-profile"><i class="fa-solid fa-user"></i> پروفایل</a></li>
        <li><a href="#tracking-section"><i class="fa-solid fa-box"></i> پیگیری</a></li>
        <li><a href="#contact" class="support-link"><i class="fa-solid fa-headset"></i> پشتیبانی</a></li>
    `;

        // اگر لاگین شده، لینک "سفارش‌های من" رو اضافه کن
        if (isUserSignedIn) {
            html += `
            <li><a href="#" id="open-orders"><i class="fa-solid fa-receipt"></i> سفارش‌های من</a></li>
        `;
        }

        navbarLinks.innerHTML = html;

        if (window.globalCategories) {
            renderMenuDropdown(window.globalCategories);
        }

        const ordersMobileLi = document.getElementById('open-orders-mobile')?.closest('li');
        if (ordersMobileLi) {
            ordersMobileLi.style.display = isUserSignedIn ? 'block' : 'none';
        }

        // دسکتاپ
        const desktopProfile = document.getElementById('open-profile');
        const desktopOrders = document.getElementById('open-orders');

        // موبایل
        const mobileProfile = document.getElementById('open-profile-mobile');
        const mobileOrders = document.getElementById('open-orders-mobile');

        // Helper برای بستن منوی موبایل بعد از کلیک
        const closeMobileMenu = () => {
            const mobileMenu = document.querySelector('.mobile-menu');
            const bars = document.querySelector('.bars'); 
            if (mobileMenu) mobileMenu.classList.remove('mobile-menu-active');
            if (bars) {
                bars.classList.remove('fa-xmark');
                bars.classList.add('fa-bars');
            }
        };

        if (isUserSignedIn) {
            if (desktopProfile) desktopProfile.addEventListener('click', (e) => {
                e.preventDefault();
                openUserInfoSection('profile');
            });
            if (desktopOrders) desktopOrders.addEventListener('click', (e) => {
                e.preventDefault();
                openUserInfoSection('orders');
            });
            if (mobileProfile) mobileProfile.addEventListener('click', (e) => {
                e.preventDefault();
                openUserInfoSection('profile');
                closeMobileMenu();
            });
            if (mobileOrders) mobileOrders.addEventListener('click', (e) => {
                e.preventDefault();
                openUserInfoSection('orders');
                closeMobileMenu();
            });
        } else {
            const openLogin = (e) => {
                e.preventDefault();
                document.querySelector('.modal-overlay').classList.add('active');
                closeMobileMenu();
            };
            if (desktopProfile) desktopProfile.addEventListener('click', openLogin);
            if (desktopOrders) desktopOrders.addEventListener('click', openLogin);
            if (mobileProfile) mobileProfile.addEventListener('click', openLogin);
            if (mobileOrders) mobileOrders.addEventListener('click', openLogin);
        }


        if (submitOrderBtn && !orderSubmitAttached) {
            submitOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOrderSubmit();
            });
            orderSubmitAttached = true;
        }

        if (confirmationOkBtn) {
            confirmationOkBtn.addEventListener('click', () => {
                finalizeOrderUI();   // هم مودال تأیید بسته می‌شه، هم checkout، هم سبد ریست
            });
        }

        // وقتی روی لینک "منو" کلیک شد، منوی موبایل بسته شود
        const menuLinks = document.querySelectorAll('a[href="#menu-section"]');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
         
                setTimeout(() => {
                    closeMobileMenu();
                }, 300);
            });
        });

        // وقتی روی لینک "پیگیری" کلیک شد، منوی موبایل بسته شود
        const trackingLinks = document.querySelectorAll('a[href="#tracking-section"]');
        trackingLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

        document.querySelectorAll('.sign-in-trigger, .mobile-sign-in-btn')
            .forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();

                    if (isUserSignedIn) {
                        const userEmail = localStorage.getItem('userEmail');

                        isUserSignedIn = false;
                        localStorage.removeItem('userEmail');
                        localStorage.removeItem('userData');
                        localStorage.removeItem('user_id');
                        localStorage.removeItem('user_phone');

                        updateUI();
                        updateNavbar();

                        document.querySelector('.user-info-display').style.display = 'none';

                        alert('شما با موفقیت از حساب کاربری خارج شدید.');
                    } else {
                        modalOverlay.classList.add('active');
                    }
                });
            });

        updateUI();
    }

    // ================== مودال پشتیبانی ==================
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('.support-link');
        if (!link) return;

        e.preventDefault();

        // اگر کاربر وارد نشده:
        if (!isUserSignedIn) {
            if (supportAuthModal) {
                supportAuthModal.classList.remove('hidden');
            }
            return;
        }

        // اگر کاربر وارد شده:
        if (supportModal) {
            supportModal.classList.remove('hidden');
            renderSupportTicketsFromServer();
        }
    });

    // دکمه انصراف: فقط بستن مودال هشدار
    if (supportAuthCancel && supportAuthModal) {
        supportAuthCancel.addEventListener('click', () => {
            supportAuthModal.classList.add('hidden');
        });
    }

    // دکمه تایید: بستن هشدار + باز کردن مودال ورود
    if (supportAuthConfirm && supportAuthModal && modalOverlay) {
        supportAuthConfirm.addEventListener('click', () => {
            supportAuthModal.classList.add('hidden');

            // نمایش مودال لاگین (با همون الگوی بقیه‌جاها)
            modalOverlay.classList.remove('hidden');
            modalOverlay.classList.add('active');
        });
    }

    if (supportModal && supportModalClose) {
        // بستن با X
        supportModalClose.addEventListener('click', () => {
            supportModal.classList.add('hidden');
        });

        supportModal.addEventListener('click', (e) => {
            if (e.target === supportModal) {
                supportModal.classList.add('hidden');
            }
        });
    }

    if (supportFileTrigger && supportFileInput) {
        supportFileTrigger.addEventListener('click', () => {
            supportFileInput.click();
        });
    }

    if (supportFileInput && supportFileName) {
        supportFileInput.addEventListener('change', () => {
            if (supportFileInput.files && supportFileInput.files.length) {
                const names = Array.from(supportFileInput.files).map(f => f.name);
                supportFileName.textContent = names.join(' ، ');
            } else {
                supportFileName.textContent = 'فایلی انتخاب نشده است';
            }
        });
    }

    if (supportSubmitBtn && supportForm) {
        supportSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const titleInput = document.getElementById('support-title');
            const messageInput = document.getElementById('support-message');
            const titleError = document.getElementById('support-title-error');
            const messageError = document.getElementById('support-message-error');

            const title = titleInput.value.trim();
            const message = messageInput.value.trim();

            // پاک کردن خطاهای قبلی
            titleError.textContent = '';
            messageError.textContent = '';
            titleInput.classList.remove('error');
            messageInput.classList.remove('error');

            let hasError = false;

            if (!title) {
                titleError.textContent = 'لطفاً عنوان درخواست را وارد کنید.';
                titleInput.classList.add('error');
                hasError = true;
            }

            if (!message) {
                messageError.textContent = 'لطفاً متن درخواست را وارد کنید.';
                messageInput.classList.add('error');
                hasError = true;
            }

            if (hasError) return;

            const userId = localStorage.getItem('user_id');

            // ارسال تیکت به سرور
            const res = await fetch("api.php?action=save_ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    title,
                    message
                })
            });

            const data = await res.json();

            if (data.status === "success") {
                // پاک کردن فرم
                titleInput.value = "";
                messageInput.value = "";

                // دریافت تیکت‌های جدید از سرور
                renderSupportTicketsFromServer();

                // نمایش پیام موفقیت
                if (supportSuccessModal) {
                    supportSuccessModal.classList.remove('hidden');
                    supportSuccessModal.classList.add('active');
                }
            } else {
                alert("خطا در ارسال: " + data.message);
            }
        });
    }

    if (supportSuccessOk && supportSuccessModal && supportModal && supportForm) {
        supportSuccessOk.addEventListener('click', () => {
            supportSuccessModal.classList.add('hidden');
            supportSuccessModal.classList.remove('active');

            // بستن مودال پشتیبانی
            supportModal.classList.add('hidden');

            // ریست فرم پشتیبانی
            supportForm.reset();

            if (supportFileInput) {
                supportFileInput.value = '';
            }
            if (supportFileName) {
                supportFileName.textContent = 'فایلی انتخاب نشده است';
            }

            // پاک کردن خطاها و استایل error
            const titleInput = document.getElementById('support-title');
            const messageInput = document.getElementById('support-message');
            const titleError = document.getElementById('support-title-error');
            const messageError = document.getElementById('support-message-error');

            if (titleError) titleError.textContent = '';
            if (messageError) messageError.textContent = '';
            if (titleInput) titleInput.classList.remove('error');
            if (messageInput) messageInput.classList.remove('error');
        });
    }

    if (openSupportHistoryBtn) {
        openSupportHistoryBtn.addEventListener('click', () => {
            renderSupportTicketsFromServer();
            supportTicketsModal.classList.remove('hidden');
            supportTicketsModal.classList.add('active');
        });
    }

    if (closeSupportTickets) {
        closeSupportTickets.addEventListener('click', () => {
            supportTicketsModal.classList.add('hidden');
            supportTicketsModal.classList.remove('active');
        });
    }

    if (deleteSelectedTicketsBtn) {
        deleteSelectedTicketsBtn.addEventListener('click', async () => {

            const checkboxes = supportTicketsList.querySelectorAll('.ticket-checkbox:checked');

            if (checkboxes.length === 0) {
                alert("لطفاً حداقل یک مورد را انتخاب کنید.");
                return;
            }

            const idsToDelete = Array.from(checkboxes).map(cb => Number(cb.dataset.id));

            const res = await fetch("api.php?action=delete_tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: idsToDelete })
            });

            const data = await res.json();

            if (data.status === "success") {
                alert("تیکت‌ها حذف شدند.");
                renderSupportTicketsFromServer();
            } else {
                alert("خطا در حذف: " + data.message);
            }
        });
    }

    if (submitReviewBtn) {
        submitReviewBtn.addEventListener("click", async () => {

            reviewLoginError.classList.add("hidden");
            reviewTextError.classList.add("hidden");

            if (!isUserSignedIn) {
                reviewLoginError.classList.remove("hidden");
                return;
            }

            const text = reviewText.value.trim();
            if (!text) {
                reviewTextError.classList.remove("hidden");
                return;
            }

            const userId = localStorage.getItem("user_id");

            const res = await fetch("api.php?action=add_review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    text: text
                })
            });

            const data = await res.json();

            if (data.status === "success") {
                reviewSuccessModal.classList.remove("hidden");
                reviewSuccessModal.classList.add("active");
                reviewText.value = "";
            } else {
                alert("خطا در ارسال نظر: " + data.message);
            }
        });
    }

    if (reviewSuccessOk) {
        reviewSuccessOk.addEventListener("click", () => {

            // بستن مودال
            reviewSuccessModal.classList.add("hidden");
            reviewSuccessModal.classList.remove("active");

            // ریست کردن فرم
            reviewText.value = "";
            reviewLoginError.classList.add("hidden");
            reviewTextError.classList.add("hidden");
        });
    }

    document.querySelector("#forgot-password-btn")?.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelector("#initial-view").style.display = "none";
        document.querySelector("#reset-password-view").style.display = "block";
    });

    function getUsers() {
        return JSON.parse(localStorage.getItem("users") || "[]");
    }

    function saveUsers(users) {
        localStorage.setItem("users", JSON.stringify(users));
    }

    document.getElementById("reset-form")?.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("reset_email").value.trim();
        const newPass = document.getElementById("new_password").value.trim();
        const resetPasswordError = document.getElementById("resetPasswordError");

        // پاک کردن خطاهای قبلی
        resetPasswordError.textContent = '';
        resetPasswordError.classList.remove('show');

        // =========== محدودیت‌های رمز عبور (عین ثبت‌نام) ===========
        const hasUppercase = /[A-Z]/.test(newPass);
        const hasNumber = /\d/.test(newPass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPass);

        if (newPass.length < 8) {
            resetPasswordError.textContent = "رمز عبور باید حداقل ۸ کاراکتر باشد.";
            resetPasswordError.classList.add('show');
            return;
        }
        if (!hasUppercase) {
            resetPasswordError.textContent = "رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد.";
            resetPasswordError.classList.add('show');
            return;
        }
        if (!hasNumber) {
            resetPasswordError.textContent = "رمز عبور باید حداقل یک عدد داشته باشد.";
            resetPasswordError.classList.add('show');
            return;
        }
        if (!hasSpecial) {
            resetPasswordError.textContent = "رمز عبور باید حداقل یک علامت خاص داشته باشد.";
            resetPasswordError.classList.add('show');
            return;
        }

        // ======================= پیدا کردن کاربر =======================
        let users = JSON.parse(localStorage.getItem("userDataList") || "[]");
        let user = users.find(u => u.email === email);

        if (!user) {
            resetPasswordError.textContent = "این ایمیل در سیستم ثبت نشده است.";
            resetPasswordError.classList.add('show');
            return;
        }

        // تغییر رمز
        user.password = newPass;

        localStorage.setItem("userDataList", JSON.stringify(users));

        alert("رمز عبور با موفقیت تغییر یافت!");

        switchView(initialView);
    });


    async function renderSupportTicketsFromServer() {

        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        const list = supportTicketsList;

        if (!list) {
            console.warn("support-tickets-list not found in DOM");
            return;
        }

        // دریافت تیکت‌ها از دیتابیس
        const res = await fetch(`api.php?action=get_tickets&user_id=${userId}`);
        const data = await res.json();

        list.innerHTML = "";

        // اگر هیچ تیکتی نبود
        if (data.status !== "success" || data.tickets.length === 0) {
            list.innerHTML = `
            <li class="no-ticket-item">هیچ درخواستی ثبت نشده است.</li>
            `;
            deleteSelectedTicketsBtn.classList.add("hidden");
            return;
        }

        const tickets = data.tickets;

        tickets.forEach(ticket => {
            const li = document.createElement('li');
            const isAnswered = ticket.status === "replied";

            if (isAnswered) li.classList.add("ticket-answered");

            li.innerHTML = `
            <div class="ticket-header">
                <input type="checkbox" class="ticket-checkbox" data-id="${ticket.id}">
                <span class="ticket-title" data-id="${ticket.id}">
                    ${ticket.title}
                </span>
            </div>

            <div class="ticket-body hidden">
                <p class="ticket-message">${ticket.message}</p>
                <p class="ticket-date">${toJalali(ticket.created_at)}</p>

                <div class="ticket-response-box">
                    <p class="ticket-response">
                        ${ticket.reply ? "پاسخ: " + ticket.reply : "پاسخی برای این درخواست ثبت نشده است."}
                    </p>
                </div>
            </div>
        `;

            list.appendChild(li);
        });

        deleteSelectedTicketsBtn.classList.remove("hidden");

        activateTicketAccordion();
    }

    function activateTicketAccordion() {
        const titles = document.querySelectorAll(".ticket-title");

        titles.forEach(title => {
            title.addEventListener("click", () => {
                const body = title.parentElement.nextElementSibling;
                body.classList.toggle("hidden");
            });
        });
    }

    function formatTomans(amount) {
        const val = Number(amount) || 0;
        return val.toLocaleString('fa-IR') + ' تومان';
    }

    function updateOrderSummary(subtotal) {
        lastOrderSubtotal = Number(subtotal) || 0;
        const delivery = DELIVERY_FEE;
        const payable = Math.max(lastOrderSubtotal + delivery - currentDiscountAmount, 0);

        if (orderSubtotalEl) orderSubtotalEl.textContent = formatTomans(lastOrderSubtotal);
        if (orderDeliveryEl) orderDeliveryEl.textContent = formatTomans(delivery);
        if (orderPayableEl) orderPayableEl.textContent = formatTomans(payable);
    }

    async function fetchDiscountFromServer(code) {
        try {
            const res = await fetch("api.php?action=get_discount&code=" + encodeURIComponent(code));
            const data = await res.json();
            return data;
        } catch (e) {
            return { status: "error" };
        }
    }

    async function applyDiscountCode() {

        if (!discountInput) return;

        const rawCode = (discountInput.value || '').trim();
        if (!rawCode) {
            currentDiscountAmount = 0;
            discountMsgEl.textContent = "";
            updateOrderSummary(lastOrderSubtotal);
            return;
        }

        const code = rawCode.toUpperCase();

        const response = await fetchDiscountFromServer(code);

        if (response.status === "not_found") {
            discountMsgEl.textContent = "کد تخفیف نامعتبر است";
            discountMsgEl.style.color = "#e53935";
            currentDiscountAmount = 0;
            updateOrderSummary(lastOrderSubtotal);
            return;
        }

        if (response.status === "inactive") {
            discountMsgEl.textContent = "این کد غیرفعال است";
            discountMsgEl.style.color = "#e53935";
            currentDiscountAmount = 0;
            updateOrderSummary(lastOrderSubtotal);
            return;
        }

        if (response.status !== "success") {
            discountMsgEl.textContent = "خطا در ارتباط با سرور";
            discountMsgEl.style.color = "#e53935";
            currentDiscountAmount = 0;
            updateOrderSummary(lastOrderSubtotal);
            return;
        }

        // --- کد معتبر است ---
        const def = response.discount;

        let discountAmount = 0;

        if (def.type === "percent") {
            const percent = Number(def.value) || 0;
            discountAmount = Math.round((lastOrderSubtotal * percent) / 100);
        }

        currentDiscountAmount = discountAmount;

        discountMsgEl.textContent =
            ` تخفیف ${def.value}% اعمال شد: ${formatTomans(discountAmount)}`;
        discountMsgEl.style.color = "#388e3c";

        updateOrderSummary(lastOrderSubtotal);
    }

    if (discountInput) {
        discountInput.addEventListener('input', () => {
            applyDiscountCode(); 
        });
    }

    const saveOrder = (customerInfo) => {

        let subtotal = 0;
        if (Array.isArray(listCarts)) {
            subtotal = listCarts.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                return sum + price;
            }, 0);
        }

        const finalDiscountCode = (discountInput?.value || "").trim();
        const deliveryFee = DELIVERY_FEE;
        const finalPayable = subtotal + deliveryFee - currentDiscountAmount;

        const orderData = {
            items: listCarts,
            subtotal: subtotal,

            deliveryFee: deliveryFee,

            discountCode: finalDiscountCode || null,
            discountAmount: currentDiscountAmount || 0,

            totalPayable: finalPayable,
            total: finalPayable.toLocaleString("fa-IR") + " تومان",

            customer: {
                firstname: customerInfo.firstname,
                lastname: customerInfo.lastname,
                fullName: customerInfo.fullName,
                email: customerInfo.email,
                phone: customerInfo.phone,
                address: customerInfo.address
            },

            date: new Date().toLocaleDateString("fa-IR"),
            time: new Date().toLocaleTimeString("fa-IR"),
            trackingCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
            status: "pending",

            isDeletedByAdmin: false
        };

        const userEmail = localStorage.getItem('userEmail') || 'unknown_user';

        // ذخیره آخرین سفارش
        localStorage.setItem(`lastOrder_${userEmail}`, JSON.stringify(orderData));

        // ذخیره در تاریخچه سفارش‌ها
        let userOrders = JSON.parse(localStorage.getItem(`orders_${userEmail}`)) || [];
        userOrders.push(orderData);
        localStorage.setItem(`orders_${userEmail}`, JSON.stringify(userOrders));

        return orderData;
    };

    function finalizeOrderUI() {
        // بستن مودال تأیید سفارش
        if (orderConfirmationModal) {
            orderConfirmationModal.classList.remove('active');
        }

        // بستن مودال پیش‌فاکتور و برگردوندن نوار بالا
        if (checkoutModalOverlay) {
            checkoutModalOverlay.classList.remove('active');
        }
        if (navbar) {
            navbar.classList.remove('hide-navbar');
        }

        // خالی کردن سبد خرید
        listCarts = [];
        cartProduct = [];
        if (cartList) cartList.innerHTML = '';
        if (cartValue) cartValue.textContent = '0';
        if (cartTotal) cartTotal.textContent = '0.00';

        // ریست کد تخفیف و جمع‌ها 
        if (discountInput) discountInput.value = '';
        if (discountMsgEl) discountMsgEl.textContent = '';
        if (typeof updateOrderSummary === 'function') {
            updateOrderSummary(0);
        }

        if (orderSuccessMessage) {
            orderSuccessMessage.classList.remove('show');
        }
    }

    const handleOrderSubmit = async () => {
        if (!listCarts || listCarts.length === 0) {
            // alert('سبد خرید شما خالی است.');
            return;
        }

        // گرفتن اطلاعات کاربر برای نام
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        const fullName = `${userData.firstname || ''} ${userData.lastname || ''}`.trim() || '-';

        const userEmail = localStorage.getItem('userEmail');
        const titleLS = localStorage.getItem(`userAddressTitle_${userEmail}`) || '';
        const addressTextLS = localStorage.getItem('userAddressText') || '';
        const phoneLS = localStorage.getItem(`userPhone_${userEmail}`) || '';

        const title = (addressTitleInput && addressTitleInput.value.trim()) || titleLS;
        const location = (mapAddressInput && mapAddressInput.value.trim()) || '';
        const details = (addressDetailsInput && addressDetailsInput.value.trim()) || '';

        // ساخت آدرس به ترتیب: عنوان، نشانی، آدرس کامل
        const addressLines = [];

        if (title) addressLines.push(title);
        if (location) {
            addressLines.push(location);
        } else if (addressTextLS) {
            addressLines.push(addressTextLS);
        }
        if (details) addressLines.push(details);

        const addressForOrder = addressLines.join('، ');

        const phone =
            (addressPhoneInput && addressPhoneInput.value.trim()) ||
            phoneLS ||
            '-';

        const customerInfo = {
            firstname: userData.firstname || "",
            lastname: userData.lastname || "",
            fullName: (userData.firstname + " " + userData.lastname).trim(),
            email: userData.email || "",
            phone,
            address: addressForOrder
        };

        // ذخیره سفارش
        const orderData = saveOrder(customerInfo);

        const userId = localStorage.getItem("user_id");
        const addressId = localStorage.getItem(`selectedAddressId_${userEmail}`);

        try {
            const res = await fetch("api.php?action=save_order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    address_id: addressId,
                    items: listCarts,
                    subtotal: orderData.subtotal,
                    deliveryFee: orderData.deliveryFee,
                    discountCode: orderData.discountCode,
                    discountAmount: orderData.discountAmount,
                    totalPayable: orderData.totalPayable,
                    trackingCode: orderData.trackingCode,
                    date: orderData.date,
                    time: orderData.time
                })
            });

            const data = await res.json();
            console.log("ORDER SAVED:", data);

        } catch (e) {
            console.error("خطا در ذخیره سفارش:", e);
        }

        if (orderConfirmationModal && confirmationTrackingSpan) {
            confirmationTrackingSpan.textContent = orderData.trackingCode || '-';
            orderConfirmationModal.classList.add('active');
        }

        navbar.classList.remove('hide-navbar');

        listCarts = [];
        cartProduct = [];
        if (cartList) cartList.innerHTML = '';
        if (cartValue) cartValue.textContent = '0';
        if (cartTotal) cartTotal.textContent = '0.00';
    };

    function attachMenuItemClickListeners() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        navbar.addEventListener('click', (e) => {
            const target = e.target.closest('[data-card]');
            if (!target) return;

            e.preventDefault();
            e.stopPropagation();

            const cardId = parseInt(target.dataset.card, 10);
            if (isNaN(cardId) || !globalMenuSwiper) return;

            const slide = document.querySelector(`.menuSwiper .swiper-slide[data-id="${cardId}"]`);
            if (!slide) return;

            let realIndex;
            if (typeof slide.swiperSlideIndex === 'number') {
                realIndex = slide.swiperSlideIndex;
            } else {
                const slides = Array.from(document.querySelectorAll('.menuSwiper .swiper-slide'));
                realIndex = slides.indexOf(slide);
            }

            const menuSectionEl = document.querySelector('#menu-section');
            if (menuSectionEl) {
                menuSectionEl.scrollIntoView({ behavior: 'smooth' });
            }
            setTimeout(() => {
                globalMenuSwiper.slideTo(realIndex);

                const activeCard = slide.querySelector('.order-card');
                if (activeCard) {
                    activeCard.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
                    activeCard.style.boxShadow = '0 0 15px 4px rgba(242, 18, 149, 0.8)';
                    activeCard.style.transform = 'scale(1.05)';

                    setTimeout(() => {
                        activeCard.style.boxShadow = '';
                        activeCard.style.transform = '';
                    }, 1500);
                }
            }, 600);
        });
    }


    const updateUI = () => {
        const desktopSignInBtn = document.querySelector('.desktop-action .sign-in-trigger');
        const mobileSignInBtn = document.querySelector('.mobile-menu .mobile-sign-in-btn');

        if (isUserSignedIn) {
            if (desktopSignInBtn) desktopSignInBtn.querySelector('span').textContent = 'خروج';
            if (mobileSignInBtn) mobileSignInBtn.querySelector('span').textContent = 'خروج';
        } else {
            if (desktopSignInBtn) desktopSignInBtn.querySelector('span').textContent = 'ورود';
            if (mobileSignInBtn) mobileSignInBtn.querySelector('span').textContent = 'ورود';
        }
    };

    const clearAuthForms = () => {
        const loginForm = document.getElementById('login-form-default');
        const signupForm = document.getElementById('signup-form');
        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();
    };

    async function openUserInfoSection(mode = 'profile') {
        const overlay = document.querySelector('.my-orders-overlay');
        overlay.classList.add('active');

        const titleEl = document.getElementById('myOrdersTitle');
        if (titleEl) {
            if (mode === 'profile') {
                titleEl.textContent = 'پروفایل کاربری';
            } else if (mode === 'orders') {
                titleEl.textContent = 'سفارش‌های من';
            }
        }

        const userInfoSection = document.querySelector('.user-info-section');
        const userReviewsSection = document.querySelector(".user-reviews-section");

        if (mode === "profile") {
            userInfoSection.classList.remove("hidden-section");
            userReviewsSection.classList.remove("hidden-section");
            loadUserReviews();
        } else {
            userReviewsSection.classList.add("hidden-section");
        }
        const orderHistorySection = document.querySelector('.order-history-section');
        const latestOrderSection = document.querySelector('.latest-order-section');

        userInfoSection.classList.add('hidden-section');
        orderHistorySection.classList.add('hidden-section');
        latestOrderSection.classList.add('hidden-section');

        if (mode === 'profile') {
            userInfoSection.classList.remove('hidden-section');
            reloadAddressesForCurrentUser();
        } else if (mode === 'orders') {
            orderHistorySection.classList.remove('hidden-section');
            latestOrderSection.classList.remove('hidden-section');
        }

        // ---------- اطلاعات کاربر ----------
        const userId = localStorage.getItem("user_id");

        try {
            const response = await fetch(`api.php?action=get_user&id=${userId}`);
            const result = await response.json();

            if (result.status === "success") {
                const user = result.user;

                localStorage.setItem("userData", JSON.stringify(user));

                document.querySelector('#userFirstName').value = user.firstname || '';
                document.querySelector('#userLastName').value = user.lastname || '';
                document.querySelector('#userGender').value = user.gender || '';
                document.querySelector('#userEmail').value = user.email || '';

                if (userPhoneProfileInput) {
                    userPhoneProfileInput.value = user.phone || '';
                }

            } else {
                console.error("خطا در دریافت اطلاعات کاربر:", result.message);
            }

        } catch (err) {
            console.error("خطای سرور در دریافت اطلاعات کاربر:", err);
        }

        const user = JSON.parse(localStorage.getItem('userData')) || {};
        if (userPhoneProfileInput) {
            userPhoneProfileInput.value = user.phone || '';
        }

        // ---------- تاریخچه سفارش‌ها از دیتابیس ----------
        const historyList = document.querySelector('#orderHistoryList');
        const orderDetailsContainer = document.querySelector('#latestOrderDetails');
        const orderStatusDisplay = document.querySelector('#orderStatusDisplay');

        if (historyList) historyList.innerHTML = '';
        if (orderDetailsContainer) orderDetailsContainer.innerHTML = '';
        if (orderStatusDisplay) {
            orderStatusDisplay.textContent = '—';
            orderStatusDisplay.className = 'status-pill';
        }

        if (!userId) {
            console.warn("user_id در localStorage پیدا نشد");
            return;
        }

        fetch(`api.php?action=get_orders&user_id=${userId}`)
            .then(res => res.json())
            .then(orders => {
                if (!orders.length) {
                    if (orderDetailsContainer) {
                        orderDetailsContainer.innerHTML = '<p>هیچ سفارشی ثبت نشده است.</p>';
                    }
                    return;
                }

                // جدول تاریخچه
                if (historyList) {
                    orders.forEach((order, i) => {
                        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
                        const tr = document.createElement('tr');
                        tr.classList.add('order-row');

                        tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td>${order.date || '-'}</td>
                    <td class="order-link">${order.tracking_code || '-'}</td>
                    <td>${Number(order.total_payable).toLocaleString('fa-IR')} تومان</td>
                `;

                        const detailsTr = document.createElement('tr');
                        detailsTr.classList.add('order-details-row');
                        detailsTr.style.display = 'none';

                        const itemsText = Array.isArray(order.items)
                            ? order.items.map(it => `${it.item_name} × ${it.quantity}`).join('، ')
                            : '—';

                        const a = order.address_info || {};
                        const fullAddressText = [a.title, a.location, a.full_address]
                            .filter(Boolean)
                            .join('، ');

                        detailsTr.innerHTML = `
                        <td colspan="4">
            <div class="order-details-box">
                <p><strong>اقلام:</strong> ${itemsText}</p>
                <p><strong>مبلغ کل:</strong> ${Number(order.total_payable).toLocaleString('fa-IR')} تومان</p>
                <p><strong>تاریخ:</strong> ${order.date || '-'}</p>
                <p><strong>کد رهگیری:</strong> ${order.tracking_code || '-'}</p>

               <p><strong>آدرس:</strong> ${fullAddressText || '-'}</p>

                <p><strong>شماره تماس:</strong> ${userData.phone || '-'}</p>
            </div>
        </td>
                            `;

                        tr.addEventListener('click', () => {
                            detailsTr.style.display =
                                detailsTr.style.display === 'table-row' ? 'none' : 'table-row';
                        });

                        historyList.appendChild(tr);
                        historyList.appendChild(detailsTr);
                    });
                }

                // آخرین سفارش
                const latest = orders[orders.length - 1];

                if (orderDetailsContainer) {
                    const latestItemsText = Array.isArray(latest.items)
                        ? latest.items.map(it => `${it.item_name} × ${it.quantity}`).join('، ')
                        : '—';

                    orderDetailsContainer.innerHTML = `
                <p><strong>تاریخ:</strong> ${latest.date || '-'}</p>
                <p><strong>کد رهگیری:</strong> ${latest.tracking_code || '-'}</p>
                <p><strong>اقلام:</strong> ${latestItemsText}</p>
                <p><strong>مبلغ:</strong> ${Number(latest.total_payable).toLocaleString('fa-IR')} تومان</p>
            `;
                }

                if (orderStatusDisplay) {
                    let statusClass = '';
                    let statusHTML = '';

                    if (latest.status === 'pending') {
                        statusClass = 'pending';
                        statusHTML = 'در انتظار تایید';
                    } else if (latest.status === 'approved') {
                        statusClass = 'approved';
                        statusHTML = 'سفارش شما تایید شد';
                    } else if (latest.status === 'delivered') {
                        statusClass = 'delivered';
                        statusHTML = 'سفارش شما تحویل داده شد';
                    } else if (latest.status === 'canceled') {
                        statusClass = 'canceled';
                        statusHTML = 'سفارش شما رد شده است';
                    } else {
                        statusClass = 'unknown';
                        statusHTML = 'وضعیت نامشخص';
                    }

                    orderStatusDisplay.innerHTML = `
                <div class="status-label ${statusClass}">
                    ${statusHTML}
                </div>
            `;
                }
            })
            .catch(err => {
                console.error("خطا در دریافت سفارش‌ها:", err);
                if (orderDetailsContainer) {
                    orderDetailsContainer.innerHTML = '<p>خطا در دریافت سفارش‌ها.</p>';
                }
            });



    }

    // ----------------- ذخیره تغییرات پروفایل -----------------
    const userInfoForm = document.getElementById('user-info-form');

    if (userInfoForm) {
        userInfoForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const updated = {
                firstname: document.querySelector('#userFirstName').value.trim(),
                lastname: document.querySelector('#userLastName').value.trim(),
                gender: document.querySelector('#userGender').value,
                email: document.querySelector('#userEmail').value.trim(),
                phone: userPhoneProfileInput ? userPhoneProfileInput.value.trim() : ""
            };

            const currentUserData = JSON.parse(localStorage.getItem('userData') || "{}");
            const userId = currentUserData.id;

            // به‌روزرسانی اطلاعات اصلی کاربر در دیتابیس
            let response = await fetch("api.php?action=update_user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: userId,
                    firstname: updated.firstname,
                    lastname: updated.lastname,
                    gender: updated.gender,
                    email: updated.email
                })
            });

            let result = await response.json();

            if (result.status !== "success") {
                alert("خطا در ذخیره اطلاعات کاربر: " + result.message);
                return;
            }

            // به‌روزرسانی شماره تلفن 
            if (updated.phone) {
                await fetch("api.php?action=update_phone", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: userId,
                        phone: updated.phone
                    })
                });
            }

            // هماهنگ‌سازی localStorage با دیتابیس
            const finalUserData = {
                id: userId,
                firstname: updated.firstname,
                lastname: updated.lastname,
                gender: updated.gender,
                email: updated.email,
                phone: updated.phone
            };

            localStorage.setItem("userData", JSON.stringify(finalUserData));
            localStorage.setItem("userEmail", updated.email);

            alert("اطلاعات شما با موفقیت ذخیره شد");
        });
    }

    function showUserInfo(email, name) {
        const userInfoDisplay = document.querySelector('.user-info-display');
        const userNameSpan = document.querySelector('.user-name');
        const userEmailSpan = document.querySelector('.user-email');

        const mobileUserInfo = document.querySelector('.mobile-user-info');
        const mobileUserName = document.querySelector('.mobile-user-name');
        const mobileUserEmail = document.querySelector('.mobile-user-email');

        const userFirstName = localStorage.getItem('userFirstName') || name || 'کاربر';
        const userEmail = localStorage.getItem('userEmail') || email || '';

        // نمایش دسکتاپ
        if (userInfoDisplay) {
            userInfoDisplay.style.display = 'flex';
            userNameSpan.textContent = userFirstName;
            userEmailSpan.textContent = userEmail;
        }

        // نمایش موبایل
        if (mobileUserInfo) {
            mobileUserInfo.style.display = 'block';
            mobileUserName.textContent = userFirstName;
            mobileUserEmail.textContent = userEmail;
        }
    }

    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail && isUserSignedIn) {
        showUserInfo(savedEmail);
    }

    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        cartTab.classList.add('cart-table-active');
        navbar.classList.add('hide-navbar');
    });

    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        cartTab.classList.remove('cart-table-active');
        navbar.classList.remove('hide-navbar');
        if (checkoutMessage.classList.contains('show-message')) {
            checkoutMessage.classList.remove('show-message');
        }
    });

    hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        mobileMenue.classList.toggle('mobile-menu-active');

        if (bars.classList.contains('fa-bars')) {
            bars.classList.remove('fa-bars');
            bars.classList.add('fa-xmark');
        }
        else {
            bars.classList.remove('fa-xmarks');
            bars.classList.add('fa-bars');
        }
    });

    if (signInBtn) {
        signInBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modalOverlay.classList.add('active');
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modalOverlay.classList.remove('active');

            const userField = document.getElementById('default_username');
            const passField = document.getElementById('default_password');

            if (userField) userField.value = '';
            if (passField) passField.value = '';

            const successMessage = document.querySelector('#success-message');
            if (successMessage) {
                successMessage.classList.remove('show');
            }
        });
    }

    if (desktopSignInBtn) {
        desktopSignInBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isUserSignedIn) {
                // نمایش سفارش‌ها
                modalOverlay.classList.remove('active');
                openMyOrdersModal();
            } else {
                // نمایش فرم ورود
                myOrdersOverlay.classList.remove('active');
                modalOverlay.classList.add('active');
                clearAuthForms();
            }
        });
    }

    if (mobileSignInBtn) {
        mobileSignInBtn.addEventListener('click', (e) => {
            e.preventDefault();
            mobileMenue.classList.remove('mobile-menu-active');
            bars.classList.remove('fa-xmark');
            bars.classList.add('fa-bars');

            if (isUserSignedIn) {
                modalOverlay.classList.remove('active');
                openMyOrdersModal();
            } else {
                myOrdersOverlay.classList.remove('active');
                modalOverlay.classList.add('active');
                clearAuthForms();
            }
        });
    }

    if (loginFormDefault) {
        loginFormDefault.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('default_username');
            const passwordInput = document.getElementById('default_password');
            const emailError = document.getElementById('loginEmailError');
            const passwordError = document.getElementById('loginPasswordError');

            // پاک کردن خطاهای قبلی
            emailError.textContent = '';
            passwordError.textContent = '';
            emailError.classList.remove('show');
            passwordError.classList.remove('show');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // فیلدهای خالی
            if (!email || !password) {
                if (!email) {
                    emailError.textContent = 'لطفا ایمیل را وارد کنید';
                    emailError.classList.add('show');
                }
                if (!password) {
                    passwordError.textContent = 'لطفا رمز عبور را وارد کنید';
                    passwordError.classList.add('show');
                }
                return;
            }

            try {
                const res = await fetch("api.php?action=login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (data.status === "error") {
                    passwordError.textContent = "ایمیل یا رمز عبور اشتباه است.";
                    passwordError.classList.add('show');
                    return;
                }

                // ورود موفق
                const user = data.user;

                localStorage.setItem("user_id", user.id);
                localStorage.setItem("userEmail", email);
                localStorage.setItem("user_firstname", user.firstname || "");
                localStorage.setItem("user_lastname", user.lastname || "");
                localStorage.setItem("user_role", user.role || "user");
                localStorage.setItem("user_phone", user.phone || "");

                localStorage.setItem("userData", JSON.stringify({
                    id: data.user.id,
                    firstname: data.user.firstname,
                    lastname: data.user.lastname,
                    gender: data.user.gender,
                    email: data.user.email,
                    phone: data.user.phone
                }));

                isUserSignedIn = true;
                updateUI();
                updateNavbar();
                showUserInfo(email);

                // نمایش پیام موفقیت داخل success-message
                const successMessage = document.querySelector('#success-message');
                if (successMessage) {
                    successMessage.querySelector('p').textContent = 'با موفقیت وارد شدید!';
                    successMessage.classList.add('show');
                }

                setTimeout(() => {
                    modalOverlay.classList.remove('active');
                    if (successMessage) successMessage.classList.remove('show');
                }, 1000);

            } catch (err) {
                emailError.textContent = 'خطا در اتصال به سرور، دوباره امتحان کنید.';
                emailError.classList.add('show');
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const fname = document.getElementById("reg_first_name").value.trim();
            const lname = document.getElementById("reg_last_name").value.trim();
            const gender = document.getElementById("reg_gender").value.trim();
            const email = document.getElementById("reg_email").value.trim();
            const pass = document.getElementById("reg_password").value.trim();

            const emailError = document.getElementById("signupEmailError");
            const passError = document.getElementById("passwordError");

            emailError.textContent = "";
            passError.textContent = "";

            // فیلد خالی
            if (!fname || !lname || !email || !pass) {
                if (!email) emailError.textContent = "ایمیل را وارد کنید.";
                if (!pass) passError.textContent = "رمز عبور را وارد کنید.";
                return;
            }

            // رمز ضعیف
            if (pass.length < 6) {
                passError.textContent = "رمز عبور باید حداقل 6 کاراکتر باشد.";
                return;
            }

            // حداقل یک حرف بزرگ
            if (!/[A-Z]/.test(pass)) {
                passError.textContent = "رمز عبور باید حداقل یک حرف بزرگ داشته باشد.";
                return;
            }

            // حداقل یک حرف کوچک
            if (!/[a-z]/.test(pass)) {
                passError.textContent = "رمز عبور باید حداقل یک حرف کوچک داشته باشد.";
                return;
            }

            // حداقل یک عدد
            if (!/[0-9]/.test(pass)) {
                passError.textContent = "رمز عبور باید حداقل یک عدد داشته باشد.";
                return;
            }

            // حداقل یک کاراکتر خاص
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) {
                passError.textContent = "رمز عبور باید حداقل یک نماد (مثل @، # یا !) داشته باشد.";
                return;
            }

            try {
                const res = await fetch("api.php?action=register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstname: fname,
                        lastname: lname,
                        gender,
                        email,
                        password: pass
                    })
                });

                const data = await res.json();

                // ایمیل تکراری
                if (data.status === "success") {

                    // جلوگیری از لاگین خودکار
                    localStorage.removeItem("isUserSignedIn");
                    localStorage.removeItem("userEmail");
                    localStorage.removeItem("userData");
                    localStorage.removeItem("user_id");

                    isUserSignedIn = false;
                    updateUI();
                    updateNavbar();

                    const successMessage = document.getElementById("success-message");
                    successMessage.classList.add("show");

                    setTimeout(() => {
                        successMessage.classList.remove("show");
                        switchView(initialView);
                    }, 1200);

                    signupForm.reset();
                }

            } catch (err) {
                emailError.textContent = "خطا در اتصال به سرور.";
            }
        });
    }

    // برای دکمه خرید
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (!isUserSignedIn) {
                checkoutMessage.classList.add('show-message');
                return;
            }

            checkoutMessage.classList.remove('show-message');

            // ساخت لیست سفارش با داده‌ی واقعی از سبد خرید
            listCarts = [];
            document.querySelectorAll('.cart-list .item').forEach(item => {
                const nameEl = item.querySelector('.detail h4:first-child');
                const quantityEl = item.querySelector('.quantity-value');
                const priceEl = item.querySelector('.item-total');

                if (!nameEl || !quantityEl || !priceEl) return; 

                const name = nameEl.textContent.trim();
                const quantity = parseInt(quantityEl.textContent);
                const price = parseFloat(priceEl.getAttribute('data-total')) || 0;

                listCarts.push({ name, quantity, price });
            });

            if (listCarts.length === 0) {
                alert('سبد خرید شما خالی است.');
                return;
            }

            cartTab.classList.remove('cart-table-active');
            checkoutModalOverlay.classList.add('active');
            displayOrderSummary();
        });
    }

    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // بستن مودال پیش‌فاکتور
            checkoutModalOverlay.classList.remove('active');

            cartTab.classList.add('cart-table-active');
            navbar.classList.add('hide-navbar');
        });
    }

    if (myOrdersCloseBtn) {
        myOrdersCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            myOrdersOverlay.classList.remove('active');
        });
    }

    const trackingSearchBtn = document.getElementById('tracking-search-btn');
    const trackingInput = document.getElementById('tracking-code-input');
    const trackingErrorMsg = document.getElementById('tracking-error-msg');

    if (trackingSearchBtn && trackingInput) {
        trackingSearchBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            const code = trackingInput.value.trim();

            trackingErrorMsg.style.display = "none";

            // ورودی خالی
            if (!code) {
                trackingErrorMsg.textContent = "لطفاً کد رهگیری خود را وارد کنید.";
                trackingErrorMsg.style.display = "block";
                return;
            }

            // درخواست به سرور
            const res = await fetch(`api.php?action=track_order&code=${code}`);
            const data = await res.json();

            // سفارش پیدا نشد
            if (data.status === "not_found") {
                trackingErrorMsg.textContent = "کد رهگیری نامعتبر است.";
                trackingErrorMsg.style.display = "block";
                return;
            }

            // سفارش پیدا شد
            const found = data.order;

            trackingErrorMsg.style.display = "none";
            trackingInput.value = "";

            const myOrdersOverlay = document.querySelector('.my-orders-overlay');
            const latestOrderSection = document.querySelector('.latest-order-section');
            const orderDetails = document.getElementById('latestOrderDetails');
            const orderStatusDisplay = document.getElementById('orderStatusDisplay');
            const orderHistorySection = document.querySelector('.order-history-section');
            const userInfoSection = document.querySelector('.user-info-section');
            const myOrdersTitle = document.getElementById('myOrdersTitle');

            myOrdersOverlay.classList.add('active');

            myOrdersTitle.style.display = "none";
            orderHistorySection.classList.add('hidden-section');
            userInfoSection.classList.add('hidden-section');
            latestOrderSection.classList.remove('hidden-section');

            const itemsText = found.items
                .map(i => `${i.item_name} × ${i.quantity}`)
                .join('، ');

            // نمایش جزئیات سفارش
            orderDetails.innerHTML = `
            <p><strong>تاریخ:</strong> ${found.date}</p>
            <p><strong>کد رهگیری:</strong> ${found.tracking_code}</p>
            <p><strong>اقلام:</strong> ${itemsText}</p>
            <p><strong>مبلغ:</strong> ${found.total_payable}</p>
        `;

            // ساخت وضعیت
            let statusClass = found.status;
            let statusText =
                found.status === "pending" ? "در انتظار تأیید" :
                    found.status === "approved" ? "سفارش تأیید شد" :
                        found.status === "delivered" ? "تحویل شد" :
                            "نامشخص";

            orderStatusDisplay.innerHTML = `
            <div class="status-label ${statusClass}">
                ${statusText}
            </div>
        `;
        });
    }

    const resetCheckoutModal = () => {
        orderSuccessMessage.classList.remove('show');
        customerInfoForm.reset();
        orderSummaryList.innerHTML = '';

        listCarts = [];
        cartProduct = [];
        cartList.innerHTML = '';
        cartValue.textContent = '0';
        cartTotal.textContent = '0.00';
    }

    function debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // باز کردن صفحه نقشه
    function openMap() {
        addressMapPage.classList.remove('hidden');
        addressMapPage.classList.add('active');

        fillAddressFormFromStorage();

        setTimeout(() => {
            initMap();
            if (map) map.invalidateSize();
            const searchInput = document.getElementById("map-search");
            if (searchInput) {
                searchInput.value = "";

                searchInput.oninput = null;
            }
            enableSearchOnMap(); //  فعال‌سازی سرچ
        }, 300);
    }

    closeMapBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addressMapPage.classList.add('hidden');
        addressMapPage.classList.remove('active');
    });

    // اتصال لینک‌ها به تابع باز شدن نقشه
    document.body.addEventListener('click', (e) => {
        const addLink = e.target.closest(
            '#add-address-link, #add-new-address-link, #profile-add-address, #profile-add-new-address'
        );

        if (addLink) {
            e.preventDefault();
            addressFormMode = 'add';
            editingAddressId = null;
            resetAddressForm();
            openMap();
        }
    });

    async function loadUserReviews() {
        const container = document.getElementById("user-reviews-list");
        const userId = localStorage.getItem("user_id");

        const res = await fetch(`api.php?action=get_reviews&user_id=${userId}`);
        const data = await res.json();

        if (data.status !== "success" || data.reviews.length === 0) {
            container.innerHTML = `
                <p style="font-size: .9rem;">هنوز نظری ارسال نکرده‌اید.</p>
                `;
            return;
        }

        container.innerHTML = "";

        data.reviews.forEach((r) => {

            const faDate = toJalali(r.created_at);

            const adminReply = r.reply
                ? `
            <div class="review-response">
                <strong>پاسخ مدیریت:</strong>
                <p>${r.reply}</p>
            </div>
            `
                : "";

            const div = document.createElement("div");
            div.classList.add("review-item");

            div.innerHTML = `
            <div class="review-header">${faDate}</div>
            <div class="review-text">${r.text}</div>
            ${adminReply}
        `;

            container.appendChild(div);
        });
    }

    function formatPrice(num) {
        if (!num) return "0";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function toPersianDigits(str) {
        return str.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    }

    function toJalali(datetime) {
        if (!datetime) return "-";

        const date = new Date(datetime);

        if (isNaN(date.getTime())) return datetime;

        const j = jalaali.toJalaali(date);

        const hh = String(date.getHours()).padStart(2, "0");
        const mm = String(date.getMinutes()).padStart(2, "0");

        return toPersianDigits(`${j.jy}/${j.jm}/${j.jd} - ${hh}:${mm}`);
    }

    // مقداردهی نقشه
    function initMap() {
        const mapEl = document.getElementById("map");
        if (!mapEl) return;

        if (!map) {
            // ایجاد نقشه
            map = L.map("map").setView([35.6892, 51.3890], 13);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(map);

            // marker
            marker = L.marker([35.6892, 51.3890], { draggable: true }).addTo(map);

            // رویداد dragend برای marker
            marker.on("dragend", (e) => {
                const { lat, lng } = e.target.getLatLng();
                updateAddressField(lat, lng);
            });

            // رویداد کلیک روی نقشه برای ایجاد یا جابه‌جایی marker
            map.on("click", (e) => {
                const { lat, lng } = e.latlng;
                if (!marker) {
                    marker = L.marker([lat, lng], { draggable: true }).addTo(map);
                } else {
                    marker.setLatLng([lat, lng]);
                }
                updateAddressField(lat, lng);
            });
        }

        setTimeout(() => map.invalidateSize(), 200);
    }

    function resetAddressForm() {
        addressTitleInput.value = '';
        mapAddressInput.value = '';
        addressDetailsInput.value = '';
        addressPhoneInput.value = '';

        document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    }

    function fillAddressFormFromStorage() {
        const userEmail = localStorage.getItem('userEmail');
        const savedTitle = localStorage.getItem(`userAddressTitle_${userEmail}`) || '';
        const savedLocation = localStorage.getItem(`userAddressLocation_${userEmail}`) || '';
        const savedDetails = localStorage.getItem(`userAddressDetails_${userEmail}`) || '';
        const savedPhone = localStorage.getItem(`userPhone_${userEmail}`) || '';

        addressTitleInput.value = savedTitle;
        mapAddressInput.value = savedLocation;
        addressDetailsInput.value = savedDetails;
        addressPhoneInput.value = savedPhone;
    }

    function fillAddressForm(address) {
        if (!address) return;

        addressTitleInput.value = address.title || '';
        mapAddressInput.value = address.location || '';
        addressDetailsInput.value = address.details || '';
        addressPhoneInput.value = address.phone || '';
    }

    // تابع برای پر کردن فیلد "نشانی" با مختصات و آدرس
    function updateAddressField(lat, lon, neshanData = null) {
        const addressInput = document.getElementById("customer-address");
        if (!addressInput) return;

        if (neshanData) {
            addressInput.value = neshanData.title || neshanData.region || "";
            return;
        }

        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=fa`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data.display_name) {
                    addressInput.value = data.display_name;
                }
            })
            .catch(() => console.log("خطا در دریافت آدرس از nominatim"));
    }

    function enableSearchOnMap() {
        const searchInput = document.getElementById("map-search");
        if (!searchInput) return;

        const doSearch = debounce(function () {
            const query = searchInput.value.trim();
            if (!query || query.length < 3) return; 

            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);

                        map.setView([lat, lon], 15); 
                        if (marker) marker.setLatLng([lat, lon]);
                        else marker = L.marker([lat, lon], { draggable: true }).addTo(map);

                        updateAddressField(lat, lon);
                    }
                })
                .catch(() => console.warn("خطا در جستجوی مکان"));
        }, 600); 

        searchInput.addEventListener("input", function () {
            doSearch();
        });
    }

    // function enableSearchOnMap() {
    //     const searchInput = document.getElementById("map-search");
    //     if (!searchInput) return;

    //     const doSearch = debounce(function () {
    //         const query = searchInput.value.trim();
    //         if (!query || query.length < 2) return;

    //         fetch(`https://api.neshan.org/v1/search?term=${encodeURIComponent(query)}&lat=35.6892&lng=51.3890`, {
    //             headers: {
    //                 "Api-Key": "web.ff9ae5e09c2341909aba4e4c376334c9"
    //             }
    //         })
    //             .then(res => res.json())
    //             .then(data => {
    //                 if (data.count > 0) {
    //                     const first = data.items[0];
    //                     const lat = first.location.y;
    //                     const lon = first.location.x;

    //                     map.setView([lat, lon], 15);

    //                     if (marker) marker.setLatLng([lat, lon]);
    //                     else marker = L.marker([lat, lon], { draggable: true }).addTo(map);

    //                     updateAddressField(lat, lon, first);   // ← آدرس از نشــان
    //                 }
    //             })
    //             .catch(err => console.log("خطای جستجو نشــان:", err));
    //     }, 500);

    //     searchInput.addEventListener("input", doSearch);
    // }

    async function loadAddressesFromServer() {
        const userId = localStorage.getItem("user_id");
        const userEmail = localStorage.getItem("userEmail");

        if (!userId || !userEmail) return;

        try {
            const res = await fetch(`api.php?action=get_addresses&user_id=${userId}`);
            const rows = await res.json();

            localStorage.removeItem(`userAddresses_${userEmail}`);

            const addresses = rows.map(row => ({
                id: row.id,
                title: row.title,
                text: row.full_address || row.address || row.location,
                phone: JSON.parse(localStorage.getItem("userData") || "{}").phone || "",
            }));

            localStorage.setItem(`userAddresses_${userEmail}`, JSON.stringify(addresses));

            reloadAddressesForCurrentUser();

        } catch (err) {
            console.error("خطا در loadAddressesFromServer:", err);
        }
    }

    // ذخیره آدرس
    saveAddressBtn.addEventListener("click", async () => {

        const address = mapAddressInput.value.trim();
        const details = addressDetailsInput.value.trim();
        const title = addressTitleInput.value.trim();
        const phone = addressPhoneInput.value.trim();

        // پاک کردن خطاها
        document.querySelectorAll(".field-error").forEach(el => el.textContent = "");

        let hasError = false;

        if (!address) {
            document.getElementById("error-address-location").textContent =
                "لطفاً موقعیت خود را از روی نقشه انتخاب کنید.";
            hasError = true;
        }

        if (!title) {
            document.getElementById("error-address-title").textContent =
                "لطفاً یک عنوان برای آدرس وارد کنید.";
            hasError = true;
        }

        if (!details) {
            document.getElementById("error-address-details").textContent =
                "لطفاً آدرس کامل را وارد کنید.";
            hasError = true;
        }

        const phoneRegex = /^09\d{9}$/;
        if (!phone) {
            document.getElementById("error-address-phone").textContent =
                "لطفاً شماره تماس را وارد کنید.";
            hasError = true;
        } else if (!phoneRegex.test(phone)) {
            document.getElementById("error-address-phone").textContent =
                "شماره تماس معتبر وارد کنید.";
            hasError = true;
        }

        if (hasError) return;

        // ذخیره آدرس در user_addresses
        const userId = localStorage.getItem("user_id");

        const res = await fetch("api.php?action=save_address", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                title,
                location: address,
                address: details,
                full_address: `${address}، ${details}`
            })
        });

        const data = await res.json();
        if (data.status !== "success") {
            alert("خطا در ذخیره آدرس");
            return;
        }

        const addressId = data.id; 

        // ذخیره شماره تلفن در دیتابیس (users.phone)
        await fetch("api.php?action=update_phone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                phone: phone
            })
        });

        // ذخیره شماره تلفن در localStorage (userData)
        let userData = JSON.parse(localStorage.getItem("userData") || "{}");
        userData.phone = phone;
        localStorage.setItem("userData", JSON.stringify(userData));

        // پر کردن شماره در فیلد پروفایل
        if (userPhoneProfileInput) {
            userPhoneProfileInput.value = phone;
        }

        // انتخاب خودکار این آدرس به عنوان آدرس فعال
        const userEmail = localStorage.getItem("userEmail");
        localStorage.setItem(`selectedAddressId_${userEmail}`, addressId);

        // گرفتن دوباره آدرس‌ها از دیتابیس و به‌روزرسانی UI
        await loadAddressesFromServer();

        addressMapPage.classList.add("hidden");
        addressMapPage.classList.remove("active");
    });

    function getStoredAddresses() {

        const userEmail = localStorage.getItem('userEmail');
        const raw = localStorage.getItem(`userAddresses_${userEmail}`);
        try {
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function getPrimaryPhoneFromAddresses(addresses) {
        if (!Array.isArray(addresses) || !addresses.length) return '';
        return addresses[0].phone || '';
    }

    function saveStoredAddresses(addresses) {
        const userEmail = localStorage.getItem('userEmail');
        localStorage.setItem(`userAddresses_${userEmail}`, JSON.stringify(addresses));
    }

    function renderAddressList(addresses, selectedId) {
        if (userAddressList && addressDisplay && addAddressWrapper) {
            userAddressList.innerHTML = '';

            if (!addresses.length) {
                addressDisplay.classList.add('hidden');
                addAddressWrapper.classList.remove('hidden');
            } else {
                addressDisplay.classList.remove('hidden');
                addAddressWrapper.classList.add('hidden');

                const hasMany = addresses.length > 1;
                userAddressList.classList.toggle('many-addresses', hasMany);
                userAddressList.classList.toggle('few-addresses', !hasMany);

                addresses.forEach(addr => {
                    const li = buildAddressItem(addr, selectedId);
                    userAddressList.appendChild(li);
                });
            }
        }

        if (profileAddressList && profileAddressDisplay && profileAddAddressWrapper) {
            profileAddressList.innerHTML = '';

            if (!addresses.length) {
                profileAddressDisplay.classList.add('hidden');
                profileAddAddressWrapper.classList.remove('hidden');
            } else {
                profileAddressDisplay.classList.remove('hidden');
                profileAddAddressWrapper.classList.add('hidden');

                addresses.forEach(addr => {
                    const li = buildAddressItem(addr, selectedId);
                    profileAddressList.appendChild(li);
                });
            }
        }
    }

    function reloadAddressesForCurrentUser() {
        const userEmail = localStorage.getItem('userEmail') || '';
        const addresses = getStoredAddresses(); 
        let selectedId = userEmail
            ? localStorage.getItem(`selectedAddressId_${userEmail}`)
            : null;

        if (addresses.length && !selectedId) {
            selectedId = addresses[0].id;
            if (userEmail) {
                localStorage.setItem(`selectedAddressId_${userEmail}`, String(selectedId));
            }
        }

        const primaryPhone = getPrimaryPhoneFromAddresses(addresses);
        if (addressPhoneInput) addressPhoneInput.value = primaryPhone || '';
        if (userPhoneProfileInput) userPhoneProfileInput.value = primaryPhone || '';

        renderAddressList(addresses, selectedId);
    }

    function buildAddressItem(addr, selectedId) {
        const li = document.createElement('li');
        li.className = 'address-item';

        li.innerHTML = `
            <div class="address-row">
                <label class="address-label">
                    <input
                        type="radio"
                        name="selected-address"
                        class="address-select"
                        value="${addr.id}"
                    />
                    <div class="address-info">
                        <div class="addr-title">${addr.title}</div>
                        <div class="addr-text">${addr.text}</div>
                        <div class="addr-phone">📞 ${addr.phone}</div>
                    </div>
                </label>
                <div class="address-actions-vertical">
                    <button type="button"
                        class="address-icon-btn address-edit-btn"
                        data-id="${addr.id}">✏️</button>
                    <button type="button"
                        class="address-icon-btn address-delete-btn"
                        data-id="${addr.id}">🗑️</button>
                </div>
            </div>
            `;

        const input = li.querySelector('input.address-select');
        if (String(addr.id) === String(selectedId)) {
            input.checked = true;
        }

        input.addEventListener('change', () => {
            const userEmail = localStorage.getItem('userEmail');
            localStorage.setItem(`selectedAddressId_${userEmail}`, String(addr.id));
        });

        return li;
    }

    reloadAddressesForCurrentUser();

    confirmDeleteOk.addEventListener('click', () => {
        if (!pendingDeleteAddressId) {
            closeConfirmDeleteModal();
            return;
        }

        let addresses = getStoredAddresses();
        const userEmail = localStorage.getItem('userEmail');
        const selectedId = localStorage.getItem(`selectedAddressId_${userEmail}`);

        addresses = addresses.filter(a => String(a.id) !== String(pendingDeleteAddressId));
        saveStoredAddresses(addresses);

        if (selectedId && String(selectedId) === String(pendingDeleteAddressId)) {
            if (addresses.length) {
                const newSelectedId = addresses[0].id;
                const userEmail = localStorage.getItem('userEmail');
                localStorage.setItem(`selectedAddressId_${userEmail}`, String(newSelectedId));
                renderAddressList(addresses, newSelectedId);
            } else {
                const userEmail = localStorage.getItem('userEmail');
                localStorage.removeItem(`selectedAddressId_${userEmail}`);
                renderAddressList(addresses, null);
            }
        } else {
            renderAddressList(addresses, selectedId);
        }

        closeConfirmDeleteModal();
    });

    document.body.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.address-edit-btn');
        const deleteBtn = e.target.closest('.address-delete-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const addresses = getStoredAddresses();
            const addr = addresses.find(a => String(a.id) === String(id));
            if (!addr) return;

            addressFormMode = 'edit';
            editingAddressId = id;
            fillAddressForm(addr);
            openMap();
            return;
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            openConfirmDeleteModal(id); 
            return;
        }
    });

    function openConfirmDeleteModal(addressId) {
        pendingDeleteAddressId = addressId;
        confirmDeleteModal.classList.remove('hidden');
    }

    function closeConfirmDeleteModal() {
        pendingDeleteAddressId = null;
        confirmDeleteModal.classList.add('hidden');
    }

    confirmDeleteClose.addEventListener('click', closeConfirmDeleteModal);
    confirmDeleteCancel.addEventListener('click', closeConfirmDeleteModal);
    confirmDeleteModal.addEventListener('click', (e) => {
        if (e.target === confirmDeleteModal) {
            closeConfirmDeleteModal();
        }
    });


    let productList = [];
    let cartProduct = [];

    function parsePrice(priceString) {
        if (!priceString) {
            return 0; 
        }

        let cleanedString = priceString.replace(/تومان|ریال/g, '')
            .replace(/\s/g, '') // حذف فاصله ها
            .replace(/,/g, ''); // حذف جداکننده هزارگان (کاما)

        // تبدیل به عدد اعشاری 
        const price = parseFloat(cleanedString);
        return isNaN(price) ? 0 : price;
    }

    const updateCartValue = () => {
        cartValue.textContent = cartProduct.length;
    };

    function updateTotals() {
        let subtotal = 0;

        document.querySelectorAll('.cart-list .item').forEach(item => {
            const itemTotalEl = item.querySelector('.item-total');
            if (!itemTotalEl) return;
            const itemTotal = parseFloat(itemTotalEl.getAttribute("data-total")) || 0;
            subtotal += itemTotal;
        });

        const cartTotalElement = document.querySelector('.cart-total');
        if (cartTotalElement) {
            cartTotalElement.textContent = subtotal.toLocaleString('fa-IR') + ' تومان';
        }
    }

    const displayMyOrdersDetails = (order) => {
        orderItemsList.innerHTML = ''; 
        order.items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name}</span>
                <span>تعداد: ${item.quantity}</span>
                <span>قیمت: ${item.price}</span>

                `;
            orderItemsList.appendChild(li);
        });

        orderTotalPrice.textContent = order.total;
        orderUserName.textContent = order.customer.fullName;
        orderUserContact.textContent = order.customer.phone;
        orderUserAddress.textContent = order.customer.address;
        orderDate.textContent = order.date;
        orderTrackingCode.textContent = order.trackingCode;
    };

    const openMyOrdersModal = () => {

        const userEmail = localStorage.getItem('userEmail');
        const lastOrder = localStorage.getItem(`lastOrder_${userEmail}`);

        const orderDetailsContainer = document.getElementById("order-details-container");
        const noOrdersMessage = document.getElementById("no-orders-message");
        const myOrdersOverlay = document.getElementById("my-orders-overlay");

        if (!orderDetailsContainer || !noOrdersMessage || !myOrdersOverlay) {
            console.warn("Order modal elements not found. (This is normal until the orders page is implemented)");
            return;
        }

        if (lastOrder) {
            const orderData = JSON.parse(lastOrder);
            orderDetailsContainer.style.display = 'flex';
            noOrdersMessage.style.display = 'none';
            displayMyOrdersDetails(orderData);
        } else {
            orderDetailsContainer.style.display = 'none';
            noOrdersMessage.style.display = 'block';
        }

        myOrdersOverlay.classList.add('active');
    };

    const displayOrderSummary = () => {
        orderSummaryList.innerHTML = '';
        let subtotal = 0;

        if (!listCarts || listCarts.length === 0) {
            orderSummaryList.innerHTML = '<li>سبد خرید شما خالی است.</li>';
            updateOrderSummary(0);
            return;
        }

        listCarts.forEach(item => {
            const unitPrice = item.quantity > 0 ? (item.price / item.quantity) : item.price;
            const lineTotal = unitPrice * item.quantity;

            const li = document.createElement('li');
            li.innerHTML = `
              <span class="item-name">${item.name}</span>
              <span class="item-qty">تعداد: ${item.quantity}</span>
              <span class="item-price">قیمت: ${lineTotal.toLocaleString('fa-IR')} تومان</span>
        `;
            orderSummaryList.appendChild(li);

            subtotal += lineTotal;
        });

        updateOrderSummary(subtotal);
        applyDiscountCode(); 
    };


    const addToCart = (product) => {
        if (checkoutModalOverlay && checkoutModalOverlay.classList.contains('active')) {
            return;
        }

        if (!product || !product.id) {
            return;
        }

        const existingProduct = cartProduct.find(item => item.id === product.id);
        if (existingProduct) {
            alert('این آیتم در سبد خرید وجود دارد!');
            return;
        }

        cartProduct.push(product);
        updateCartValue();

        let quantity = 1;
        const unitPrice = Number(product.price); 

        const cartItem = document.createElement('div');
        cartItem.classList.add('item');

        cartItem.innerHTML = `
            <div class="item-image">
                <img src="${product.image}">
            </div>
            <div class="detail">
                <h4>${product.name}</h4>
                <h4 class="item-total" data-total="${unitPrice}">
                    ${unitPrice.toLocaleString('fa-IR')} تومان
                </h4>
            </div>
            <div class="flex">
                <a href="#" class="quantity-btn minus"><i class="fa-solid fa-minus"></i></a>
                <h4 class="quantity-value">${quantity}</h4>
                <a href="#" class="quantity-btn plus"><i class="fa-solid fa-plus"></i></a>
            </div>
        `;

        cartList.appendChild(cartItem);
        updateTotals();

        const plusBtn = cartItem.querySelector('.plus');
        const minusBtn = cartItem.querySelector('.minus');
        const quantityValue = cartItem.querySelector('.quantity-value');
        const itemTotalEl = cartItem.querySelector('.item-total');

        plusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            quantity++;
            const newTotal = unitPrice * quantity;
            quantityValue.textContent = quantity;
            itemTotalEl.textContent = newTotal.toLocaleString('fa-IR') + ' تومان';
            itemTotalEl.setAttribute('data-total', newTotal);
            updateTotals();
        });

        minusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (quantity > 1) {
                quantity--;
                const newTotal = unitPrice * quantity;
                quantityValue.textContent = quantity;
                itemTotalEl.textContent = newTotal.toLocaleString('fa-IR') + ' تومان';
                itemTotalEl.setAttribute('data-total', newTotal);
                updateTotals();
            } else {
                cartItem.classList.add('slide-out');
                setTimeout(() => {
                    cartItem.remove();
                    cartProduct = cartProduct.filter(item => item.id !== product.id);
                    updateTotals();
                    updateCartValue();
                }, 300);
            }
        });
    };

    function updateCategoryTitle(swiper) {
        const index = swiper.activeIndex + 1; 
        const titleEl = document.getElementById('categoryTitle');

        if (index <= 4) titleEl.textContent = "پر سفارش‌ترین‌ ها";
        else if (index <= 8) titleEl.textContent = "همبرگر";
        else if (index <= 12) titleEl.textContent = "پیتزا";
        else if (index <= 17) titleEl.textContent = "پاستا";
        else if (index <= 20) titleEl.textContent = "سوخاری";
        else if (index <= 27) titleEl.textContent = "ساندویچ";
        else if (index <= 37) titleEl.textContent = "غذاهای ایرانی";
        else if (index <= 41) titleEl.textContent = "سالاد";
        else if (index <= 45) titleEl.textContent = "نوشیدنی";
        else titleEl.textContent = "متفرقه";
    }

    function initMenuSwiper() {
        const menuSwiper = new Swiper('.menuSwiper', {
            slidesPerView: 4,
            slidesPerGroup: 1,
            spaceBetween: 20,
            speed: 700,
            loop: false,
            allowTouchMove: true,
            grabCursor: true,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                320: { slidesPerView: 1, slidesPerGroup: 1 },
                640: { slidesPerView: 2, slidesPerGroup: 1 },
                1024: { slidesPerView: 4, slidesPerGroup: 1 },
            },
        });

        // تغییر عنوان بر اساس دسته
        menuSwiper.on('slideChange', function () {
            updateCategoryTitle(this);
        });

        // دستی حلقه‌سازی برای دکمه‌ها
        const nextBtn = document.querySelector('.swiper-button-next');
        const prevBtn = document.querySelector('.swiper-button-prev');

        nextBtn.addEventListener('click', () => {
            if (menuSwiper.isEnd) {
                menuSwiper.slideTo(0);
            }
        });

        prevBtn.addEventListener('click', () => {
            if (menuSwiper.isBeginning) {
                const lastIndex = menuSwiper.slides.length - menuSwiper.params.slidesPerView;
                menuSwiper.slideTo(lastIndex);
            }
        });

        globalMenuSwiper = menuSwiper;

        menuSwiper.on('slideChange', function () {
            updateCategoryTitle(this);
        });
    }

    function showAllInOneSwiper() {
        const menuSection = document.querySelector('#menu-section .wrapper');
        if (!menuSection) return;

        const cartTab = document.querySelector('.cart-tab');
        let savedCartTab = null;

        if (cartTab && cartTab.parentNode === menuSection) {
            savedCartTab = cartTab;
            menuSection.removeChild(cartTab);
        }

        menuSection.innerHTML = `
        <div class="text-center">
            <h5 class="menu-title">منوی ما</h5>
            <h2 id="categoryTitle">پر سفارش‌ترین‌ ها</h2>
            <div class="search-wrapper">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" id="menuSearchInput"
            placeholder="جستجو در منو..."
            class="menu-search-input">
        </div>
        </div>
        <div class="swiper menuSwiper">
            <div class="swiper-wrapper">
                ${productList.filter(item => item.status !== "disabled").map(item => `
  <div class="swiper-slide" data-id="${item.id}">
      <div class="order-card ${item.status === "inactive" ? "inactive-product" :
                item.status === "disabled" ? "disabled-product" : ""}">
          <div class="card-image">
              <img src="${item.image}" alt="${item.name}">
          </div>
          <h4>${item.name}</h4>
          <h4 class="price">${formatPrice(item.price)} تومان</h4>

          <a 
              href="#"
              class="btn card-btn"
              data-id="${item.id}"
              ${(item.status === "inactive" || item.status === "disabled") ? 'style="pointer-events:none; opacity:0.4;"' : ''}
          >
              افزودن
          </a>
      </div>
  </div>
`).join('')}
            </div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
        </div>
    `;

        if (savedCartTab) {
            menuSection.appendChild(savedCartTab);
        }

        initMenuSwiper();

        if (menuSection) {
            menuSection.querySelectorAll('.card-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();

                    const id = btn.dataset.id; 
                    const product = productList.find(p => String(p.id) === String(id));

                    if (product && product.status !== "disabled") {
                        addToCart(product);
                    }
                });
            });
        }

        const searchInput = document.getElementById('menuSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                if (!query || !globalMenuSwiper) return; 

                const searchInput = document.getElementById('menuSearchInput');

                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        const query = normalize(e.target.value);
                        if (!query || !globalMenuSwiper) return;

                        const foundIndex = productList.findIndex(item =>
                            normalize(item.name).includes(query)
                        );

                        if (foundIndex !== -1) {
                            globalMenuSwiper.slideTo(foundIndex);

                            setTimeout(() => {
                                const activeCard = document.querySelector(
                                    `.menuSwiper .swiper-slide:nth-child(${foundIndex + 1}) .order-card`
                                );
                                if (activeCard) {
                                    activeCard.classList.add('highlighted');
                                    setTimeout(() => activeCard.classList.remove('highlighted'), 1500);
                                }
                            }, 300);
                        }
                    });
                }

                for (const [key, items] of Object.entries(window.globalCategories)) {
                    const normKey = normalize(key);

                    if (normKey.includes(query)) {
                        const firstItem = items[0];
                        const index = productList.findIndex(p => p.id === firstItem.id);

                        if (index !== -1) {
                            globalMenuSwiper.slideTo(index);
                            document.getElementById('categoryTitle').textContent = key;
                        }
                        return;
                    }
                }

                const foundIndex = productList.findIndex(item =>
                    item.name.toLowerCase().includes(query)
                );
                if (foundIndex !== -1) {
                    globalMenuSwiper.slideTo(foundIndex);
                    const item = productList[foundIndex];
                    document.getElementById('categoryTitle');

                    // افکت هایلایت کارت پیدا شده
                    setTimeout(() => {
                        const activeCard = document.querySelector(`.menuSwiper .swiper-slide:nth-child(${foundIndex + 1}) .order-card`);
                        if (activeCard) {
                            activeCard.style.transition = 'box-shadow 0.3s ease';
                            activeCard.style.boxShadow = '0 0 15px 3px rgba(242, 18, 134, 0.9)';
                            activeCard.style.borderRadius = '1.5rem';
                            setTimeout(() => {
                                activeCard.style.boxShadow = '';
                            }, 1500);
                        }
                    }, 400);
                }


            });
        }
    }

    async function loadProductsFromServer() {
        try {
            const res = await fetch("api.php?action=get_products");
            const data = await res.json();

            if (Array.isArray(data)) {
                productList = data;

                // دسته‌بندی اولیه
                const categoryOrder = [
                    "پر سفارش‌ترین ها",
                    "همبرگر",
                    "پیتزا",
                    "پاستا",
                    "سوخاری",
                    "ساندویچ",
                    "غذاهای ایرانی",
                    "سالاد",
                    "نوشیدنی",
                    "متفرقه"
                ];

                // مرتب‌سازی بر اساس دسته و id
                productList.sort((a, b) => {
                    const catA = categoryOrder.indexOf(a.category);
                    const catB = categoryOrder.indexOf(b.category);

                    if (catA !== catB) return catA - catB;
                    return a.id - b.id;
                });
            } else {
                productList = [];
            }

            showAllInOneSwiper();

            const categories = {};
            productList.forEach(item => {
                if (!categories[item.category]) {
                    categories[item.category] = [];
                }
                categories[item.category].push(item);
            });
            window.globalCategories = categories;

            updateNavbar();

            setTimeout(() => {
                attachMenuItemClickListeners();
            }, 300);

        } catch (err) {
            console.error("خطا در گرفتن محصولات:", err);
        }
    }

    loadProductsFromServer();

    const switchView = (targetView) => {
        initialView.style.display = 'none';
        signupView.style.display = 'none';
        adminView.style.display = 'none';
        resetView.style.display = 'none';

        targetView.style.display = 'block';

        const successMessage = document.querySelector('#success-message');
        if (successMessage) {
            successMessage.classList.remove('show');
        }
    };

    const forgotPasswordBtn = document.getElementById("forgot-password-btn");

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener("click", (e) => {
            e.preventDefault();
            switchView(resetView);
        });
    }

    const backToInitial = document.querySelector(".btn-text-back-to-initial");

    if (backToInitial) {
        backToInitial.addEventListener("click", () => {
            switchView(initialView);
        });
    }


    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', () => {
            switchView(signupView);
        });
    }

    if (showAdminLoginBtn && adminLoginForm) {
        showAdminLoginBtn.addEventListener('click', () => {
            modalOverlay.classList.add('active');

            switchView(adminView);

            adminLoginForm.reset();
        });

        adminLoginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const username = document.getElementById("admin_username").value.trim();
            const password = document.getElementById("admin_password").value.trim();

            const usernameError = document.getElementById("admin-username-error");
            const passwordError = document.getElementById("admin-password-error");

            usernameError.textContent = "";
            passwordError.textContent = "";

            if (!username || !password) {
                usernameError.textContent = "همه فیلدها را پر کنید.";
                return;
            }

            try {
                const res = await fetch("api.php?action=admin_login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (data.status === "error") {
                    usernameError.textContent = "شناسه یا رمز اشتباه است.";
                    return;
                }

                localStorage.setItem("loggedAdmin", JSON.stringify(data.admin));
                window.location.href = "admin.html";

            } catch (err) {
                usernameError.textContent = "خطا در اتصال به سرور.";
            }
        });
    }

    backToInitialBtns.forEach(button => {
        button.addEventListener('click', () => {
            switchView(initialView);
        });
    });


    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modalOverlay.classList.remove('active');

            if (loginFormDefault) loginFormDefault.reset();
            if (signupForm) signupForm.reset();
            if (adminLoginForm) adminLoginForm.reset();

            switchView(initialView);

            const successMessage = document.querySelector('#success-message');
            if (successMessage) {
                successMessage.classList.remove('show');
            }
        });
    }
});