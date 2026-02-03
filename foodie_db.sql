-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Feb 03, 2026 at 01:29 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `foodie_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `firstname` varchar(50) NOT NULL,
  `lastname` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'admin',
  `avatar` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `firstname`, `lastname`, `email`, `password`, `role`, `avatar`) VALUES
(1, 'admin01', 'مدیر کل', 'کل', 'admin@example.com', 'admin@1010', 'super', 'pro.png'),
(2, 'siminBN87', 'ناهید', 'ساعدی', 'siminBN87@gmail.com', 'siminN%12', 'orders', NULL),
(3, 'rezaRM65', 'رضا', 'نریمانی', 'rezaRM65@gmail.com', 'armaniR&77', 'products', NULL),
(4, 'erfan10mani', 'عرفان', 'سنایی', 'erfan10mani@gmail.com', 'erF53@10', 'support', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `discount_codes`
--

DROP TABLE IF EXISTS `discount_codes`;
CREATE TABLE IF NOT EXISTS `discount_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `percent` int NOT NULL,
  `status` enum('active','inactive') DEFAULT 'inactive',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `discount_codes`
--

INSERT INTO `discount_codes` (`id`, `code`, `percent`, `status`, `created_at`) VALUES
(1, 'OFF2025', 15, 'active', '2025-12-05 20:59:06');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `address_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `subtotal` int NOT NULL,
  `delivery_fee` int NOT NULL,
  `discount_code` varchar(50) DEFAULT NULL,
  `discount_amount` int DEFAULT '0',
  `total_payable` int NOT NULL,
  `tracking_code` varchar(20) DEFAULT NULL,
  `date` varchar(20) DEFAULT NULL,
  `time` varchar(20) DEFAULT NULL,
  `status` enum('pending','approved','delivered','canceled') DEFAULT 'pending',
  `delivery_time` varchar(50) DEFAULT NULL,
  `reject_reason` text,
  `deleted` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tracking_code` (`tracking_code`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `address_id`, `user_id`, `subtotal`, `delivery_fee`, `discount_code`, `discount_amount`, `total_payable`, `tracking_code`, `date`, `time`, `status`, `delivery_time`, `reject_reason`, `deleted`) VALUES
