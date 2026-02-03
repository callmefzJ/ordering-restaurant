<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET , POST , OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// اتصال به دیتابیس
$host = "sql205.infinityfree.com";
$user = "if0_41063501";
$pass = "X6GiepGSQIGt2";
$db   = "if0_41063501_foodie_db";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die(json_encode(["status"=>"error", "message"=>$conn->connect_error]));
}

$action = $_GET["action"] ?? "";

//  REGISTER (ثبت‌نام)
if ($action == "register") {

    $data = json_decode(file_get_contents("php://input"), true);

    $firstname = $conn->real_escape_string($data["firstname"]);
    $lastname  = $conn->real_escape_string($data["lastname"]);
    $gender    = $conn->real_escape_string($data["gender"]);
    $email     = $conn->real_escape_string($data["email"]);
    $password  = $conn->real_escape_string($data["password"]);

    $exists = $conn->query("SELECT id FROM users WHERE email='$email'");
    if ($exists->num_rows > 0) {
        echo json_encode(["status"=>"error", "message"=>"کاربر با این ایمیل قبلاً ثبت‌نام کرده است"]);
        exit;
    }

    $sql = "
        INSERT INTO users (firstname, lastname, gender, email, password, role)
        VALUES ('$firstname', '$lastname', '$gender', '$email', '$password', 'user')
    ";

    if ($conn->query($sql)) {
        echo json_encode(["status"=>"success"]);
    } else {
        echo json_encode(["status"=>"error", "message"=>$conn->error]);
    }

    exit;
}

function cleanCategory($str) {
    if (!$str) return "";

    // نیم‌فاصله‌های اضافی قبل از فاصله
    $str = preg_replace('/\x{200C}(?=\s)/u', '', $str);

    // حذف Zero Width Space و BOM
    $str = preg_replace('/\x{200B}|\x{FEFF}/u', '', $str);

    // اصلاح حروف عربی
    $str = str_replace(['ي','ك'], ['ی','ک'], $str);

    return trim($str);
}