(10, 19, 1, 215000, 60000, '', 0, 275000, '6AO91PBO', '۱۴۰۴/۹/۱۲', '۱۵:۳۲:۱۴', 'approved', '25 دقیقه', '', 0),
(9, 18, 1, 210000, 60000, '', 0, 270000, 'QW2EJ3KO', '۱۴۰۴/۹/۱۲', '۱۵:۳۰:۱۴', 'approved', '30 دقیقه', '', 0),
(11, 20, 2, 345000, 60000, '', 0, 405000, '3TH3KI1V', '۱۴۰۴/۹/۱۳', '۱۵:۰۴:۱۹', 'canceled', '', 'آدرس ناقص', 0),
(12, 21, 2, 575000, 60000, '', 0, 635000, '8168O88I', '۱۴۰۴/۹/۱۳', '۲۳:۱۷:۴۳', 'pending', NULL, NULL, 1),
(13, 22, 2, 270000, 60000, '', 0, 330000, 'F0VJWZLD', '۱۴۰۴/۹/۱۴', '۲۱:۳۸:۰۰', 'pending', NULL, NULL, 1),
(14, 23, 4, 275000, 60000, 'OFF2025', 41250, 293750, '2UVRECFH', '۱۴۰۴/۹/۱۴', '۲۱:۴۷:۳۴', 'pending', NULL, NULL, 1),
(15, 23, 4, 515000, 80000, '', 0, 595000, 'TB6OUQM5', '۱۴۰۴/۹/۱۴', '۲۲:۱۳:۰۰', 'pending', NULL, NULL, 0),
(16, 24, 7, 285000, 80000, '', 0, 365000, 'SORXCWOC', '۱۴۰۴/۹/۱۷', '۲۱:۳۶:۰۷', 'pending', NULL, NULL, 0),
(17, 18, 1, 360000, 80000, '', 0, 440000, '3EV9EBY6', '۱۴۰۴/۹/۲۲', '۱۱:۳۶:۲۱', 'pending', NULL, NULL, 0),
(18, 25, 4, 200000, 80000, '', 0, 280000, 'T4Z0CU5F', '۱۴۰۴/۹/۲۴', '۰:۳۹:۴۷', 'pending', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `item_name` varchar(200) NOT NULL,
  `quantity` int NOT NULL,
  `price` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`)
) ENGINE=MyISAM AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `item_name`, `quantity`, `price`) VALUES
(14, 10, 'خورشت کاری', 1, 190000),
(13, 10, 'زرشک پلو با مرغ', 1, 25000),
(12, 9, 'نوشابه قوطی کوکاکولا', 1, 30000),
(11, 9, 'همبرگر کلاسیک', 1, 180000),
(15, 11, 'میرزا قاسمی', 1, 150000),
(16, 11, 'لیموناد', 1, 35000),
(17, 11, 'سالاد ماکارونی', 1, 110000),
(18, 11, 'سیب زمینی سرخ کرده', 1, 50000),
(19, 12, 'پیتزا پپرونی', 1, 350000),
(20, 12, 'پاستا سبزیجات', 1, 145000),
(21, 12, 'سیب زمینی سرخ کرده', 1, 50000),
(22, 12, 'نوشابه قوطی کوکاکولا', 1, 30000),
(23, 13, 'میرزا قاسمی', 1, 150000),
(24, 13, 'دلمه', 1, 85000),
(25, 13, 'لیموناد', 1, 35000),
(26, 14, 'سالاد فصل', 1, 120000),
(27, 14, 'شنیسل', 1, 120000),
(28, 14, 'لیموناد', 1, 35000),
(29, 15, 'پیتزا مخصوص', 1, 330000),
(30, 15, 'لیموناد', 1, 35000),
(31, 15, 'پاستا پستو', 1, 150000),
(32, 16, 'همبرگر کلاسیک', 1, 180000),
(33, 16, 'پیتزا مرغ', 1, 25000),
(34, 16, 'نوشابه قوطی کوکاکولا', 1, 30000),
(35, 16, 'سیب زمینی سرخ کرده', 1, 50000),
(36, 17, 'خوراک دنده کبابی', 1, 180000),
(37, 17, 'همبرگر کلاسیک', 1, 180000),
(38, 18, 'چیکن برگر', 1, 150000),
(39, 18, 'پیتزا مرغ', 1, 25000),
(40, 18, 'ماست', 1, 25000);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `price` int NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `image` text,
  `description` text,
  `status` enum('active','inactive','disabled') DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `category`, `image`, `description`, `status`) VALUES
(1, 'جوجه کبابی', 175000, 'پر سفارش‌ترین ها', 'images/roastChicken.png', '', 'active'),
(2, 'خوراک دنده کبابی', 180000, 'پر سفارش‌ترین ها', 'images/roastbeef.png', NULL, 'active'),
(3, 'خوراک راسته کبابی', 160000, 'پر سفارش‌ترین ها', 'images/roastMeat.png', NULL, 'active'),
(4, 'ماهی کبابی', 140000, 'پر سفارش‌ترین ها', 'images/grilledFish.png', NULL, 'active'),
(5, 'همبرگر کلاسیک', 180000, 'همبرگر', 'images/burger.png', NULL, 'active'),
(6, 'چیکن برگر', 150000, 'همبرگر', 'images/chickenBurger.png', NULL, 'active'),
(7, 'دوبل برگر', 220000, 'همبرگر', 'images/doubleBurger.png', NULL, 'active'),
(8, 'برگر ذغالی', 190000, 'همبرگر', 'images/blackBurger.png', NULL, 'active'),
(9, 'پیتزا مخصوص', 330000, 'پیتزا', 'images/pizzaThree.png', NULL, 'active'),
(10, 'پیتزا مرغ', 25000, 'پیتزا', 'images/chickenPizza.png', NULL, 'active'),
(11, 'پیتزا پپرونی', 350000, 'پیتزا', 'images/pepperoniPizza.png', NULL, 'active'),
(12, 'پیتزا سبزیجات', 200000, 'پیتزا', 'images/pizza.png', NULL, 'active'),
(13, 'پاستا سبزیجات', 145000, 'پاستا', 'images/spaghetti.png', NULL, 'active'),
(14, 'پاستا بلونز', 170000, 'پاستا', 'images/meatSpaghetti.png', NULL, 'active'),
(15, 'پاستا پستو', 150000, 'پاستا', 'images/pestoPasta.png', NULL, 'active'),
(16, 'پاستا آلفردو', 200000, 'پاستا', 'images/alfredoPasta.png', NULL, 'active'),
(17, 'لازانیا', 150000, 'پاستا', 'images/lasagna.png', NULL, 'active'),
(18, 'مرغ سوخاری', 140000, 'سوخاری', 'images/fried-chicken.png', NULL, 'active'),
(19, 'شنیسل', 120000, 'سوخاری', 'images/schnitzel.png', NULL, 'active'),
(20, 'ماهی سوخاری و مخلفات', 260000, 'سوخاری', 'images/fish.png', NULL, 'active'),
(21, 'ساندویچ مرغ', 80000, 'ساندویچ', 'images/sandwich.png', NULL, 'active'),
(22, 'ساندویچ کلاب', 60000, 'ساندویچ', 'images/club.png', NULL, 'active'),
(23, 'ساندویج مکزیکی', 155000, 'ساندویچ', 'images/taco.png', NULL, 'active'),
(24, 'ساندویچ فلافل', 150000, 'ساندویچ', 'images/falafel.png', NULL, 'active'),
(25, 'رولت گوشت', 200000, 'ساندویچ', 'images/chicken-roll.png', NULL, 'active'),
(26, 'رولت سوسیس', 160000, 'ساندویچ', 'images/sausage-roll.png', NULL, 'active'),
(27, 'رولت مرغ', 175000, 'ساندویچ', 'images/spring-roll.png', NULL, 'active'),
(28, 'چلو جوجه', 225000, 'غذاهای ایرانی', 'images/chickenRice.png', NULL, 'active'),
(29, 'زرشک پلو با مرغ', 250000, 'غذاهای ایرانی', 'images/roastchichenrice.png', NULL, 'active'),
(30, 'خورشت کاری', 190000, 'غذاهای ایرانی', 'images/kare.png', NULL, 'active'),
(31, 'آبگوشت', 250000, 'غذاهای ایرانی', 'images/meat.png', NULL, 'active'),
(32, 'قرمه سبزی', 210000, 'غذاهای ایرانی', 'images/ghormesabzi.png', NULL, 'active'),
(33, 'میرزا قاسمی', 150000, 'غذاهای ایرانی', 'images/mirza.png', NULL, 'active'),
(34, 'استامبولی', 155000, 'غذاهای ایرانی', 'images/ghavareh.png', NULL, 'active'),
(35, 'فسنجان', 125000, 'غذاهای ایرانی', 'images/fesenjan.png', NULL, 'active'),
(36, 'خوراک گوشت', 240000, 'غذاهای ایرانی', 'images/khorak.png', NULL, 'active'),
(37, 'دلمه', 85000, 'غذاهای ایرانی', 'images/dolme.png', NULL, 'active'),
(38, 'سالاد میگو', 135000, 'سالاد', 'images/shrimpsalad.png', NULL, 'active'),
(39, 'سالاد سزار', 145000, 'سالاد', 'images/caesarsalad.png', NULL, 'active'),
(40, 'سالاد فصل', 120000, 'سالاد', 'images/simplesalad.png', NULL, 'active'),
(41, 'سالاد ماکارونی', 110000, 'سالاد', 'images/pastasalad.png', NULL, 'active'),
(42, 'لیموناد', 35000, 'نوشیدنی', 'images/limonade.png', NULL, 'active'),
(43, 'نوشابه بطری کوکاکولا', 30000, 'نوشیدنی', 'images/blackcola.png', NULL, 'active'),
(44, 'نوشابه قوطی کوکاکولا', 30000, 'نوشیدنی', 'images/can.png', NULL, 'active'),
(45, 'نوشابه قوطی پپسی', 30000, 'نوشیدنی', 'images/pepsican.png', NULL, 'active'),
(46, 'سیب زمینی سرخ کرده', 50000, 'متفرقه', 'images/french-fries.png', NULL, 'active'),
(47, 'ماست', 25000, 'متفرقه', 'images/yogurt.png', NULL, 'active'),
(48, 'مخلفات', 40000, 'متفرقه', 'images/side-dishes.png', NULL, 'active'),
(49, 'ماکارونی و پنیر پیتزا', 75000, 'متفرقه', 'images/cheesepasta.png', NULL, 'active'),
(50, 'پیتزا اسفناج', 220000, 'پیتزا', 'images/pizzanew_1.png', '', 'disabled');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('unread','read','replied') DEFAULT 'unread',
  `reply` text,
  `deleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `text`, `created_at`, `status`, `reply`, `deleted`) VALUES