//  LOGIN (ورود)
if ($action == "login") {

    $data = json_decode(file_get_contents("php://input"), true);

    $email    = $conn->real_escape_string($data["email"]);
    $password = $conn->real_escape_string($data["password"]);

    $res = $conn->query("
        SELECT id, firstname, lastname, gender, email, role, phone
        FROM users 
        WHERE email='$email' AND password='$password'
    ");

    if ($res->num_rows == 0) {
        echo json_encode(["status"=>"error", "message"=>"ایمیل یا رمز عبور اشتباه است"]);
        exit;
    }

    $user = $res->fetch_assoc();

    echo json_encode([
        "status" => "success",
        "user"   => $user
    ]);
    exit;
}

//  SAVE ADDRESS (ذخیره آدرس)
if ($action == "save_address") {

    $data = json_decode(file_get_contents("php://input"), true);

    $user_id      = intval($data["user_id"]);
    $title        = $conn->real_escape_string($data["title"]);
    $location     = $conn->real_escape_string($data["location"]);
    $address      = $conn->real_escape_string($data["address"]);
    $full_address = $conn->real_escape_string($data["full_address"]);

    $sql = "
        INSERT INTO user_addresses (user_id, title, location, address, full_address)
        VALUES ($user_id, '$title', '$location', '$address', '$full_address')
    ";

    if ($conn->query($sql)) {
        echo json_encode([
            "status" => "success",
            "id" => $conn->insert_id 
        ]);
    } else {
        echo json_encode(["status"=>"error", "message"=>$conn->error]);
    }

    exit;
}

//  GET ADDRESSES (دریافت آدرس‌ها)
if ($action == "get_addresses") {

    $user_id = intval($_GET["user_id"]);

    $res = $conn->query("SELECT * FROM user_addresses WHERE user_id=$user_id ORDER BY id DESC");

    $addresses = [];
    while ($row = $res->fetch_assoc()) {
        $addresses[] = $row;
    }

    echo json_encode($addresses);
    exit;
}

// دریافت اطلاعات کاربر در پروفایل کاربری
if ($action == "get_user") {

    $id = intval($_GET["id"] ?? 0);

    $res = $conn->query("SELECT id, firstname, lastname, gender, email, phone FROM users WHERE id=$id LIMIT 1");

    if ($res->num_rows == 0) {
        echo json_encode(["status" => "error", "message" => "کاربر پیدا نشد"]);
        exit;
    }

    echo json_encode(["status" => "success", "user" => $res->fetch_assoc()]);
    exit;
}

//ویرایش پروفایل کاربری
if ($action == "update_user") {

    $data = json_decode(file_get_contents("php://input"), true);

    $id        = intval($data["id"]);
    $firstname = $conn->real_escape_string($data["firstname"]);
    $lastname  = $conn->real_escape_string($data["lastname"]);
    $gender    = $conn->real_escape_string($data["gender"]);
    $email     = $conn->real_escape_string($data["email"]);

    $sql = "
        UPDATE users SET
            firstname='$firstname',
            lastname='$lastname',
            gender='$gender',
            email='$email'
        WHERE id=$id
    ";

    if ($conn->query($sql)) {
        echo json_encode(["status"=>"success"]);
    } else {
        echo json_encode(["status"=>"error", "message"=>$conn->error]);
    }

    exit;
}

//  SAVE ORDER (ثبت سفارش)
if ($action == "save_order") {

    $data = json_decode(file_get_contents("php://input"), true);

    $user_id        = intval($data["user_id"]);
    $address_id     = intval($data["address_id"]);
    $subtotal       = intval($data["subtotal"]);
    $delivery_fee   = intval($data["deliveryFee"]);
    $discount_code  = $conn->real_escape_string($data["discountCode"]);
    $discount_amount= intval($data["discountAmount"]);
    $total_payable  = intval($data["totalPayable"]);
    $tracking_code  = $conn->real_escape_string($data["trackingCode"]);
    $date           = $conn->real_escape_string($data["date"]);
    $time           = $conn->real_escape_string($data["time"]);
    $status         = "pending";

    $sql = "
        INSERT INTO orders 
        (user_id, address_id, subtotal, delivery_fee, discount_code, discount_amount, total_payable,
         tracking_code, date, time, status)
        VALUES
        ($user_id, $address_id, $subtotal, $delivery_fee, '$discount_code', $discount_amount, 
         $total_payable, '$tracking_code', '$date', '$time', '$status')
    ";

    if (!$conn->query($sql)) {
        echo json_encode(["status"=>"error", "message"=>$conn->error]);
        exit;
    }

    $order_id = $conn->insert_id;

    foreach ($data["items"] as $item) {
        $name     = $conn->real_escape_string($item["name"]);
        $quantity = intval($item["quantity"]);
        $price    = intval($item["price"]);

        $conn->query("
            INSERT INTO order_items (order_id, item_name, quantity, price)
            VALUES ($order_id, '$name', $quantity, $price)
        ");
    }

    echo json_encode(["status"=>"success", "order_id"=>$order_id]);
    exit;
}

if ($action == "get_orders") {

    $user_id = intval($_GET["user_id"]);

    $res = $conn->query("
        SELECT * FROM orders 
        WHERE user_id=$user_id 
        ORDER BY id ASC
    ");

    $orders = [];

    while ($row = $res->fetch_assoc()) {

        $order_id = $row["id"];

        $address_id = intval($row["address_id"]);
        $addr_res = $conn->query("SELECT title, location, address, full_address 
                              FROM user_addresses 
                              WHERE id=$address_id LIMIT 1");
        $address = $addr_res->fetch_assoc() ?: [
            "title" => "",
            "location" => "",
            "address" => "",
            "full_address" => ""
        ];
        
        $row["address_info"] = $address;

        $items_res = $conn->query("SELECT * FROM order_items WHERE order_id=$order_id");

        $items = [];
        while ($it = $items_res->fetch_assoc()) {
            $items[] = $it;
        }

        $row["items"] = $items;
        $orders[] = $row;
    }

    echo json_encode($orders);
    exit;
}

// menu
if ($action == "get_products") {

    $res = $conn->query("SELECT * FROM products WHERE status != 'disabled' ORDER BY id ASC");

    $products = [];
    while ($row = $res->fetch_assoc()) {
        $products[] = $row;
    }

    echo json_encode($products);
    exit;
}

if ($action == "add_product") {

    $data = json_decode(file_get_contents("php://input"), true);

    $name = $conn->real_escape_string($data["name"]);
    $price = intval($data["price"]);
    $category = cleanCategory($data["category"]);
    $category = $conn->real_escape_string($category);
    $description = $conn->real_escape_string($data["description"]);
    $image = $conn->real_escape_string($data["image"]);

    $sql = "INSERT INTO products (name, price, category, description, image, status)
            VALUES ('$name', $price, '$category', '$description', '$image', 'active')";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "id" => $conn->insert_id]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
    exit;
}

if ($action == "update_phone") {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data["user_id"]);
    $phone = $conn->real_escape_string($data["phone"]);
    $conn->query("UPDATE users SET phone='$phone' WHERE id=$id");
    echo json_encode(["status" => "success"]);
    exit;
}

if ($action == "update_product") {

    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data["id"]);

    $name = $conn->real_escape_string($data["name"]);
    $price = intval($data["price"]);
    $category = cleanCategory($data["category"]);
    $category = $conn->real_escape_string($category);
    $description = $conn->real_escape_string($data["description"]);
    $image = $conn->real_escape_string($data["image"]);
    $status = $conn->real_escape_string($data["status"]);

    $sql = "UPDATE products SET
                name='$name',
                price=$price,
                category='$category',
                description='$description',
                image='$image',
                status='$status'
            WHERE id=$id";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
    exit;
}

if ($action == "delete_product") {

    $id = intval($_GET["id"]);

    $conn->query("UPDATE products SET status='disabled' WHERE id=$id");

    echo json_encode(["status" => "success"]);
    exit;
}

// تیکت ها
if ($action == "save_ticket") {
    $data = json_decode(file_get_contents("php://input"), true);

    $user_id = intval($data["user_id"]);
    $title   = $conn->real_escape_string($data["title"]);
    $message = $conn->real_escape_string($data["message"]);

    $sql = "
        INSERT INTO tickets (user_id, title, message, status, created_at)
        VALUES ($user_id, '$title', '$message', 'pending', NOW())
    ";

    if ($conn->query($sql)) {
        echo json_encode(["status"=>"success", "id"=>$conn->insert_id]);
    } else {
        echo json_encode(["status"=>"error", "message"=>$conn->error]);
    }

    exit;
}

if ($action == "get_tickets") {
    $user_id = intval($_GET["user_id"]);

    $res = $conn->query("
        SELECT id, title, message, reply, status, created_at
        FROM tickets
        WHERE user_id = $user_id AND
        deleted_by_user = 0
        ORDER BY id ASC
    ");

    $tickets = [];
    while ($row = $res->fetch_assoc()) {
        $tickets[] = $row;
    }

    echo json_encode(["status"=>"success", "tickets"=>$tickets]);
    exit;
}

if ($action == "delete_tickets") {
    $data = json_decode(file_get_contents("php://input"), true);

    $ids = $data["ids"];  

    foreach ($ids as $id) {
        $id = intval($id);
        $conn->query("UPDATE tickets SET deleted_by_user = 1 WHERE id = $id");
    }

    echo json_encode(["status" => "success"]);
    exit;
}

//بخش نظرات
if ($action == "add_review") {

    $data = json_decode(file_get_contents("php://input"), true);

    $user_id = intval($data["user_id"]);
    $text    = $conn->real_escape_string($data["text"]);

    $sql = "
        INSERT INTO reviews (user_id, text, created_at, status)
        VALUES ($user_id, '$text', NOW(), 'pending')
    ";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }

    exit;
}

if ($action == "get_reviews") {

    $user_id = intval($_GET["user_id"]);

    $res = $conn->query("
        SELECT id, text, created_at, reply, status
        FROM reviews
        WHERE user_id = $user_id
        ORDER BY id DESC
    ");

    $reviews = [];
    while ($row = $res->fetch_assoc()) {
        $reviews[] = $row;
    }

    echo json_encode(["status" => "success", "reviews" => $reviews]);
    exit;
}

//بخش کد رهگیری
if ($action == "track_order") {

    $code = $conn->real_escape_string($_GET["code"]);

    $res = $conn->query("
        SELECT * FROM orders
        WHERE tracking_code = '$code'
        LIMIT 1
    ");

    if ($res->num_rows === 0) {
        echo json_encode(["status" => "not_found"]);
        exit;
    }

    $order = $res->fetch_assoc();
    $order_id = $order["id"];
    $items_res = $conn->query("SELECT item_name, quantity FROM order_items WHERE order_id = $order_id");
    $items = [];

    while ($it = $items_res->fetch_assoc()) {
        $items[] = $it;
    }

    $order["items"] = $items;

    echo json_encode([
        "status" => "success",
        "order" => $order
    ]);
    exit;
}

//ورود مدیر
if ($action === "admin_login") {

    $data = json_decode(file_get_contents("php://input"), true);

    $username = $conn->real_escape_string($data["username"]);
    $password = $conn->real_escape_string($data["password"]);

    $query = "SELECT * FROM admins WHERE username = '$username' LIMIT 1";
    $res = $conn->query($query);

    if ($res->num_rows === 0) {
        echo json_encode(["status" => "error"]);
        exit;
    }

    $admin = $res->fetch_assoc();

    if ($password !== $admin["password"]) {
        echo json_encode(["status" => "error"]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "admin" => [
            "id" => $admin["id"],
            "firstname" => $admin["firstname"],
            "lastname" => $admin["lastname"],
            "username" => $admin["username"],
            "email" => $admin["email"],
            "role" => $admin["role"]
        ]
    ]);
    exit;
}

//آمار روزانه
if ($action == "admin_get_all_orders") {

    $res = $conn->query("SELECT * FROM orders ORDER BY id DESC");

    $orders = [];

    while ($row = $res->fetch_assoc()) {

        $order_id = $row["id"];

        $items = [];
        $items_res = $conn->query("SELECT item_name, quantity, price FROM order_items WHERE order_id=$order_id");
        while ($it = $items_res->fetch_assoc()) {
            $items[] = $it;
        }
        $row["items"] = $items;
        $uid = intval($row["user_id"]);
        $usr = $conn->query("SELECT firstname, lastname, email, phone FROM users WHERE id=$uid LIMIT 1")->fetch_assoc();

        $row["customer"] = [
            "fullName" => $usr["firstname"] . " " . $usr["lastname"],
            "email"    => $usr["email"],
            "phone"    => $usr["phone"]
        ];
        $addr = $conn->query("SELECT title, location, address, full_address FROM user_addresses WHERE id=" . intval($row["address_id"]) . " LIMIT 1")->fetch_assoc();
        $row["address_info"] = $addr ?: [];

        $orders[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "orders" => $orders
    ]);
    exit;
}

//مشتریان اخیر داشبورد
if ($action == "admin_get_users") {

    $res = $conn->query("
        SELECT id, firstname, lastname, gender, email, phone, password 
        FROM users
        WHERE deleted = 0 
        ORDER BY id DESC
        LIMIT 50
    ");

    $users = [];

    while ($row = $res->fetch_assoc()) {
        $users[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "users"  => $users
    ]);
    exit;
}

//جدول سفارش‌ها
if ($action === "admin_get_orders_table") {

    $res = $conn->query("
        SELECT 
            o.id,
            o.user_id,
            o.address_id,
            o.subtotal,
            o.delivery_fee,
            o.discount_code,
            o.discount_amount,
            o.total_payable,
            o.tracking_code,
            o.date,
            o.time,
            o.status,
            o.delivery_time,
            o.reject_reason
        FROM orders o
        WHERE o.deleted = 0  
        ORDER BY o.id DESC
    ");

    $orders = [];

    while ($row = $res->fetch_assoc()) {

        $uid = intval($row["user_id"]);
        $u = $conn->query("
            SELECT firstname, lastname, email, phone 
            FROM users 
            WHERE id=$uid LIMIT 1
        ")->fetch_assoc();

        $row["customer"] = [
            "fullName" => $u["firstname"] . " " . $u["lastname"],
            "email"    => $u["email"],
            "phone"    => $u["phone"]
        ];

        $addr = $conn->query("
            SELECT title, location, address, full_address 
            FROM user_addresses 
            WHERE id=" . intval($row["address_id"]) . " LIMIT 1
        ")->fetch_assoc();

        $row["address_info"] = $addr ?: [];

        $items = [];
        $itRes = $conn->query("
            SELECT item_name, quantity, price 
            FROM order_items 
            WHERE order_id=" . intval($row["id"])
        );
        while ($it = $itRes->fetch_assoc()) {
            $items[] = $it;
        }

        $row["items"] = $items;

        $orders[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "orders" => $orders
    ]);
    exit;
}

if ($action === "admin_delete_order") {

    $id = intval($_POST["id"]);

    $conn->query("UPDATE orders SET deleted = 1 WHERE id=$id");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_update_order_status") {

    $id = intval($_POST["id"]);
    $status = $_POST["status"];
    $delivery_time = $_POST["delivery_time"] ?? "";
    $reject_reason = $_POST["reject_reason"] ?? "";

    $conn->query("
        UPDATE orders SET 
            status='$status',
            delivery_time='$delivery_time',
            reject_reason='$reject_reason'
        WHERE id=$id
    ");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_get_deleted_orders") {

    $res = $conn->query("
        SELECT 
            o.*,
            CONCAT(u.firstname, ' ', u.lastname) AS customer_name,
            u.phone,
            a.full_address
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN user_addresses a ON a.id = o.address_id
        WHERE o.deleted = 1
        ORDER BY o.id DESC
    ");

    $orders = [];

    while ($row = $res->fetch_assoc()) {

        $items = [];
        $it = $conn->query("SELECT * FROM order_items WHERE order_id=" . $row["id"]);
        while ($i = $it->fetch_assoc()) {
            $items[] = $i;
        }
        $row["items"] = $items;

        $orders[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "orders" => $orders
    ]);
    exit;
}

if ($action === "admin_restore_order") {

    $id = intval($_POST["id"]);
    $conn->query("UPDATE orders SET deleted = 0 WHERE id=$id");

    echo json_encode(["status" => "success"]);
    exit;
}

//جدول محصولات
if ($action === "admin_get_all_products") {

    $res = $conn->query("SELECT * FROM products ORDER BY id ASC");

    $products = [];
    while ($row = $res->fetch_assoc()) {
        $products[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "products" => $products
    ]);
    exit;
}

if ($action === "admin_update_product") {

    $id = intval($_POST["id"]);
    $name = $conn->real_escape_string($_POST["name"]);
    $price = intval($_POST["price"]);
    $category = cleanCategory($_POST["category"]);
    $category = $conn->real_escape_string($category);
    $desc = $conn->real_escape_string($_POST["desc"]);
    $image = $conn->real_escape_string($_POST["image"]);

    $conn->query("
        UPDATE products 
        SET name='$name', price=$price, category='$category', description='$desc', image='$image'
        WHERE id=$id
    ");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_change_product_status") {

    $id = intval($_POST["id"]);
    $status = $conn->real_escape_string($_POST["status"]);

    $conn->query("UPDATE products SET status='$status' WHERE id=$id");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_add_product") {

    $name = $conn->real_escape_string($_POST["name"]);
    $price = intval($_POST["price"]);
    $category = cleanCategory($_POST["category"]);
    $category = $conn->real_escape_string($category);
    $desc = $conn->real_escape_string($_POST["desc"]);
    $image = $conn->real_escape_string($_POST["image"]);

    $conn->query("
        INSERT INTO products (name, price, category, description, image, status)
        VALUES ('$name', $price, '$category', '$desc', '$image', 'active')
    ");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "upload_product_image") {

    $uploadDir = "images/";

    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if (!isset($_FILES["image"])) {
        echo json_encode(["status" => "error", "message" => "no file"]);
        exit;
    }

    $file = $_FILES["image"];
    $originalName = $file["name"];
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $nameOnly = pathinfo($originalName, PATHINFO_FILENAME);

    $allowed = ["jpg", "jpeg", "png", "webp"];
    if (!in_array($ext, $allowed)) {
        echo json_encode(["status" => "error", "message" => "invalid file type"]);
        exit;
    }

    $finalName = $nameOnly . "." . $ext;
    $counter = 1;

    while (file_exists($uploadDir . $finalName)) {
        $finalName = $nameOnly . "_" . $counter . "." . $ext;
        $counter++;
    }

    $target = $uploadDir . $finalName;

    if (move_uploaded_file($file["tmp_name"], $target)) {
        echo json_encode([
            "status" => "success",
            "path" => $target
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "upload failed"]);
    }

    exit;
}

//لیست مشتری ها
if ($action == "admin_get_user_orders") {

    $uid = intval($_GET["user_id"]);

    $res = $conn->query("
        SELECT 
            o.*,
            u.firstname,
            u.lastname,
            u.phone
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        WHERE o.user_id = $uid AND o.deleted = 0
        ORDER BY o.id DESC
    ");

    $orders = [];

    while ($row = $res->fetch_assoc()) {
        $itemsRes = $conn->query("
            SELECT item_name, quantity, price 
            FROM order_items 
            WHERE order_id=" . intval($row["id"])
        );

        $items = [];
        while ($it = $itemsRes->fetch_assoc()) {
            $items[] = $it;
        }

        $addr = $conn->query("
            SELECT title, location, address, full_address 
            FROM user_addresses 
            WHERE id=" . intval($row["address_id"]) . " 
            LIMIT 1
        ")->fetch_assoc();

        $row["items"] = $items;
        $row["address"] = $addr ?: [];
        $row["customer"] = [
            "fullName" => $row["firstname"] . " " . $row["lastname"],
            "phone"    => $row["phone"]
        ];

        $orders[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "orders" => $orders
    ]);
    exit;
}

if ($action === "admin_delete_customer") {

    $id = intval($_POST["id"]);

    $conn->query("UPDATE users SET deleted = 1 WHERE id=$id");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_get_deleted_customers") {

    $res = $conn->query("
        SELECT id, firstname, lastname, email, phone 
        FROM users
        WHERE deleted = 1
        ORDER BY id DESC
    ");

    $users = [];

    while ($row = $res->fetch_assoc()) {

        $addr = $conn->query("
            SELECT location 
            FROM user_addresses 
            WHERE user_id=" . intval($row["id"]) . " 
            LIMIT 1
        ")->fetch_assoc();

        $row["firstAddress"] = $addr["location"] ?? "-";

        $ord = $conn->query("
            SELECT COUNT(*) AS cnt 
            FROM orders 
            WHERE user_id=" . intval($row["id"])
        )->fetch_assoc();

        $row["orderCount"] = $ord["cnt"] ?? 0;

        $users[] = $row;
    }

    echo json_encode(["status" => "success", "users" => $users]);
    exit;
}

if ($action === "admin_restore_customer") {

    $id = intval($_POST["id"]);

    $conn->query("UPDATE users SET deleted = 0 WHERE id=$id");

    echo json_encode(["status" => "success"]);
    exit;
}

//لیست نظرات
if ($action === "admin_get_all_messages") {

    $res = $conn->query("
        SELECT 
            r.id,
            r.user_id,
            r.text,
            r.reply,
            r.status,
            r.created_at,
            u.firstname,
            u.lastname,
            u.email
        FROM reviews r
        LEFT JOIN users u ON u.id = r.user_id
        WHERE r.deleted = 0
        ORDER BY r.id DESC
    ");

    $messages = [];

    while ($row = $res->fetch_assoc()) {
        $row["fullname"] = $row["firstname"] . " " . $row["lastname"];
        $messages[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "messages" => $messages
    ]);
    exit;
}

if ($action === "admin_delete_message") {

    $id = intval($_POST["id"]);
    $conn->query("UPDATE reviews SET deleted = 1 WHERE id=$id");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_get_deleted_messages") {

    $res = $conn->query("
        SELECT 
            r.id,
            r.user_id,
            r.text,
            r.reply,
            r.status,
            r.created_at,
            u.firstname,
            u.lastname,
            u.email
        FROM reviews r
        LEFT JOIN users u ON u.id = r.user_id
        WHERE r.deleted = 1
        ORDER BY r.id DESC
    ");

    $messages = [];
    while ($row = $res->fetch_assoc()) {
        $row["fullname"] = $row["firstname"] . " " . $row["lastname"];
        $messages[] = $row;
    }

    echo json_encode(["status" => "success", "messages" => $messages]);
    exit;
}

if ($action === "admin_restore_message") {

    $id = intval($_POST["id"]);
    $conn->query("UPDATE reviews SET deleted = 0 WHERE id=$id");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_reply_message") {

    $id = intval($_POST["id"]);
    $reply = $conn->real_escape_string($_POST["reply"]);
    $status = $reply ? "replied" : "read";

    $conn->query("
        UPDATE reviews
        SET reply='$reply', status='$status'
        WHERE id=$id
    ");

    echo json_encode(["status" => "success"]);
    exit;
}

//تیکت ها
if ($action === "admin_get_all_tickets") {

    $res = $conn->query("
        SELECT 
            t.id,
            t.user_id,
            t.title,
            t.message,
            t.reply,
            t.status,
            t.created_at,
            u.firstname,
            u.lastname,
            u.email
        FROM tickets t
        LEFT JOIN users u ON u.id = t.user_id
        WHERE t.deleted_by_admin = 0
        ORDER BY t.id DESC
    ");

    $tickets = [];

    while ($row = $res->fetch_assoc()) {
        $row["fullname"] = $row["firstname"] . ' ' . $row["lastname"];
        $tickets[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "tickets" => $tickets
    ]);
    exit;
}

if ($action === "admin_delete_ticket") {

    $id = intval($_POST["id"]);

    $conn->query("UPDATE tickets SET deleted_by_admin = 1 WHERE id = $id");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_get_deleted_tickets") {

    $res = $conn->query("
        SELECT 
            t.id,
            t.user_id,
            t.title,
            t.message,
            t.reply,
            t.status,
            t.created_at,
            u.firstname,
            u.lastname,
            u.email
        FROM tickets t
        LEFT JOIN users u ON u.id = t.user_id
        WHERE t.deleted_by_admin = 1
        ORDER BY t.id DESC
    ");

    $tickets = [];

    while ($row = $res->fetch_assoc()) {
        $row["fullname"] = $row["firstname"] . ' ' . $row["lastname"];
        $tickets[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "tickets" => $tickets
    ]);
    exit;
}

if ($action === "admin_restore_ticket") {

    $id = intval($_POST["id"]);

    $conn->query("UPDATE tickets SET deleted_by_admin = 0 WHERE id = $id");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_get_single_ticket") {

    $id = intval($_GET["id"]);

    $res = $conn->query("
        SELECT 
            t.id,
            t.user_id,
            t.title,
            t.message,
            t.reply,
            t.status,
            t.created_at,
            u.firstname,
            u.lastname,
            u.email
        FROM tickets t
        LEFT JOIN users u ON u.id = t.user_id
        WHERE t.id = $id
        LIMIT 1
    ");

    if ($res->num_rows === 0) {
        echo json_encode(["status" => "error", "message" => "Ticket not found"]);
        exit;
    }

    $ticket = $res->fetch_assoc();
    $ticket["fullname"] = $ticket["firstname"] . ' ' . $ticket["lastname"];

    echo json_encode([
        "status" => "success",
        "ticket" => $ticket
    ]);
    exit;
}

if ($action === "admin_reply_ticket") {

    $id = intval($_POST["id"]);
    $reply = $conn->real_escape_string($_POST["reply"]);

    $status = $reply ? "replied" : "read";

    $conn->query("
        UPDATE tickets 
        SET reply = '$reply', status = '$status'
        WHERE id = $id
    ");

    echo json_encode(["status" => "success"]);
    exit;
}

//تنظیمات
if ($action === "admin_get_profile") {

    $id = intval($_GET["id"]);

    $res = $conn->query("
        SELECT id, firstname, lastname, username, email, role, avatar
        FROM admins
        WHERE id = $id
        LIMIT 1
    ");

    if ($res->num_rows === 0) {
        echo json_encode(["status" => "error"]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "admin" => $res->fetch_assoc()
    ]);
    exit;
}

if ($action === "admin_get_all_users") {

    $res = $conn->query("
        SELECT id, firstname, lastname, email, role
        FROM users
        WHERE deleted = 0
        ORDER BY id DESC
    ");

    $users = [];
    while ($row = $res->fetch_assoc()) {
        $users[] = $row;
    }

    echo json_encode(["status"=>"success", "users"=>$users]);
    exit;
}

if ($action === "admin_get_all_admins") {
    $res = $conn->query("SELECT id, firstname, lastname, email, role, avatar FROM admins");
    
    $admins = [];
    while ($row = $res->fetch_assoc()) {
        $admins[] = $row;
    }

    echo json_encode(["status" => "success", "admins" => $admins]);
    exit;
}

if ($action === "admin_get_admin") {

    $id = intval($_GET["id"]);

    $res = $conn->query("SELECT id, firstname, lastname, username, email, role, avatar 
                         FROM admins WHERE id=$id LIMIT 1");

    if ($res->num_rows === 0) {
        echo json_encode(["status" => "error"]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "admin" => $res->fetch_assoc()
    ]);
    exit;
}

if ($action === "admin_update_avatar") {
    $id = intval($_POST["id"]);
    $avatar = $conn->real_escape_string($_POST["avatar"]);
    $conn->query("UPDATE admins SET avatar='$avatar' WHERE id=$id");
    echo json_encode(["status"=>"success"]);
    exit;
}

if ($action === "admin_update_info") {
    $id = intval($_POST["id"]);
    $username = $_POST["username"];
    $name = $_POST["name"];
    $email = $_POST["email"];

    $conn->query("
        UPDATE admins SET
        username='$username',
        firstname='$name',
        email='$email'
        WHERE id=$id
    ");

    echo json_encode(["status"=>"success"]);
    exit;
}

if ($action === "admin_change_password") {
    $id = intval($_POST["id"]);
    $old = $_POST["old"];
    $new = $_POST["new"];

    $res = $conn->query("SELECT password FROM admins WHERE id=$id");
    $row = $res->fetch_assoc();

    if ($row["password"] !== $old) {
        echo json_encode(["status"=>"error", "message"=>"wrong_old"]);
        exit;
    }

    $conn->query("UPDATE admins SET password='$new' WHERE id=$id");

    echo json_encode(["status"=>"success"]);
    exit;
}

if ($action === "admin_get_shipping_fee") {

    $res = $conn->query("SELECT fee FROM shipping_fee ORDER BY id DESC LIMIT 1");

    if ($res->num_rows > 0) {
        $row = $res->fetch_assoc();
        echo json_encode([
            "status" => "success",
            "fee" => intval($row["fee"])
        ]);
    } else {
        echo json_encode([
            "status" => "success",
            "fee" => 0
        ]);
    }

    exit;
}

if ($action === "admin_update_shipping_fee") {

    $fee = intval($_POST["fee"]);

    $conn->query("
        INSERT INTO shipping_fee (fee, updated_at) 
        VALUES ($fee, NOW())
    ");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_get_discount_codes") {

    $res = $conn->query("
        SELECT id, code, percent, status, created_at 
        FROM discount_codes
        ORDER BY id DESC
    ");

    $codes = [];
    while ($row = $res->fetch_assoc()) {
        $codes[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "codes" => $codes
    ]);
    exit;
}

if ($action === "admin_save_discount_code") {

    $code = $conn->real_escape_string($_POST["code"]);
    $percent = intval($_POST["percent"]);
    $status = $conn->real_escape_string($_POST["status"]); 

    $check = $conn->query("SELECT id FROM discount_codes WHERE code='$code' LIMIT 1");

    if ($check->num_rows > 0) {

        $id = $check->fetch_assoc()["id"];

        $conn->query("
            UPDATE discount_codes
            SET percent=$percent, status='$status'
            WHERE id=$id
        ");

    } else {

        $conn->query("
            INSERT INTO discount_codes (code, percent, status, created_at)
            VALUES ('$code', $percent, '$status', NOW())
        ");
    }

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_set_discount_status") {

    $code = $conn->real_escape_string($_POST["code"]);
    $status = $conn->real_escape_string($_POST["status"]); // active / inactive

    $conn->query("
        UPDATE discount_codes
        SET status='$status'
        WHERE code='$code'
    ");

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "get_discount") {
    $code = strtoupper(trim($_GET["code"]));

    $stmt = $conn->prepare("
        SELECT id, code, percent, status, created_at
        FROM discount_codes
        WHERE UPPER(code) = ? 
        LIMIT 1
    ");
    $stmt->bind_param("s", $code);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 0) {
        echo json_encode(["status" => "not_found"]);
        exit;
    }

    $row = $res->fetch_assoc();

    if ($row["status"] !== "active") {
        echo json_encode(["status" => "inactive"]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "discount" => [
            "code" => $row["code"],
            "type" => "percent",
            "value" => intval($row["percent"])
        ]
    ]);
    exit;
}

if ($action === "admin_get_user_role") {

    $email = $conn->real_escape_string($_GET["email"]);

    // اطلاعات کاربر
    $userRes = $conn->query("
        SELECT id, firstname, lastname, email, role
        FROM users
        WHERE email='$email'
        LIMIT 1
    ");

    if ($userRes->num_rows === 0) {
        echo json_encode(["status" => "error", "message" => "user_not_found"]);
        exit;
    }

    $user = $userRes->fetch_assoc();

    // اطلاعات مدیریتی
    $adminRes = $conn->query("
        SELECT username, password
        FROM admins
        WHERE email='$email'
        LIMIT 1
    ");

    $admin = $adminRes->num_rows > 0 ? $adminRes->fetch_assoc() : null;

    echo json_encode([
        "status" => "success",
        "user" => $user,
        "admin" => $admin
    ]);
    exit;
}

if ($action === "admin_update_user_role") {

    $email = $conn->real_escape_string($_POST["email"]);
    $role  = $conn->real_escape_string($_POST["role"]);
    $username = $conn->real_escape_string($_POST["username"]);
    $password = $conn->real_escape_string($_POST["password"]);

    $conn->query("
        UPDATE users SET role='$role'
        WHERE email='$email'
    ");

    if ($role === "user") {
        $conn->query("DELETE FROM admins WHERE email='$email'");
    } 
    else {
        $check = $conn->query("SELECT id FROM admins WHERE email='$email'");

        if ($check->num_rows) {
  
            $conn->query("
                UPDATE admins
                SET username='$username', password='$password', role='$role'
                WHERE email='$email'
            ");
        } else {
    
            $conn->query("
                INSERT INTO admins (firstname, lastname, username, email, password, role)
                SELECT firstname, lastname, '$username', email, '$password', '$role'
                FROM users
                WHERE email='$email'
                LIMIT 1
            ");
        }
    }

    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === "admin_upload_avatar") {

    $uploadDir = "images/admins/";

    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if (!isset($_FILES["avatar"])) {
        echo json_encode(["status" => "error", "message" => "no file"]);
        exit;
    }

    $file = $_FILES["avatar"];
    $originalName = $file["name"]; 
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $nameOnly = pathinfo($originalName, PATHINFO_FILENAME);

    $allowed = ["jpg", "jpeg", "png", "webp"];
    if (!in_array($ext, $allowed)) {
        echo json_encode(["status" => "error", "message" => "invalid file type"]);
        exit;
    }

    $finalName = $originalName;
    $counter = 1;

    while (file_exists($uploadDir . $finalName)) {
        $finalName = $nameOnly . "_" . $counter . "." . $ext;
        $counter++;
    }

    $path = $uploadDir . $finalName;

    if (move_uploaded_file($file["tmp_name"], $path)) {

        $id = intval($_POST["id"]);

        $conn->query("UPDATE admins SET avatar='$finalName' WHERE id=$id");

        echo json_encode([
            "status" => "success",
            "filename" => $finalName,
            "url" => $path
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "upload failed"]);
    }

    exit;
}

//  ACTION NOT FOUND
echo json_encode(["status"=>"error", "message"=>"invalid action"]);
exit;


?>