(1, 1, 'تنوع نوشیدنی ها رو بیشتر کنید لطفا.', '2025-12-03 15:43:17', 'replied', 'در آینده حتما.', 0),
(2, 2, 'کیفیت غذاها خوب بود. ولی مدت زمان ارسال کمتر بشه بهتره.', '2025-12-05 09:57:25', 'read', '', 0),
(3, 7, 'پیتزا یه کم سفت بود، همبرگر بهتر بود.', '2025-12-08 18:12:36', '', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `shipping_fee`
--

DROP TABLE IF EXISTS `shipping_fee`;
CREATE TABLE IF NOT EXISTS `shipping_fee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fee` int NOT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `shipping_fee`
--

INSERT INTO `shipping_fee` (`id`, `fee`, `updated_at`) VALUES
(1, 70000, '2025-12-05 21:57:46'),
(2, 80000, '2025-12-05 22:00:06');

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `message` text,
  `reply` text,
  `status` enum('unread','read','replied') NOT NULL DEFAULT 'unread',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_by_user` tinyint(1) NOT NULL,
  `deleted_by_admin` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tickets`
--

INSERT INTO `tickets` (`id`, `user_id`, `title`, `message`, `reply`, `status`, `created_at`, `deleted_by_user`, `deleted_by_admin`) VALUES
(1, 1, 'مشکل در ثبت سفارش', 'کد رهگیری سفارشم نامعتبره', 'لطفا کد رهگیری سفارشتون رو بفرستید.', 'replied', '2025-12-03 14:35:07', 1, 0),
(2, 2, 'کد رهگیری', 'سفارشم رو ثبت کردم ولی کد رهگیری دریافت نکردم', NULL, '', '2025-12-05 13:05:13', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firstname` varchar(100) NOT NULL,
  `lastname` varchar(100) NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL,
  `avatar` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `firstname`, `lastname`, `gender`, `email`, `password`, `phone`, `role`, `created_at`, `deleted`, `avatar`) VALUES
(1, 'سینا', 'موسوی', 'male', 'sinamosavi33@gmail.com', 'sinaM12$', '09135623987', 'user', '2025-12-02 19:17:42', 0, NULL),
(2, 'فرزانه', 'ارجمند', 'female', 'alice.ln1010@gmail.com', 'yukinE@2020', '09231567294', 'user', '2025-12-03 12:16:43', 0, NULL),
(3, 'متین', 'مرادی', 'male', 'matinam3413@gmail.com', 'manman12$Ti', NULL, 'user', '2025-12-03 12:44:44', 0, NULL),
(4, 'سیمین', 'معتمدی', 'female', 'siminBN87@gmail.com', 'siminN%12', '09764719302', 'orders', '2025-12-05 18:08:47', 0, NULL),
(5, 'عرفان', 'سنایی', 'male', 'erfan10mani@gmail.com', 'erF53@10', NULL, 'support', '2025-12-07 09:42:57', 0, NULL),
(6, 'رضا', 'نریمانی', 'male', 'rezaRM65@gmail.com', 'armaniR&77', NULL, 'products', '2025-12-07 09:43:42', 0, NULL),
(7, 'نگار', 'آذین', 'female', 'fz.jafarii11@gmail.com', 'thisisMe11@', '09136051712', 'user', '2025-12-08 08:46:41', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_addresses`
--

DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE IF NOT EXISTS `user_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `location` text,
  `address` text,
  `full_address` text,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_addresses`
--

INSERT INTO `user_addresses` (`id`, `user_id`, `title`, `location`, `address`, `full_address`) VALUES
(20, 2, 'محل کار', 'اصفهان، پل سرهنگ', 'ساختمان اداری قاضی، طبقه 4، واحد 3', 'اصفهان، پل سرهنگ، ساختمان اداری قاضی، طبقه 4، واحد 3'),
(19, 1, 'خانه', 'اصفهان، کوی شهید کشوری', 'مجتمع یاس، واحد 23', 'اصفهان، کوی شهید کشوری، مجتمع یاس، واحد 23'),
(18, 1, 'خانه', 'اصفهان، سپاهان شهر', 'پلاک 3', 'اصفهان، سپاهان شهر، پلاک 3'),
(21, 2, 'محل کار', 'اصفهان، خیابان جی', 'مجتمع تجاری جالینوس، طبقه 4، واحد 10', 'اصفهان، خیابان جی، مجتمع تجاری جالینوس، طبقه 4، واحد 10'),
(22, 2, 'محل کار', 'اصفهان، پل سرهنگ', 'ساختمان اداری قاضی، طبقه 4، واحد 3', 'اصفهان، پل سرهنگ، ساختمان اداری قاضی، طبقه 4، واحد 3'),
(23, 4, 'خانه', 'اصفهان، کوی شهید کشوری', 'مجتمع میلاد، واحد 7', 'اصفهان، کوی شهید کشوری، مجتمع میلاد، واحد 7'),
(24, 7, 'خانه', 'اصفهان، کاوه', 'خیابان میرزایی، کوچه شریفی 11، پلاک 75', 'اصفهان، کاوه، خیابان میرزایی، کوچه شریفی 11، پلاک 75'),
(25, 4, 'خانه', 'اصفهان، کوی شهید کشوری', 'مجتمع میلاد، واحد 7', 'اصفهان، کوی شهید کشوری، مجتمع میلاد، واحد 7');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
